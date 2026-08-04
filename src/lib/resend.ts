import { Resend } from "resend";

/**
 * Singleton Resend client used for all outgoing transactional email (order
 * confirmation, admin notifications — see lib/email/order-emails.ts).
 *
 * Requires RESEND_API_KEY to be set (see .env.example). Sending is always
 * called from best-effort, try/caught call sites, so a missing/invalid key
 * surfaces as a logged error rather than a crash.
 */
export const resend = new Resend(process.env.RESEND_API_KEY);
