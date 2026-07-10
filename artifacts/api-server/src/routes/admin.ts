import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, transactionsTable, bookingsTable } from "@workspace/db";
import { eq, desc, or, ilike, sql, and, gte } from "drizzle-orm";
import { hashPassword, verifyToken } from "../lib/auth.js";
import { notify, sendEmergencyAlert } from "../lib/telegram.js";
import { logAudit } from "../lib/audit.js";
import { calcCost as calcSessionCost } from "./bookings.js";

/** Returns full session range label, e.g. "01:00 PM – 03:00 PM" for a 2-hr booking. */
function sessionRangeLabel(startSlot: string, durationMin: number | null | undefined): string {
  const dur = Number(durationMin) || 0;
  if (dur <= 30) return startSlot;
  const startTime = startSlot.split(/\s*[–-]\s*/)[0]?.trim();
  if (!startTime) return startSlot;
  const m = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return startSlot;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  const startMin = h * 60 + min;
  const endMin   = startMin + dur;
  const fmt = (t: number) => {
    const hh = Math.floor(t / 60) % 24;
    const mm = t % 60;
    const p  = hh < 12 ? "AM" : "PM";
    const hh12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return `${String(hh12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${p}`;
  };
  return `${fmt(startMin)} – ${fmt(endMin)}`;
}

const router = Router();

/** In-memory failed login tracker: phone -> { count, firstAt } */
const failedLogins = new Map<string, { count: number; firstAt: number }>();
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Roles that can access the admin portal */
const ADMIN_ROLES = ["owner", "admin", "staff"];
/** Roles that can manage other accounts (change roles, delete, reset passwords) */
const MANAGER_ROLES = ["owner", "admin"];

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload || (!payload.isAdmin && !ADMIN_ROLES.includes(payload.role as string))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.admin = payload;
  next();
}

function requireManager(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload || !MANAGER_ROLES.includes(payload.role as string)) {
    return res.status(403).json({ error: "Forbidden: owner or admin role required" });
  }
  req.admin = payload;
  next();
}

/* POST /api/admin/login */
router.post("/login", async (req, res) => {
  const { phone, password } = req.body as { phone?: string; password?: string };
  if (!phone || !password) return res.status(400).json({ error: "Phone and password required" });

  const fail = async () => {
    const entry = failedLogins.get(phone);
    const now = Date.now();
    if (!entry || now - entry.firstAt > FAILED_LOGIN_WINDOW_MS) {
      failedLogins.set(phone, { count: 1, firstAt: now });
    } else {
      entry.count += 1;
      if (entry.count === 5) {
        await sendEmergencyAlert("More Than 5 Failed Login Attempts", `Phone: ${phone}`);
      }
    }
  };

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user || !user.passwordHash) { await fail(); return res.status(401).json({ error: "Invalid credentials" }); }
  if (!ADMIN_ROLES.includes(user.role) && !user.isAdmin) {
    return res.status(403).json({ error: "Not an admin account" });
  }

  const parts = user.passwordHash.split(":");
  if (parts.length !== 2) { await fail(); return res.status(401).json({ error: "Invalid credentials" }); }
  const candidate = (await import("crypto")).default.scryptSync(password, parts[0], 64).toString("hex");
  if (candidate !== parts[1]) { await fail(); return res.status(401).json({ error: "Invalid credentials" }); }

  failedLogins.delete(phone);

  const userAgent = req.headers["user-agent"] ?? "unknown";
  if (user.lastLoginUserAgent && user.lastLoginUserAgent !== userAgent) {
    await sendEmergencyAlert(
      "Admin Login From New Device",
      `Account: ${user.username ?? user.phone} (ID ${user.id})\nRole: ${user.role}\nDevice: ${userAgent}`,
    ).catch(() => {});
  }
  await db
    .update(usersTable)
    .set({ failedLoginAttempts: 0, lastLoginUserAgent: userAgent, lastLoginAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const { signToken } = await import("../lib/auth.js");
  const token = signToken({ userId: user.id, phone: user.phone, isAdmin: true, role: user.role, name: user.name });
  return res.json({ token, phone: user.phone, role: user.role, name: user.name });
});

/* GET /api/admin/search?query= — search users by username, ID, or phone (for Recharge/Payment pages) */
router.get("/search", requireAdmin, async (req, res) => {
  const q = String(req.query.query ?? "").trim();
  if (!q) return res.json({ users: [] });

  const conditions = [ilike(usersTable.phone, `%${q}%`), ilike(usersTable.username, `%${q}%`)];
  if (/^\d+$/.test(q)) conditions.push(eq(usersTable.id, Number(q)));

  const users = await db.select().from(usersTable).where(or(...conditions)).limit(20);
  return res.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      phone: u.phone,
      balance: u.balance,
      role: u.role,
    })),
  });
});

/* POST /api/admin/wallet/recharge — credit a user's wallet (atomic increment) */
router.post("/wallet/recharge", requireAdmin, async (req: any, res) => {
  const { userId, amount } = req.body as { userId?: number; amount?: number };
  if (!userId || !amount || amount <= 0) return res.status(400).json({ error: "userId and a positive amount are required" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const previousBalance = user.balance;
  const adminName = req.admin.name ?? req.admin.phone ?? "admin";

  const [updated] = await db
    .update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${amount}` })
    .where(eq(usersTable.id, userId))
    .returning();
  const newBalance = updated.balance;
  await db.insert(transactionsTable).values({
    userId,
    type: "credit",
    amount,
    description: `Wallet recharge by ${adminName}`,
    category: "recharge",
    adminName,
  });
  await logAudit(adminName, "Recharge Wallet", user.username ?? user.phone, `Credited ₹${amount} (₹${previousBalance} → ₹${newBalance})`);
  await notify(
    "notify_wallet_recharge",
    `💰 <b>Wallet Recharged</b>\nUser: ${user.name ?? user.username ?? user.phone}\nAmount: ₹${amount}\nNew Balance: ₹${newBalance}\nBy: ${adminName}`,
  );

  return res.json({ success: true, user: { id: updated.id, username: updated.username, phone: updated.phone, balance: updated.balance }, previousBalance, newBalance });
});

/* POST /api/admin/wallet/payment — deduct from a user's wallet (gaming session, food, other; atomic, race-safe) */
router.post("/wallet/payment", requireAdmin, async (req: any, res) => {
  const { userId, amount, reason } = req.body as { userId?: number; amount?: number; reason?: string };
  if (!userId || !amount || amount <= 0) return res.status(400).json({ error: "userId and a positive amount are required" });
  const validReasons = ["Gaming Session", "Food", "Other"];
  const paymentReason = reason && validReasons.includes(reason) ? reason : "Other";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const previousBalance = user.balance;
  const adminName = req.admin.name ?? req.admin.phone ?? "admin";

  const [updated] = await db
    .update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${amount}` })
    .where(and(eq(usersTable.id, userId), gte(usersTable.balance, amount)))
    .returning();
  if (!updated) return res.status(400).json({ error: "Insufficient wallet balance" });
  const newBalance = updated.balance;
  await db.insert(transactionsTable).values({
    userId,
    type: "debit",
    amount,
    description: `${paymentReason} payment by ${adminName}`,
    category: paymentReason.toLowerCase().replace(" ", "_"),
    adminName,
  });
  await logAudit(adminName, "Deduct Payment", user.username ?? user.phone, `Deducted ₹${amount} for ${paymentReason} (₹${previousBalance} → ₹${newBalance})`);
  await notify(
    "notify_wallet_deduction",
    `💳 <b>Wallet Payment</b>\nUser: ${user.name ?? user.username ?? user.phone}\nReason: ${paymentReason}\nAmount: ₹${amount}\nNew Balance: ₹${newBalance}\nBy: ${adminName}`,
  );

  return res.json({ success: true, user: { id: updated.id, username: updated.username, phone: updated.phone, balance: updated.balance }, previousBalance, newBalance });
});

/* GET /api/admin/accounts */
router.get("/accounts", requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable);
  return res.json({
    accounts: users.map((u) => ({
      id: u.id,
      phone: u.phone,
      username: u.username,
      name: u.name,
      balance: u.balance,
      isAdmin: u.isAdmin,
      role: u.role,
      createdAt: u.createdAt,
    })),
  });
});

/* GET /api/admin/accounts/:phone */
router.get("/accounts/:phone", requireAdmin, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, req.params.phone)).limit(1);
  if (!user) return res.status(404).json({ error: "Account not found" });
  return res.json({
    id: user.id,
    phone: user.phone,
    username: user.username,
    name: user.name,
    balance: user.balance,
    isAdmin: user.isAdmin,
    role: user.role,
    createdAt: user.createdAt,
  });
});

/* GET /api/admin/accounts/:phone/transactions */
router.get("/accounts/:phone/transactions", requireAdmin, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, req.params.phone)).limit(1);
  if (!user) return res.status(404).json({ error: "Account not found" });
  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(50);
  return res.json({ transactions: txs });
});

/* PUT /api/admin/accounts/:phone */
router.put("/accounts/:phone", requireAdmin, async (req, res) => {
  const { name, balance } = req.body as { name?: string; balance?: number };
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, req.params.phone)).limit(1);
  if (!existing) return res.status(404).json({ error: "Account not found" });

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (balance !== undefined) updates.balance = balance;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.phone, req.params.phone)).returning();
  return res.json({
    id: user.id,
    phone: user.phone,
    username: user.username,
    name: user.name,
    balance: user.balance,
    isAdmin: user.isAdmin,
    role: user.role,
    createdAt: user.createdAt,
  });
});

/* PUT /api/admin/accounts/:phone/role — change a user's role */
router.put("/accounts/:phone/role", requireManager, async (req: any, res) => {
  const { role } = req.body as { role?: string };
  const validRoles = ["player", "staff", "admin", "owner"];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: "role must be one of: player, staff, admin, owner" });
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.phone, req.params.phone)).limit(1);
  if (!target) return res.status(404).json({ error: "Account not found" });

  // Prevent modifying own role
  if (target.id === req.admin.userId) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }

  const isAdmin = ["owner", "admin", "staff"].includes(role);
  const [user] = await db
    .update(usersTable)
    .set({ role, isAdmin })
    .where(eq(usersTable.phone, req.params.phone))
    .returning();

  return res.json({
    id: user.id,
    phone: user.phone,
    username: user.username,
    name: user.name,
    balance: user.balance,
    isAdmin: user.isAdmin,
    role: user.role,
    createdAt: user.createdAt,
  });
});

/* POST /api/admin/accounts/:phone/password — reset a user's password */
router.post("/accounts/:phone/password", requireManager, async (req: any, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.phone, req.params.phone)).limit(1);
  if (!target) return res.status(404).json({ error: "Account not found" });

  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(password) })
    .where(eq(usersTable.phone, req.params.phone));

  return res.json({ success: true, message: "Password updated successfully" });
});

/* DELETE /api/admin/accounts/:phone — delete an account */
router.delete("/accounts/:phone", requireManager, async (req: any, res) => {
  const [target] = await db.select().from(usersTable).where(eq(usersTable.phone, req.params.phone)).limit(1);
  if (!target) return res.status(404).json({ error: "Account not found" });

  // Prevent deleting own account
  if (target.id === req.admin.userId) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  // Delete transactions and bookings first
  await db.delete(transactionsTable).where(eq(transactionsTable.userId, target.id));
  await db.delete(bookingsTable).where(eq(bookingsTable.userId, target.id));
  await db.delete(usersTable).where(eq(usersTable.id, target.id));

  return res.json({ success: true, message: "Account deleted" });
});

/* POST /api/admin/accounts/:phone/balance — add or remove balance */
router.post("/accounts/:phone/balance", requireAdmin, async (req, res) => {
  const { amount, description } = req.body as { amount?: number; description?: string };
  if (amount === undefined || amount === 0) return res.status(400).json({ error: "Amount required and must not be zero" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, req.params.phone)).limit(1);
  if (!user) return res.status(404).json({ error: "Account not found" });

  const newBalance = user.balance + amount;
  if (newBalance < 0) return res.status(400).json({ error: "Insufficient balance" });

  const [updated] = await db
    .update(usersTable)
    .set({ balance: newBalance })
    .where(eq(usersTable.phone, req.params.phone))
    .returning();

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: amount > 0 ? "credit" : "debit",
    amount: Math.abs(amount),
    description: description || (amount > 0 ? "Balance added by admin" : "Balance removed by admin"),
  });

  return res.json({
    id: updated.id,
    phone: updated.phone,
    username: updated.username,
    name: updated.name,
    balance: updated.balance,
    isAdmin: updated.isAdmin,
    role: updated.role,
    createdAt: updated.createdAt,
  });
});

/* POST /api/admin/accounts */
router.post("/accounts", requireAdmin, async (req, res) => {
  const { phone, password, username, name, balance } = req.body as {
    phone?: string;
    password?: string;
    username?: string;
    name?: string;
    balance?: number;
  };
  if (!phone || !password) return res.status(400).json({ error: "Phone and password required" });
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: "Phone must be 10 digits" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 3–20 characters: letters, numbers, or underscores only" });
  }

  const existingPhone = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (existingPhone.length > 0) return res.status(409).json({ error: "Account already exists" });

  if (username) {
    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existingUsername.length > 0) return res.status(409).json({ error: "That username is already taken" });
  }

  const [user] = await db.insert(usersTable).values({
    phone,
    username: username || null,
    passwordHash: hashPassword(password),
    name: name || null,
    balance: balance ?? 0,
    isAdmin: false,
    role: "player",
  }).returning();

  return res.status(201).json({
    id: user.id,
    phone: user.phone,
    username: user.username,
    name: user.name,
    balance: user.balance,
    isAdmin: user.isAdmin,
    role: user.role,
    createdAt: user.createdAt,
  });
});

/* GET /api/admin/bookings — list all bookings with user info */
router.get("/bookings", requireAdmin, async (_req, res) => {
  const bookings = await db
    .select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      game: bookingsTable.game,
      bookingDate: bookingsTable.bookingDate,
      timeSlot: bookingsTable.timeSlot,
      players: bookingsTable.players,
      durationMin: bookingsTable.durationMin,
      notes: bookingsTable.notes,
      paymentMethod: bookingsTable.paymentMethod,
      paymentStatus: bookingsTable.paymentStatus,
      status: bookingsTable.status,
      createdAt: bookingsTable.createdAt,
      phone: usersTable.phone,
      name: usersTable.name,
    })
    .from(bookingsTable)
    .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
    .orderBy(desc(bookingsTable.createdAt));

  return res.json({ bookings });
});

const BOOKING_STATUSES = ["pending_approval", "confirmed", "cancelled", "completed", "no_show"];

/* PUT /api/admin/bookings/:id/status — update booking status (confirm/cancel/etc) */
router.put("/bookings/:id/status", requireAdmin, async (req: any, res) => {
  const { status } = req.body as { status?: string };
  if (!status || !BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${BOOKING_STATUSES.join(", ")}` });
  }
  const adminName = req.admin.name ?? req.admin.phone ?? "admin";
  const bookingId = Number(req.params.id);

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!existing) return res.status(404).json({ error: "Booking not found" });

  /* Refund the wallet if a wallet-paid booking is cancelled and hasn't already been refunded/completed. */
  const shouldRefund =
    status === "cancelled" &&
    existing.status !== "cancelled" &&
    existing.paymentMethod === "wallet" &&
    existing.paymentStatus === "paid_wallet";

  const updated = await db.transaction(async (tx) => {
    const updates: Record<string, unknown> = { status };
    if (status === "confirmed") { updates.approvedBy = adminName; updates.approvedAt = new Date(); }
    if (shouldRefund) updates.paymentStatus = "refunded";

    const [row] = await tx.update(bookingsTable).set(updates).where(eq(bookingsTable.id, bookingId)).returning();

    if (shouldRefund) {
      const cost = calcSessionCost(row.players, row.durationMin);
      await tx.update(usersTable).set({ balance: sql`${usersTable.balance} + ${cost}` }).where(eq(usersTable.id, row.userId));
      await tx.insert(transactionsTable).values({
        userId: row.userId,
        type: "credit",
        amount: cost,
        description: `Refund for cancelled booking #${row.id} (${row.game})`,
        category: "refund",
        adminName,
      });
    }
    return row;
  });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
  await logAudit(adminName, status === "confirmed" ? "Booking Approved" : status === "cancelled" ? "Booking Cancelled" : "Settings Changed", user?.username ?? user?.phone, `Booking #${updated.id} → ${status}${shouldRefund ? " (wallet refunded)" : ""}`);

  if (status === "confirmed" || status === "cancelled") {
    const durMin = Number(updated.durationMin) || 30;
    const h = Math.floor(durMin / 60);
    const m = durMin % 60;
    const durationLabel = h === 0 ? `${m}min` : m === 0 ? `${h}hr` : `${h}h${m}min`;

    if (status === "confirmed") {
      await notify("notify_booking_confirmed", `✅ <b>Booking Confirmed</b>\nUser: ${user?.name ?? user?.phone}\nGame: ${updated.game}\nDate: ${updated.bookingDate}\nTime: ${sessionRangeLabel(updated.timeSlot, updated.durationMin)}\nDuration: ${durationLabel}\nBy: ${adminName}`);
    } else {
      await notify("notify_booking_cancelled", `❌ <b>Booking Cancelled</b>\nUser: ${user?.name ?? user?.phone}\nGame: ${updated.game}\nDate: ${updated.bookingDate}\nTime: ${sessionRangeLabel(updated.timeSlot, updated.durationMin)}\nDuration: ${durationLabel}\nBy: ${adminName}${shouldRefund ? "\n💰 Wallet refunded" : ""}`);
    }
  }

  return res.json({ booking: updated, userPhone: user?.phone, userName: user?.name });
});

/* POST /api/admin/bookings/:id/pay-cash — mark a pending cash booking as paid (idempotent, validated) */
router.post("/bookings/:id/pay-cash", requireAdmin, async (req: any, res) => {
  const bookingId = Number(req.params.id);
  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!existing) return res.status(404).json({ error: "Booking not found" });
  if (existing.paymentMethod !== "cash") {
    return res.status(400).json({ error: "This booking is not a cash-payment booking" });
  }
  if (existing.paymentStatus === "paid_cash") {
    return res.status(409).json({ error: "This booking's cash payment has already been marked as received" });
  }
  if (existing.paymentStatus !== "pending_cash") {
    return res.status(400).json({ error: `Cannot mark payment for a booking with payment status "${existing.paymentStatus}"` });
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({ paymentStatus: "paid_cash" })
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.paymentStatus, "pending_cash")))
    .returning();
  if (!updated) return res.status(409).json({ error: "Payment status changed concurrently — please refresh" });

  const adminName = req.admin.name ?? req.admin.phone ?? "admin";
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
  const cashAmount = calcSessionCost(updated.players, updated.durationMin);
  await db.insert(transactionsTable).values({
    userId: updated.userId,
    type: "debit",
    amount: cashAmount,
    description: `Cash payment received for booking #${updated.id} (${updated.game})`,
    category: "cash",
    adminName,
  });
  await logAudit(adminName, "Deduct Payment", user?.username ?? user?.phone, `Marked booking #${updated.id} cash payment as received`);
  return res.json({ booking: updated });
});

export default router;
