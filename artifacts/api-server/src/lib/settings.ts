import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/** Notification toggles — all default to enabled. */
export const NOTIFICATION_KEYS = [
  "notify_new_user",
  "notify_wallet_recharge",
  "notify_wallet_deduction",
  "notify_booking_created",
  "notify_booking_approval_request",
  "notify_booking_confirmed",
  "notify_booking_cancelled",
  "notify_daily_report",
  "notify_emergency_alerts",
] as const;
export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

const cache = new Map<string, string | null>();
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 5000;

async function loadAll(): Promise<void> {
  const rows = await db.select().from(settingsTable);
  cache.clear();
  for (const r of rows) cache.set(r.key, r.value);
  cacheLoadedAt = Date.now();
}

export async function getSetting(key: string): Promise<string | null> {
  if (Date.now() - cacheLoadedAt > CACHE_TTL_MS) await loadAll();
  return cache.has(key) ? (cache.get(key) ?? null) : null;
}

export async function getAllSettings(): Promise<Record<string, string | null>> {
  await loadAll();
  return Object.fromEntries(cache.entries());
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
  cache.set(key, value);
}

export async function isNotificationEnabled(key: NotificationKey): Promise<boolean> {
  const v = await getSetting(key);
  return v === null ? true : v === "true";
}

export async function getTelegramConfig(): Promise<{ botToken: string | null; chatId: string | null; groupChatId: string | null }> {
  return {
    botToken: await getSetting("telegram_bot_token"),
    chatId: await getSetting("telegram_chat_id"),
    groupChatId: await getSetting("telegram_group_chat_id"),
  };
}

export async function getCafeHours(): Promise<{ openHour: number; closeHour: number }> {
  const open = await getSetting("cafe_open_hour");
  const close = await getSetting("cafe_close_hour");
  return {
    openHour: open ? Number(open) : 10,
    closeHour: close ? Number(close) : 20,
  };
}
