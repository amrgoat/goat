import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { answerCallbackQuery, editTelegramMessage } from "../lib/telegram.js";
import { logAudit } from "../lib/audit.js";
import { getSetting } from "../lib/settings.js";

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

/* POST /api/telegram/webhook — receives inline button callbacks for booking confirm/cancel */
router.post("/webhook", requireTelegramSecret, async (req, res) => {
  try {
    const update = req.body;

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
        if (status === "confirmed") {
          updates.approvedBy = "telegram";
          updates.approvedAt = new Date();
        }
        // Only act on bookings still pending — prevents double-processing.
        const [updated] = await db
          .update(bookingsTable)
          .set(updates)
          .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "pending_approval")))
          .returning();

        if (updated) {
          await logAudit("telegram", action === "confirm" ? "Booking Approved" : "Booking Cancelled", null, `Booking #${bookingId} via Telegram`);
          if (callbackQueryId) {
            await answerCallbackQuery(callbackQueryId, status === "confirmed" ? "Booking confirmed" : "Booking cancelled");
          }
          if (chatId && messageId) {
            await editTelegramMessage(chatId, messageId, `${originalText}\n\n${status === "confirmed" ? "✅ Confirmed" : "❌ Cancelled"} via Telegram.`);
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
