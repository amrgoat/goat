import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, transactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../lib/auth.js";
import { sendEmergencyAlert, notify } from "../lib/telegram.js";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  req.user = payload;
  next();
}

/* POST /api/auth/register — phone + username + password */
router.post("/register", async (req, res) => {
  const { phone, username, password } = req.body as { phone?: string; username?: string; password?: string };

  if (!phone || !password || !username) {
    return res.status(400).json({ error: "Phone, username, and password are required" });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: "Phone must be 10 digits" });
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 3–20 characters: letters, numbers, or underscores only" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const [existingPhone] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (existingPhone) {
    return res.status(409).json({ error: "An account with this number already exists" });
  }

  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existingUsername) {
    return res.status(409).json({ error: "That username is already taken — try another" });
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({ phone, username, passwordHash }).returning();

  // Best-effort — the account is already created; a Telegram/notification failure must not fail registration.
  await notify(
    "notify_new_user",
    `🆕 <b>New Account Created</b>\nUsername: ${user.username ?? "—"}\nPhone: ${user.phone}\nUser ID: ${user.id}`,
  ).catch(() => {});

  const token = signToken({ userId: user.id, phone: user.phone });
  return res.status(201).json({ token, phone: user.phone, username: user.username });
});

/* POST /api/auth/login — phone + password */
router.post("/login", async (req, res) => {
  const { phone, password } = req.body as { phone?: string; password?: string };

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone and password are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid phone number or password" });
  }

  if (!verifyPassword(password, user.passwordHash)) {
    // Atomic increment avoids undercounting under concurrent failed attempts.
    const [updated] = await db
      .update(usersTable)
      .set({ failedLoginAttempts: sql`${usersTable.failedLoginAttempts} + 1` })
      .where(eq(usersTable.id, user.id))
      .returning({ failedLoginAttempts: usersTable.failedLoginAttempts });
    const attempts = updated?.failedLoginAttempts ?? 1;
    if (attempts >= 5) {
      await sendEmergencyAlert(
        "Repeated Failed Login Attempts",
        `Account: ${user.username ?? user.phone} (ID ${user.id})\nFailed attempts: ${attempts}`,
      ).catch(() => {});
    }
    return res.status(401).json({ error: "Invalid phone number or password" });
  }

  const userAgent = req.headers["user-agent"] ?? "unknown";
  if (user.isAdmin && user.lastLoginUserAgent && user.lastLoginUserAgent !== userAgent) {
    await sendEmergencyAlert(
      "Admin Login From New Device",
      `Account: ${user.username ?? user.phone} (ID ${user.id})\nDevice: ${userAgent}`,
    ).catch(() => {});
  }

  await db
    .update(usersTable)
    .set({ failedLoginAttempts: 0, lastLoginUserAgent: userAgent, lastLoginAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const token = signToken({ userId: user.id, phone: user.phone });
  return res.json({ token, phone: user.phone });
});

/* GET /api/auth/me — get current user profile */
router.get("/me", requireAuth, async (req: any, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ id: user.id, phone: user.phone, username: user.username, name: user.name, balance: user.balance });
});

/* GET /api/auth/transactions — get current user transaction history */
router.get("/transactions", requireAuth, async (req: any, res) => {
  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, req.user.userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(50);
  return res.json({ transactions: txs });
});

export default router;
