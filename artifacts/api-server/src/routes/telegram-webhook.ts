import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, transactionsTable, bookingsTable } from "@workspace/db";
import { eq, gte, and, sql } from "drizzle-orm";
import { answerCallbackQuery, editTelegramMessage } from "../lib/telegram.js";
import { logAudit } from "../lib/audit.js";
import { getSetting } from "../lib/settings.js";
import { istDateString, startOfDayIST, startOfDayForDateStringIST, endOfDayIST } from "../lib/time.js";

const router = Router();

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

async function replyToChat(chatId: number | string, text: string): Promise<void> {
  const botToken = await getSetting("telegram_bot_token");
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch { /* best-effort */ }
}

async function isAuthorized(telegramId: string): Promise<boolean> {
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);
  return !!user && ["owner", "admin", "staff"].includes(user.role);
}

async function handleCommand(text: string): Promise<string> {
  const [rawCmd, ...rest] = text.trim().split(/\s+/);
  const cmd = (rawCmd ?? "").split("@")[0]; // strip @BotUsername suffix for group chats

  if (cmd === "/users") {
    const users = await db.select().from(usersTable);
    const today = await db.select().from(usersTable).where(gte(usersTable.createdAt, startOfDayIST(0)));
    const walletTotal = users.reduce((s, u) => s + u.balance, 0);
    return `👥 <b>Users</b>\nTotal: ${users.length}\nToday's New: ${today.length}\nWallet Total: ₹${walletTotal}`;
  }

  if (cmd === "/today") {
    const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.bookingDate, istDateString()));
    const count = (s: string) => bookings.filter((b) => b.status === s).length;
    return `📅 <b>Today's Bookings</b>\nTotal: ${bookings.length}\nPending: ${count("pending_approval")}\nConfirmed: ${count("confirmed")}\nCancelled: ${count("cancelled")}\nCompleted: ${count("completed")}`;
  }

  if (cmd === "/sales") {
    const date = rest[0] ?? istDateString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Usage: /sales or /sales YYYY-MM-DD";
    const from = startOfDayForDateStringIST(date);
    const to = endOfDayIST(date);
    const txs = await db
      .select()
      .from(transactionsTable)
      .where(and(gte(transactionsTable.createdAt, from), sql`${transactionsTable.createdAt} <= ${to}`));
    let recharges = 0, payments = 0, cash = 0;
    for (const t of txs) {
      if (t.category === "recharge") recharges += t.amount;
      else if (t.category === "gaming_session") payments += t.amount;
      else if (t.category === "cash") cash += t.amount;
    }
    return `💵 <b>Sales — ${date}</b>\nWallet Recharges: ₹${recharges}\nWallet Payments: ₹${payments}\nCash Payments: ₹${cash}\n<b>Total: ₹${recharges + payments + cash}</b>`;
  }

  if (cmd === "/overallsales") {
    const [d0, d7, d30] = await Promise.all([
      db.select().from(transactionsTable).where(gte(transactionsTable.createdAt, startOfDayIST(0))),
      db.select().from(transactionsTable).where(gte(transactionsTable.createdAt, startOfDayIST(7))),
      db.select().from(transactionsTable).where(gte(transactionsTable.createdAt, startOfDayIST(30))),
    ]);
    const sum = (txs: typeof d0) =>
      txs.reduce((s, t) => s + (["recharge", "gaming_session", "cash"].includes(t.category) ? t.amount : 0), 0);
    const all = await db.select().from(transactionsTable);
    return `📊 <b>Overall Sales</b>\nToday: ₹${sum(d0)}\nWeekly: ₹${sum(d7)}\nMonthly: ₹${sum(d30)}\nLifetime: ₹${sum(all)}`;
  }

  // /access <phone> <telegram_id> — grant command access to another admin account
  // /access <phone> remove        — revoke access
  if (cmd === "/access") {
    const phone = rest[0];
    const tgId = rest[1];
    if (!phone || !tgId) return "Usage:\n/access &lt;phone&gt; &lt;telegram_id&gt;\n/access &lt;phone&gt; remove";

    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (!user) return `❌ No account found with phone ${phone}.`;
    if (!["owner", "admin", "staff"].includes(user.role))
      return `❌ ${user.name ?? phone} is not an admin/staff account.`;

    const newId = tgId.toLowerCase() === "remove" ? null : tgId;
    await db.update(usersTable).set({ telegramId: newId }).where(eq(usersTable.id, user.id));

    return newId
      ? `✅ Access granted to ${user.name ?? phone} (${user.role}).`
      : `✅ Access removed from ${user.name ?? phone}.`;
  }

  return "";
}

/* POST /api/telegram/webhook */
router.post("/webhook", requireTelegramSecret, async (req, res) => {
  try {
    const update = req.body;

    // Commands — only respond if sender's Telegram ID is in the DB as admin/owner/staff
    if (update.message?.text?.startsWith("/")) {
      const fromId = String(update.message.from?.id ?? "");
      if (fromId && await isAuthorized(fromId)) {
        const reply = await handleCommand(update.message.text);
        if (reply) await replyToChat(update.message.chat.id, reply);
      }
    }

    // Inline button callbacks — confirm/cancel bookings from notification messages
    if (update.callback_query) {
      const callbackQueryId: string | undefined = update.callback_query.id;
      const chatId = update.callback_query.message?.chat?.id;
      const messageId = update.callback_query.message?.message_id;
      const originalText: string = update.callback_query.message?.text ?? "";
      const [action, bookingIdStr] = (update.callback_query.data ?? "").split(":");
      const bookingId = Number(bookingIdStr);

      if (bookingId && (action === "confirm" || action === "cancel")) {
        const status = action === "confirm" ? "confirmed" : "cancelled";
        const extra: Record<string, unknown> = status === "confirmed"
          ? { approvedBy: "telegram", approvedAt: new Date() }
          : {};
        const [updated] = await db
          .update(bookingsTable)
          .set({ status, ...extra })
          .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "pending_approval")))
          .returning();

        if (updated) {
          await logAudit("telegram", action === "confirm" ? "Booking Approved" : "Booking Cancelled", null, `Booking #${bookingId} via Telegram`);
          if (callbackQueryId) await answerCallbackQuery(callbackQueryId, status === "confirmed" ? "Booking confirmed" : "Booking cancelled");
          if (chatId && messageId) {
            await editTelegramMessage(chatId, messageId, `${originalText}\n\n${status === "confirmed" ? "✅ Confirmed" : "❌ Cancelled"} via Telegram.`);
          }
        } else if (callbackQueryId) {
          await answerCallbackQuery(callbackQueryId, "Already processed.");
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
