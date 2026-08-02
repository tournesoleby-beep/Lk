"use server";

import {
  EMAIL_FROM,
  ADMIN_NOTIFICATION_EMAIL,
  getResendClient,
} from "@/lib/email/resend";
import { contactSchema, type ContactInput } from "@/lib/validations/contact";

export type SendContactMessageResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Send a contact form submission to the store admin.
 *
 * Reuses the existing Resend setup from src/lib/email (see order-emails.ts)
 * so no new email infrastructure is introduced. Like the order emails, this
 * fails soft: if RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL aren't
 * configured, the submission is accepted but simply not sent — it never
 * throws back to the caller.
 */
export async function sendContactMessage(
  input: ContactInput
): Promise<SendContactMessageResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  const { fullName, email, message } = parsed.data;

  const resend = getResendClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) {
    // Email isn't configured in this environment — accept the submission
    // rather than failing the customer for a missing store setting.
    console.warn("[contact] email not configured — message accepted but not sent.");
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_NOTIFICATION_EMAIL,
      replyTo: email,
      subject: `New contact message from ${fullName}`,
      html: `
        <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #17151a;">
          <p><strong>${fullName}</strong> (${email}) sent a message via the contact form:</p>
          <p style="white-space: pre-wrap; border-left: 2px solid #ece7e2; padding-left: 12px; color: #756e6a;">${message}</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("[contact] failed to send message:", error);
    return {
      success: false,
      error: "Something went wrong sending your message. Please try again.",
    };
  }
}
