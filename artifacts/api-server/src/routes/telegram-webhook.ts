import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, transactionsTable, bookingsTable } from "@workspace/db";
import { eq, gte, and, sql } from "drizzle-orm";
import { answerCallbackQuery, editTelegramMessage } from "../lib/telegram.js";
import { logAudit } from "../lib/audit.js";
import { getSetting } from "../lib/settings.js";
import { verifyPassword } from "../lib/auth.js";
import { istDateString, startOfDayIST, startOfDayForDateStringIST, endOfDayIST } from "../lib/time.js";

const router = Router();

/**
 * Telegram calls the webhook with the secret token configured via
 * setWebhook(..., secret_token=...) echoed back in this header. Reject
 * any request that doesn't match, so arbitrary callers can't forge
 * booking confirm/cancel callbacks or bot commands.
 */
async function requireTelegramSecret(req: any, res: any, next: any) {
  const configuredSecret = await getSetting("telegram_webhook_secret");
  if (!configuredSecret) {
    return res.status(503).json({ ok: false, error: "Telegram webhook secret not configured" });
  }
  const provided = req.headers["x-telegram-bot-api-secret-token"];
  if (provided !== configuredSecret) {
    return res.status(401).json({ ok: false, error: "Invalid webhook secret" });
  }
  next();
}

/** Send a message directly to a specific chat (used for command replies). */
async function replyToChat(chatId: number | string, text: string): Promise<void> {
  const botToken = await getSetting("telegram_bot_token");
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    // best-effort
  }
}

/** Returns the admin user linked to this Telegram ID, or null if not found / not admin. */
async function getLinkedAdmin(telegramId: string): Promise<typeof usersTable.$inferSelect | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);
  if (!user) return null;
  if (!["owner", "admin", "staff"].includes(user.role)) return null;
  return user;
}

function todayStr(): string {
  return istDateString();
}

function startOfDay(daysAgo: number): Date {
  return startOfDayIST(daysAgo);
}

async function revenueBetween(fromDate: Date): Promise<{ recharges: number; payments: number; cash: number; total: number }> {
  const txs = await db.select().from(transactionsTable).where(gte(transactionsTable.createdAt, fromDate));
  let recharges = 0, payments = 0, cash = 0;
  for (const t of txs) {
    if (t.category === "recharge") recharges += t.amount;
    else if (t.category === "gaming_session") payments += t.amount;
    else if (t.category === "cash") cash += t.amount;
  }
  return { recharges, payments, cash, total: recharges + payments + cash };
}

async function handleCommand(text: string): Promise<string> {
  const [rawCmd, ...rest] = text.trim().split(/\s+/);
  // In group chats Telegram sends commands as "/cmd@BotUsername" — strip the
  // "@BotUsername" suffix so the match below works the same in DMs and groups.
  const cmd = (rawCmd ?? "").split("@")[0];

  if (cmd === "/users") {
    const users = await db.select().from(usersTable);
    const today = await db.select().from(usersTable).where(gte(usersTable.createdAt, startOfDay(0)));
    const walletTotal = users.reduce((s, u) => s + u.balance, 0);
    return `👥 <b>Users</b>\nTotal: ${users.length}\nToday's New: ${today.length}\nWallet Total: ₹${walletTotal}`;
  }

  if (cmd === "/today") {
    const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.bookingDate, todayStr()));
    const count = (s: string) => bookings.filter((b) => b.status === s).length;
    return `📅 <b>Today's Bookings</b>\nTotal: ${bookings.length}\nPending: ${count("pending_approval")}\nConfirmed: ${count("confirmed")}\nCancelled: ${count("cancelled")}\nCompleted: ${count("completed")}`;
  }

  if (cmd === "/sales") {
    const dateArg = rest[0];
    const date = dateArg ?? todayStr();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Usage: /sales or /sales YYYY-MM-DD";
    const from = startOfDayForDateStringIST(date);
    const to = endOfDayIST(date);
    const txs = await db.select().from(transactionsTable).where(and(gte(transactionsTable.createdAt, from), sql`${transactionsTable.createdAt} <= ${to}`));
    let recharges = 0, payments = 0, cashPay = 0;
    for (const t of txs) {
      if (t.category === "recharge") recharges += t.amount;
      else if (t.category === "gaming_session") payments += t.amount;
      else if (t.category === "cash") cashPay += t.amount;
    }
    const total = recharges + payments + cashPay;
    return `💵 <b>Sales — ${date}</b>\nWallet Recharges: ₹${recharges}\nWallet Payments: ₹${payments}\nCash Payments: ₹${cashPay}\n<b>Total: ₹${total}</b>`;
  }

  if (cmd === "/overallsales") {
    const [today, week, month] = await Promise.all([
      revenueBetween(startOfDay(0)),
      revenueBetween(startOfDay(7)),
      revenueBetween(startOfDay(30)),
    ]);
    const allTxs = await db.select().from(transactionsTable);
    const lifetime = allTxs.reduce((s, t) => s + (t.category === "recharge" || t.category === "gaming_session" || t.category === "cash" ? t.amount : 0), 0);
    return `📊 <b>Overall Sales</b>\nToday: ₹${today.total}\nWeekly: ₹${week.total}\nMonthly: ₹${month.total}\nLifetime: ₹${lifetime}`;
  }

  return "Unknown command. Available:\n/users /today /sales /overallsales\n/link &lt;phone&gt; &lt;password&gt;\n/unlink";
}

/**
 * Handles /link <phone> <password> — authenticates against the DB and stores
 * the sender's Telegram user ID on their account so future commands are
 * authorized without entering any random ID.
 */
async function handleLink(text: string, telegramId: string): Promise<string> {
  const parts = text.trim().split(/\s+/);
  // parts: ["/link", "<phone>", "<password>"]
  if (parts.length < 3) {
    return "Usage: /link &lt;phone&gt; &lt;password&gt;\n\nLinks your Telegram account to your Royal Gaming Zone admin account.";
  }
  const phone = parts[1]!;
  const password = parts.slice(2).join(" ");

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user || !user.passwordHash) return "❌ Invalid phone or password.";
  if (!verifyPassword(password, user.passwordHash)) return "❌ Invalid phone or password.";
  if (!["owner", "admin", "staff"].includes(user.role)) return "❌ Your account does not have admin access.";

  // Check if this Telegram ID is already linked to a different account
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.telegramId, telegramId)).limit(1);
  if (existing && existing.id !== user.id) {
    return "⚠️ This Telegram account is already linked to a different user. Use /unlink first.";
  }

  await db.update(usersTable).set({ telegramId }).where(eq(usersTable.id, user.id));
  return `✅ Linked! Your Telegram account is now connected to <b>${user.name ?? user.phone}</b> (${user.role}).\n\nYou can now use /users /today /sales /overallsales.`;
}

/** Unlinks the sender's Telegram account from their DB account. */
async function handleUnlink(telegramId: string): Promise<string> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.telegramId, telegramId)).limit(1);
  if (!user) return "ℹ️ Your Telegram account is not linked to any account.";
  await db.update(usersTable).set({ telegramId: null }).where(eq(usersTable.id, user.id));
  return `✅ Unlinked your Telegram account from <b>${user.name ?? user.phone}</b>.`;
}

/* POST /api/telegram/webhook — Telegram bot webhook (commands + inline button callbacks) */
router.post("/webhook", requireTelegramSecret, async (req, res) => {
  try {
    const update = req.body;

    if (update.message?.text?.startsWith("/")) {
      const msgText: string = update.message.text;
      const fromId: string = String(update.message.from?.id ?? "");
      const replyChatId: number | string = update.message.chat?.id ?? fromId;

      const [rawCmd] = msgText.trim().split(/\s+/);
      const cmd = (rawCmd ?? "").split("@")[0];

      if (cmd === "/link") {
        const reply = await handleLink(msgText, fromId);
        await replyToChat(replyChatId, reply);
      } else if (cmd === "/unlink") {
        const reply = await handleUnlink(fromId);
        await replyToChat(replyChatId, reply);
      } else if (cmd === "/start") {
        await replyToChat(replyChatId, "👋 Welcome to Royal Gaming Zone bot!\n\nUse /link &lt;phone&gt; &lt;password&gt; to connect your admin account and unlock commands.");
      } else {
        // All other commands require a linked admin account
        const admin = await getLinkedAdmin(fromId);
        if (!admin) {
          await replyToChat(replyChatId, "⛔ Not authorized.\n\nUse /link &lt;phone&gt; &lt;password&gt; to connect your account.");
        } else {
          const reply = await handleCommand(msgText);
          await replyToChat(replyChatId, reply);
        }
      }
    }

    if (update.callback_query) {
      const callbackQueryId: string | undefined = update.callback_query.id;
      const chatId = update.callback_query.message?.chat?.id;
      const messageId = update.callback_query.message?.message_id;
      const originalText: string = update.callback_query.message?.text ?? "";
      const data: string = update.callback_query.data ?? "";
      const [action, bookingIdStr] = data.split(":");
      const bookingId = Number(bookingIdStr);

      if (bookingId && (action === "confirm" || action === "cancel")) {
        const status = action === "confirm" ? "confirmed" : "cancelled";
        const updates: Record<string, unknown> = { status };
        if (status === "confirmed") { updates.approvedBy = "telegram"; updates.approvedAt = new Date(); }
        // Only act on bookings still pending approval — prevents double-processing if the
        // buttons are tapped more than once before Telegram removes them.
        const [updated] = await db
          .update(bookingsTable)
          .set(updates)
          .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "pending_approval")))
          .returning();

        if (updated) {
          await logAudit("telegram", action === "confirm" ? "Booking Approved" : "Booking Cancelled", null, `Booking #${bookingId} via Telegram`);
          if (callbackQueryId) await answerCallbackQuery(callbackQueryId, status === "confirmed" ? "Booking confirmed" : "Booking cancelled");
          // Remove the inline buttons and mark the original message so it's clear the action was taken.
          if (chatId && messageId) {
            await editTelegramMessage(chatId, messageId, `${originalText}\n\n${status === "confirmed" ? "✅ Confirmed" : "❌ Cancelled"} via Telegram.`);
          } else {
            await replyToChat(chatId ?? "", `Booking #${bookingId} ${status === "confirmed" ? "✅ confirmed" : "❌ cancelled"} via Telegram.`);
          }
        } else if (callbackQueryId) {
          await answerCallbackQuery(callbackQueryId, "This booking was already processed.");
        }
      } else if (callbackQueryId) {
        await answerCallbackQuery(callbackQueryId);
      }
    }

    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
});

export default router;
