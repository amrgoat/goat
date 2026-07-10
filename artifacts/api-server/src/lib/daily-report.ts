import { db } from "@workspace/db";
import { usersTable, transactionsTable, bookingsTable } from "@workspace/db";
import { gte, and, sql } from "drizzle-orm";
import { notify, sendEmergencyAlert } from "./telegram.js";
import { logger } from "./logger.js";
import { startOfDayIST, istDateLabel, msUntilNext2359IST } from "./time.js";

export async function sendDailyReport(): Promise<void> {
  try {
    const from = startOfDayIST(0);
    const [newUsers, txs, bookings] = await Promise.all([
      db.select().from(usersTable).where(gte(usersTable.createdAt, from)),
      db.select().from(transactionsTable).where(gte(transactionsTable.createdAt, from)),
      db.select().from(bookingsTable).where(gte(bookingsTable.createdAt, from)),
    ]);

    const recharges = txs.filter((t) => t.category === "recharge").reduce((s, t) => s + t.amount, 0);
    const deductions = txs.filter((t) => t.type === "debit" && t.category !== "gaming_session").reduce((s, t) => s + t.amount, 0);
    const cashPayments = txs.filter((t) => t.category === "cash").reduce((s, t) => s + t.amount, 0);
    const walletPayments = txs.filter((t) => t.category === "gaming_session").reduce((s, t) => s + t.amount, 0);
    const revenue = recharges + walletPayments + cashPayments;

    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const completed = bookings.filter((b) => b.status === "completed").length;

    const gameCounts = new Map<string, number>();
    for (const b of bookings) gameCounts.set(b.game, (gameCounts.get(b.game) ?? 0) + 1);
    const mostPlayed = [...gameCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const text = `📋 <b>Daily Report — ${istDateLabel(from)}</b>

👥 New Users: ${newUsers.length}
💰 Wallet Recharges: ₹${recharges}
💳 Wallet Deductions: ₹${deductions}

📅 Bookings: ${bookings.length}
  ✅ Confirmed: ${confirmed}
  ❌ Cancelled: ${cancelled}
  🏁 Completed: ${completed}

💵 Cash Payments: ₹${cashPayments}
💳 Wallet Payments: ₹${walletPayments}

<b>Total Revenue: ₹${revenue}</b>
🎮 Most Played: ${mostPlayed}`;

    await notify("notify_daily_report", text);
  } catch (err) {
    logger.error({ err }, "Failed to generate daily report");
    await sendEmergencyAlert("Daily Report Generation Failed", (err as Error).message);
  }
}

/** Schedules the daily report to fire at 23:59 IST, then every 24h after. */
export function scheduleDailyReport(): void {
  const { delayMs, nextRun } = msUntilNext2359IST();

  setTimeout(function run() {
    sendDailyReport();
    setInterval(sendDailyReport, 24 * 60 * 60 * 1000);
  }, delayMs);

  logger.info({ nextRunIST: istDateLabel(nextRun) + " 23:59 IST" }, "Daily report scheduled");
}
