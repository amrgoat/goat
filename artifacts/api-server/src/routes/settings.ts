import { Router } from "express";
import { verifyToken } from "../lib/auth.js";
import { getAllSettings, setSetting, NOTIFICATION_KEYS } from "../lib/settings.js";
import { testTelegramConnection, registerBotCommands } from "../lib/telegram.js";
import { logAudit } from "../lib/audit.js";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

const ADMIN_ROLES = ["owner", "admin", "staff"];
const MANAGER_ROLES = ["owner", "admin"];

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyToken(auth.slice(7));
  if (!payload || (!payload.isAdmin && !ADMIN_ROLES.includes(payload.role as string))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.admin = payload;
  next();
}

function requireManager(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyToken(auth.slice(7));
  if (!payload || !MANAGER_ROLES.includes(payload.role as string)) {
    return res.status(403).json({ error: "Forbidden: owner or admin role required" });
  }
  req.admin = payload;
  next();
}

/* GET /api/settings/telegram — current config (token masked) */
router.get("/telegram", requireAdmin, async (_req, res) => {
  const all = await getAllSettings();
  const token = all["telegram_bot_token"] ?? "";
  return res.json({
    botToken: token ? `${token.slice(0, 6)}••••••${token.slice(-4)}` : "",
    hasBotToken: !!token,
    chatId: all["telegram_chat_id"] ?? "",
    groupChatId: all["telegram_group_chat_id"] ?? "",
  });
});

/* PUT /api/settings/telegram — save config (owner/admin only) */
router.put("/telegram", requireManager, async (req: any, res) => {
  const { botToken, chatId, groupChatId } = req.body as { botToken?: string; chatId?: string; groupChatId?: string };
  if (botToken !== undefined && botToken !== "") await setSetting("telegram_bot_token", botToken);
  if (chatId !== undefined) await setSetting("telegram_chat_id", chatId);
  if (groupChatId !== undefined) await setSetting("telegram_group_chat_id", groupChatId || null);

  const all = await getAllSettings();
  const activeToken = (botToken && botToken.trim()) || all["telegram_bot_token"];
  let webhookRegistered = false;
  let commandsRegistered = false;
  if (activeToken) {
    // Generate a persistent per-install secret (once) and register the webhook so
    // Telegram echoes it back on every callback — this is what authenticates the webhook.
    let secret = all["telegram_webhook_secret"];
    if (!secret) {
      secret = (await import("crypto")).randomBytes(24).toString("hex");
      await setSetting("telegram_webhook_secret", secret);
    }
    try {
      const domain = process.env["REPLIT_DEV_DOMAIN"] || process.env["REPLIT_DOMAINS"]?.split(",")[0];
      if (domain) {
        const webhookUrl = `https://${domain}/api/telegram/webhook`;
        const setRes = await fetch(`https://api.telegram.org/bot${activeToken}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl, secret_token: secret }),
        });
        const setData: any = await setRes.json().catch(() => null);
        webhookRegistered = !!setData?.ok;
      }
    } catch {
      webhookRegistered = false;
    }
    commandsRegistered = await registerBotCommands(activeToken);
  }

  await logAudit(req.admin.name ?? req.admin.phone ?? "admin", "Settings Changed", null, "Updated Telegram settings");
  return res.json({ success: true, webhookRegistered, commandsRegistered });
});

/* POST /api/settings/telegram/test — test connection with saved (or provided) credentials */
router.post("/telegram/test", requireAdmin, async (req: any, res) => {
  const all = await getAllSettings();
  const botToken = (req.body?.botToken && req.body.botToken.trim()) || all["telegram_bot_token"];
  const chatId = (req.body?.chatId && req.body.chatId.trim()) || all["telegram_chat_id"];
  if (!botToken || !chatId) return res.status(400).json({ success: false, error: "Bot token and chat ID are required" });

  const result = await testTelegramConnection(botToken, chatId);
  return res.json(result);
});

/* GET /api/settings/notifications */
router.get("/notifications", requireAdmin, async (_req, res) => {
  const all = await getAllSettings();
  const settings: Record<string, boolean> = {};
  for (const key of NOTIFICATION_KEYS) settings[key] = all[key] === undefined || all[key] === null ? true : all[key] === "true";
  return res.json({ settings });
});

/* PUT /api/settings/notifications */
router.put("/notifications", requireManager, async (req: any, res) => {
  const updates = req.body as Record<string, boolean>;
  for (const [key, value] of Object.entries(updates)) {
    if ((NOTIFICATION_KEYS as readonly string[]).includes(key)) {
      await setSetting(key, value ? "true" : "false");
    }
  }
  await logAudit(req.admin.name ?? req.admin.phone ?? "admin", "Settings Changed", null, "Updated notification preferences");
  return res.json({ success: true });
});

/* GET /api/settings/cafe-hours */
router.get("/cafe-hours", async (_req, res) => {
  const all = await getAllSettings();
  return res.json({
    openHour: all["cafe_open_hour"] ? Number(all["cafe_open_hour"]) : 10,
    closeHour: all["cafe_close_hour"] ? Number(all["cafe_close_hour"]) : 20,
  });
});

/* PUT /api/settings/cafe-hours */
router.put("/cafe-hours", requireManager, async (req: any, res) => {
  const { openHour, closeHour } = req.body as { openHour?: number; closeHour?: number };
  if (openHour !== undefined) await setSetting("cafe_open_hour", String(openHour));
  if (closeHour !== undefined) await setSetting("cafe_close_hour", String(closeHour));
  await logAudit(req.admin.name ?? req.admin.phone ?? "admin", "Settings Changed", null, "Updated cafe operating hours");
  return res.json({ success: true });
});

/* GET /api/settings/audit-log */
router.get("/audit-log", requireAdmin, async (_req, res) => {
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(200);
  return res.json({ logs });
});

export default router;
