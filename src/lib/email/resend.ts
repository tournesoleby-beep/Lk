import { Resend } from "resend";

/**
 * All email configuration comes from env vars so nothing is hardcoded:
 *
 * - RESEND_API_KEY          required to send anything at all
 * - RESEND_FROM_EMAIL       "from" address for every outgoing email
 *                            (must be a verified sender/domain in Resend)
 * - ADMIN_NOTIFICATION_EMAIL address that receives "new order" alerts
 *
 * If RESEND_API_KEY is missing, getResendClient() returns null and callers
 * skip sending rather than throwing — order creation and status updates must
 * never fail because email isn't configured.
 */
let cachedClient: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (cachedClient !== undefined) return cachedClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY is not set — skipping email sending. See .env.example."
    );
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Lapiita Karya <orders@lapiitakarya.com>";

export const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;
