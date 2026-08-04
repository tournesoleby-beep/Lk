/**
 * Minimal WhatsApp client on top of the Fonnte HTTP API
 * (https://docs.fonnte.com/api-send-message/).
 *
 * Configuration comes entirely from environment variables:
 *
 * - FONNTE_TOKEN   required to send anything at all — see
 *                  https://docs.fonnte.com/token-api-key/ for how to get one.
 *
 * If FONNTE_TOKEN is missing, sendWhatsAppMessage() logs and returns a
 * failure result without calling the API. This client never throws — a
 * failed WhatsApp send must never break whatever flow is calling it, same
 * pattern as getResendClient()/sendOrder*Email() in lib/resend.ts and
 * lib/email/order-emails.ts.
 */

const FONNTE_SEND_URL = "https://api.fonnte.com/send";

export type SendWhatsAppMessageResult =
  | { success: true }
  | { success: false; error: string };

// Fonnte's own API is inconsistent about the casing of this field across
// endpoints/error cases ("status" on success, sometimes "Status" on some
// error responses) — read both.
type FonnteResponse = {
  status?: boolean;
  Status?: boolean;
  reason?: string;
  detail?: string;
};

/**
 * Sends a single WhatsApp text message via Fonnte. Best-effort: any failure
 * (missing token, network error, non-2xx response, or an explicit
 * `status: false` from Fonnte) is logged and returned as a failure result —
 * this function never throws.
 *
 * @param destination WhatsApp number to send to, e.g. "6281234567890".
 * @param message     Text message body.
 */
export async function sendWhatsAppMessage(
  destination: string,
  message: string
): Promise<SendWhatsAppMessageResult> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.error("[whatsapp] FONNTE_TOKEN is not set — skipping message send.");
    return { success: false, error: "FONNTE_TOKEN is not set" };
  }

  try {
    const body = new FormData();
    body.append("target", destination);
    body.append("message", message);

    const response = await fetch(FONNTE_SEND_URL, {
      method: "POST",
      headers: {
        // Fonnte expects the raw token, no "Bearer " prefix.
        Authorization: token,
      },
      body,
    });

    const data = (await response.json().catch(() => null)) as FonnteResponse | null;
    const ok = response.ok && (data?.status ?? data?.Status) === true;

    if (!ok) {
      const reason = data?.reason ?? data?.detail ?? response.statusText ?? "unknown error";
      console.error("[whatsapp] failed to send message:", reason);
      return { success: false, error: reason };
    }

    return { success: true };
  } catch (error) {
    console.error("[whatsapp] failed to send message:", error);
    return { success: false, error: "Failed to send WhatsApp message" };
  }
}
