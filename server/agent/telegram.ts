/**
 * Telegram notifier para el ecosistema de agentes.
 *
 * Envia mensajes al dueño (Luis) cuando un agente pide aprobacion.
 * Usa Bot API de Telegram via fetch (Node 20+ tiene fetch nativo).
 *
 * Variables de entorno requeridas:
 *   - TELEGRAM_BOT_TOKEN   token del bot de Telegram
 *   - TELEGRAM_OWNER_CHAT_ID   chat id personal de Luis
 *
 * Si faltan, el notifier silenciosamente no hace nada (pero loguea advertencia).
 * Esto permite que el sistema corra en dev sin configuracion completa.
 */

export interface SendMessageResult {
  ok: boolean;
  messageId?: string;
  chatId?: string;
  error?: string;
}

const TELEGRAM_API_BASE = "https://api.telegram.org";

function isConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_OWNER_CHAT_ID;
}

/**
 * Envia mensaje al dueño. Usa MarkdownV2 para formato.
 * Devuelve message_id para poder editar el mensaje cuando se decida.
 */
export async function notifyOwner(
  text: string,
  opts: { parseMode?: "MarkdownV2" | "HTML"; silent?: boolean } = {},
): Promise<SendMessageResult> {
  if (!isConfigured()) {
    console.warn(
      "[agent/telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_OWNER_CHAT_ID sin configurar — no se envia notificacion",
    );
    return { ok: false, error: "not_configured" };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID!;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: opts.parseMode ?? "MarkdownV2",
        disable_notification: opts.silent ?? false,
      }),
    });

    const data = (await res.json()) as {
      ok: boolean;
      result?: { message_id: number; chat: { id: number } };
      description?: string;
    };

    if (!data.ok) {
      console.error(
        "[agent/telegram] Bot API error:",
        data.description ?? "unknown",
      );
      return { ok: false, error: data.description ?? "unknown" };
    }

    return {
      ok: true,
      messageId: String(data.result?.message_id ?? ""),
      chatId: String(data.result?.chat?.id ?? chatId),
    };
  } catch (err: any) {
    console.error("[agent/telegram] Error enviando mensaje:", err?.message ?? err);
    return { ok: false, error: err?.message ?? "fetch_failed" };
  }
}

/**
 * Edita un mensaje ya enviado (para marcar "APROBADO" o "DENEGADO" despues).
 */
export async function editOwnerMessage(
  messageId: string,
  newText: string,
  opts: { parseMode?: "MarkdownV2" | "HTML" } = {},
): Promise<SendMessageResult> {
  if (!isConfigured()) {
    return { ok: false, error: "not_configured" };
  }
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID!;

  try {
    const res = await fetch(
      `${TELEGRAM_API_BASE}/bot${token}/editMessageText`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: parseInt(messageId, 10),
          text: newText,
          parse_mode: opts.parseMode ?? "MarkdownV2",
        }),
      },
    );
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      return { ok: false, error: data.description ?? "unknown" };
    }
    return { ok: true, messageId };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "fetch_failed" };
  }
}

export function isTelegramConfigured(): boolean {
  return isConfigured();
}
