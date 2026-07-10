import { getTelegramConfig, isNotificationEnabled, type NotificationKey } from "./settings.js";
import { logger } from "./logger.js";

interface InlineButton {
  text: string;
  callback_data: string;
}

/** Low-level sender — all messages (notifications, alerts, reports, command replies) go to the group chat only when one is configured. */
export async function sendTelegramMessage(
  text: string,
  opts: { buttons?: InlineButton[][] } = {},
): Promise<boolean> {
  const { botToken, chatId, groupChatId } = await getTelegramConfig();
  const targetChat = groupChatId || chatId;
  if (!botToken || !targetChat) return false;

  try {
    const body: Record<string, unknown> = {
      chat_id: targetChat,
      text,
      parse_mode: "HTML",
    };
    if (opts.buttons) body.reply_markup = { inline_keyboard: opts.buttons };

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: any = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      logger.warn({ data }, "Telegram sendMessage failed");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "Telegram sendMessage error");
    return false;
  }
}

/** Sends a notification only if the given toggle is enabled in Notification Settings. */
export async function notify(key: NotificationKey, text: string, opts?: { buttons?: InlineButton[][] }): Promise<void> {
  const enabled = await isNotificationEnabled(key);
  if (!enabled) return;
  await sendTelegramMessage(text, opts);
}

/** Emergency alerts bypass the general toggle map but honor a single master toggle. */
export async function sendEmergencyAlert(title: string, details: string): Promise<void> {
  const enabled = await isNotificationEnabled("notify_emergency_alerts");
  if (!enabled) return;
  await sendTelegramMessage(`🚨 <b>EMERGENCY ALERT</b>\n\n<b>${title}</b>\n${details}`);
}

/** Acknowledges a callback query (inline button tap) so Telegram stops showing the loading spinner. */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const { botToken } = await getTelegramConfig();
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (err) {
    logger.error({ err }, "Telegram answerCallbackQuery error");
  }
}

/** Edits an existing message's text (used to remove inline buttons after a booking action is taken). */
export async function editTelegramMessage(chatId: number | string, messageId: number, text: string): Promise<void> {
  const { botToken } = await getTelegramConfig();
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    logger.error({ err }, "Telegram editMessageText error");
  }
}

/** Registers the bot's slash commands with Telegram so they autocomplete in the chat UI. */
export async function registerBotCommands(botToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "users", description: "Total & today's new users, wallet total" },
          { command: "today", description: "Today's bookings by status" },
          { command: "sales", description: "Sales for today or a given date (YYYY-MM-DD)" },
          { command: "overallsales", description: "Today/weekly/monthly/lifetime sales" },
        ],
      }),
    });
    const data: any = await res.json().catch(() => null);
    return !!data?.ok;
  } catch (err) {
    logger.error({ err }, "Telegram setMyCommands error");
    return false;
  }
}

export async function testTelegramConnection(botToken: string, chatId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData: any = await meRes.json().catch(() => null);
    if (!meRes.ok || !meData?.ok) return { success: false, error: "Invalid bot token" };

    const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "✅ Royal Gaming Zone Telegram Connected Successfully" }),
    });
    const sendData: any = await sendRes.json().catch(() => null);
    if (!sendRes.ok || !sendData?.ok) {
      return { success: false, error: sendData?.description ?? "Could not send message to chat ID" };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
