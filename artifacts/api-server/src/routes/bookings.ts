import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, and, ne, gte, desc, sql } from "drizzle-orm";
import { verifyToken } from "../lib/auth.js";
import { notify } from "../lib/telegram.js";
import { logAudit } from "../lib/audit.js";
import { istDateString } from "../lib/time.js";

const router = Router();

/**
 * 30-minute time slots, 10 AM – 8 PM (cafe operating hours).
 * Must stay in sync with the frontend TIME_SLOTS constant.
 */
const TIME_SLOTS = [
  "10:00 AM – 10:30 AM", "10:30 AM – 11:00 AM",
  "11:00 AM – 11:30 AM", "11:30 AM – 12:00 PM",
  "12:00 PM – 12:30 PM", "12:30 PM – 01:00 PM",
  "01:00 PM – 01:30 PM", "01:30 PM – 02:00 PM",
  "02:00 PM – 02:30 PM", "02:30 PM – 03:00 PM",
  "03:00 PM – 03:30 PM", "03:30 PM – 04:00 PM",
  "04:00 PM – 04:30 PM", "04:30 PM – 05:00 PM",
  "05:00 PM – 05:30 PM", "05:30 PM – 06:00 PM",
  "06:00 PM – 06:30 PM", "06:30 PM – 07:00 PM",
  "07:00 PM – 07:30 PM", "07:30 PM – 08:00 PM",
] as const;

/**
 * Base pricing table (rupees): PRICING[players][durationMin]
 * Matches the Pricing section on the home page.
 * For durations > 60 min, cost is calculated additively (see calcCost).
 */
const PRICING: Record<number, Record<number, number>> = {
  1: { 30: 49,  60: 79  },
  2: { 30: 79,  60: 139 },
  3: { 30: 109, 60: 199 },
  4: { 30: 149, 60: 249 },
};

/**
 * Additive cost for any multiple-of-30 duration.
 * Greedily fills 60-min blocks (better rate), then adds a 30-min block if needed.
 * e.g. 90 min for 1P = PRICING[1][60] + PRICING[1][30] = 79 + 49 = 128
 */
export function calcCost(players: number, durationMin: number): number {
  const hours = Math.floor(durationMin / 60);
  const rem   = durationMin % 60;
  return hours * PRICING[players][60] + (rem >= 30 ? PRICING[players][30] : 0);
}

/**
 * Returns all 30-min slot indices covered by a booking starting at startSlot.
 * durationMin must be a multiple of 30.
 */
function coveredIndices(startSlot: string, durationMin: number): number[] {
  const idx = TIME_SLOTS.indexOf(startSlot as typeof TIME_SLOTS[number]);
  if (idx === -1) return [];
  const numSlots = Math.max(1, Math.round(durationMin / 30));
  return Array.from({ length: numSlots }, (_, i) => idx + i);
}

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  req.user = payload;
  next();
}

/* GET /api/bookings/slots?date=YYYY-MM-DD — returns all 30-min slots blocked on that date */
router.get("/slots", async (req, res) => {
  const { date } = req.query as { date?: string };
  if (!date) return res.status(400).json({ error: "date is required" });

  const active = await db
    .select({ timeSlot: bookingsTable.timeSlot, durationMin: bookingsTable.durationMin })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.bookingDate, date), ne(bookingsTable.status, "cancelled")));

  /* Expand each booking into its covered 30-min slot strings */
  const blocked = new Set<string>();
  for (const b of active) {
    for (const i of coveredIndices(b.timeSlot, b.durationMin)) {
      if (i >= 0 && i < TIME_SLOTS.length) blocked.add(TIME_SLOTS[i]);
    }
  }

  return res.json({ bookedSlots: [...blocked] });
});

/* POST /api/bookings — create a booking; wallet is deducted atomically, cash stays pending */
router.post("/", requireAuth, async (req: any, res) => {
  const { game, bookingDate, timeSlot, players, durationMin, notes, paymentMethod } = req.body as {
    game?: string;
    bookingDate?: string;
    timeSlot?: string;
    players?: number;
    durationMin?: number;
    notes?: string;
    paymentMethod?: "wallet" | "cash";
  };
  const method: "wallet" | "cash" = paymentMethod === "cash" ? "cash" : "wallet";

  if (!game || !bookingDate || !timeSlot) {
    return res.status(400).json({ error: "game, bookingDate, and timeSlot are required" });
  }

  const numPlayers  = Number(players ?? 1);
  const numDuration = Number(durationMin ?? 30);

  if (![1, 2, 3, 4].includes(numPlayers)) {
    return res.status(400).json({ error: "players must be 1, 2, 3, or 4" });
  }
  /* Allow any multiple of 30 from 30 up to 600 (max 10 hours) */
  if (numDuration < 30 || numDuration % 30 !== 0 || numDuration > 600) {
    return res.status(400).json({ error: "durationMin must be a multiple of 30 between 30 and 600 (max 10 hours)" });
  }

  const slotIdx = TIME_SLOTS.indexOf(timeSlot as typeof TIME_SLOTS[number]);
  if (slotIdx === -1) {
    return res.status(400).json({ error: "Invalid time slot" });
  }

  const numSlots = Math.round(numDuration / 30);
  if (slotIdx + numSlots > TIME_SLOTS.length) {
    return res.status(400).json({ error: "Not enough time remaining for this session length at the selected slot" });
  }

  const bookingCost = calcCost(numPlayers, numDuration);

  /* Validate only today or tomorrow */
  const todayStr    = istDateString();
  const tomorrowStr = istDateString(new Date(Date.now() + 86400000));
  if (bookingDate !== todayStr && bookingDate !== tomorrowStr) {
    return res.status(400).json({ error: "Bookings are only allowed for today and tomorrow" });
  }

  const userId: number = req.user.userId;

  class BookingError extends Error {
    constructor(public status: number, public body: Record<string, unknown>) { super(); }
  }

  const durationLabel = (() => {
    const h = Math.floor(numDuration / 60);
    const m = numDuration % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}hr`;
    return `${h}h${m}min`;
  })();

  let booking: typeof bookingsTable.$inferSelect;
  let newBalance: number | null;

  try {
    ({ booking, newBalance } = await db.transaction(async (tx) => {
      /* ── 1. Overlap-aware slot conflict check ─────────────────────────── */
      const active = await tx
        .select({ timeSlot: bookingsTable.timeSlot, durationMin: bookingsTable.durationMin })
        .from(bookingsTable)
        .where(and(eq(bookingsTable.bookingDate, bookingDate), ne(bookingsTable.status, "cancelled")));

      const newCovered = new Set(coveredIndices(timeSlot, numDuration));
      for (const b of active) {
        for (const i of coveredIndices(b.timeSlot, b.durationMin)) {
          if (newCovered.has(i)) {
            throw new BookingError(409, { error: "One or more of the requested slots is already booked. Please choose another time." });
          }
        }
      }

      let balanceAfter: number | null = null;

      if (method === "wallet") {
        /* ── 2. Atomic balance deduction ──────────────────────────────────── */
        const [deducted] = await tx
          .update(usersTable)
          .set({ balance: sql`${usersTable.balance} - ${bookingCost}` })
          .where(and(eq(usersTable.id, userId), gte(usersTable.balance, bookingCost)))
          .returning({ balance: usersTable.balance });

        if (!deducted) {
          const [current] = await tx
            .select({ balance: usersTable.balance })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);
          throw new BookingError(402, {
            error: `Insufficient wallet balance. You need ₹${bookingCost} to book this session. Current balance: ₹${current?.balance ?? 0}.`,
            balance: current?.balance ?? 0,
            required: bookingCost,
          });
        }

        await tx.insert(transactionsTable).values({
          userId,
          type: "debit",
          amount: bookingCost,
          description: `Booking: ${game} · ${numPlayers}P · ${durationLabel} on ${bookingDate} at ${timeSlot}`,
          category: "gaming_session",
        });
        balanceAfter = deducted.balance;
      }

      /* ── Create booking ────────────────────────────────────────────── */
      const [created] = await tx
        .insert(bookingsTable)
        .values({
          userId,
          game,
          bookingDate,
          timeSlot,
          players: numPlayers,
          durationMin: numDuration,
          notes: notes || null,
          paymentMethod: method,
          status: "pending_approval",
          paymentStatus: method === "wallet" ? "paid_wallet" : "pending_cash",
        })
        .returning();

      return { booking: created, newBalance: balanceAfter };
    }));
  } catch (err) {
    if (err instanceof BookingError) return res.status(err.status).json(err.body);
    throw err;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  await notify(
    "notify_booking_created",
    `🎮 <b>New Booking — Pending Approval</b>\nUser: ${user?.name ?? user?.username ?? user?.phone}\nUser ID: ${userId}\nPhone: ${user?.phone}\nGame: ${game}\nPlayers: ${numPlayers}\nDate: ${bookingDate}\nTime: ${timeSlot}\nDuration: ${durationLabel}\nPayment: ${method === "wallet" ? "Wallet" : "Cash"}`,
    { buttons: [[{ text: "✅ Confirm Booking", callback_data: `confirm:${booking.id}` }, { text: "❌ Cancel Booking", callback_data: `cancel:${booking.id}` }]] },
  );
  await logAudit("system", "Booking Created", user?.username ?? user?.phone, `Booking #${booking.id} for ${game} on ${bookingDate} at ${timeSlot}`);

  return res.status(201).json({ booking, balance: newBalance });
});

/* GET /api/bookings — list current user's bookings */
router.get("/", requireAuth, async (req: any, res) => {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.userId, req.user.userId))
    .orderBy(desc(bookingsTable.createdAt));

  return res.json({ bookings });
});

export default router;
