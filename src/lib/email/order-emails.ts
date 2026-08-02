import type { OrderStatus } from "@prisma/client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { EMAIL_FROM, ADMIN_NOTIFICATION_EMAIL, getResendClient } from "@/lib/email/resend";

export type OrderEmailItem = {
  name: string;
  price: number;
  quantity: number;
};

export type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  createdAt: Date;
  items: OrderEmailItem[];
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  WAITING_VERIFICATION: "Waiting for verification",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PAYMENT_REJECTED: "Payment rejected",
};

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  PENDING: "Your order has been received and is pending confirmation.",
  WAITING_VERIFICATION: "We've received your payment proof and are verifying it.",
  PAID: "We've confirmed payment for your order.",
  PROCESSING: "Your order is now being prepared.",
  SHIPPED: "Your order is on its way.",
  DELIVERED: "Your order has been delivered.",
  CANCELLED: "Your order has been cancelled.",
  REFUNDED: "Your order has been refunded.",
  PAYMENT_REJECTED:
    "We couldn't verify your payment proof. Please upload a new one on your payment page, or contact us if you think this is a mistake.",
};

/** Shared page chrome so every email reads as one family. Inline styles only — email clients strip <style> tags. */
function emailShell(title: string, bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; background-color: #f7f5f3; padding: 32px 16px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ece7e2;">
        <div style="background-color: #17151a; padding: 24px 32px;">
          <span style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: -0.01em;">Lapiita Karya</span>
        </div>
        <div style="padding: 32px;">
          <h1 style="margin: 0 0 16px; font-size: 20px; color: #17151a;">${title}</h1>
          ${bodyHtml}
        </div>
        <div style="padding: 20px 32px; border-top: 1px solid #ece7e2; color: #756e6a; font-size: 12px;">
          This is an automated message from Lapiita Karya.
        </div>
      </div>
    </div>
  `;
}

function itemsTable(items: OrderEmailItem[], currency: string) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; color: #17151a; font-size: 14px;">${item.name} × ${item.quantity}</td>
          <td style="padding: 8px 0; color: #17151a; font-size: 14px; text-align: right;">${formatCurrency(item.price * item.quantity, currency)}</td>
        </tr>`
    )
    .join("");

  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border-top: 1px solid #ece7e2; border-bottom: 1px solid #ece7e2;">${rows}</table>`;
}

/**
 * Send the order confirmation email to the customer.
 *
 * Always resolves, never throws — a failure here must not fail checkout.
 */
export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: order.customerEmail,
      subject: `Order confirmed — ${order.orderNumber}`,
      html: emailShell(
        "Thank you for your order",
        `
          <p style="color: #756e6a; font-size: 14px; line-height: 1.6;">
            Hi ${order.customerName}, we've received your order. Please complete payment by bank transfer using the instructions on the payment page and upload your proof of transfer there.
          </p>
          <p style="color: #17151a; font-size: 14px; margin-top: 20px;">
            Order <strong>${order.orderNumber}</strong> · ${formatDate(order.createdAt)}
          </p>
          ${itemsTable(order.items, order.currency)}
          <table style="width: 100%;">
            <tr>
              <td style="padding-top: 8px; font-size: 15px; font-weight: 600; color: #17151a;">Total</td>
              <td style="padding-top: 8px; font-size: 15px; font-weight: 600; color: #17151a; text-align: right;">${formatCurrency(order.total, order.currency)}</td>
            </tr>
          </table>
        `
      ),
    });
  } catch (error) {
    console.error("[email] failed to send order confirmation email:", error);
  }
}

/**
 * Send the "new order" alert to the store admin.
 *
 * Always resolves, never throws — a failure here must not fail checkout.
 */
export async function sendAdminOrderNotificationEmail(order: OrderEmailData): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  if (!ADMIN_NOTIFICATION_EMAIL) {
    console.warn(
      "[email] ADMIN_NOTIFICATION_EMAIL is not set — skipping new order notification. See .env.example."
    );
    return;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `New order ${order.orderNumber} — ${order.customerName}`,
      html: emailShell(
        "New order received",
        `
          <p style="color: #756e6a; font-size: 14px; line-height: 1.6;">
            ${order.customerName} (${order.customerEmail}) just placed an order.
          </p>
          <p style="color: #17151a; font-size: 14px; margin-top: 20px;">
            Order <strong>${order.orderNumber}</strong> · ${formatDate(order.createdAt)}
          </p>
          ${itemsTable(order.items, order.currency)}
          <table style="width: 100%;">
            <tr>
              <td style="padding-top: 8px; font-size: 15px; font-weight: 600; color: #17151a;">Total</td>
              <td style="padding-top: 8px; font-size: 15px; font-weight: 600; color: #17151a; text-align: right;">${formatCurrency(order.total, order.currency)}</td>
            </tr>
          </table>
        `
      ),
    });
  } catch (error) {
    console.error("[email] failed to send admin order notification email:", error);
  }
}

/**
 * Send the customer an email when their order's status changes.
 *
 * Always resolves, never throws — a failure here must not fail the status
 * update itself.
 */
export async function sendOrderStatusEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: order.customerEmail,
      subject: `Order ${order.orderNumber} — ${STATUS_LABELS[order.status]}`,
      html: emailShell(
        "Your order status has changed",
        `
          <p style="color: #756e6a; font-size: 14px; line-height: 1.6;">
            Hi ${order.customerName}, here's an update on order <strong style="color: #17151a;">${order.orderNumber}</strong>.
          </p>
          <p style="margin-top: 20px;">
            <span style="display: inline-block; background-color: #fbebee; color: #a8324f; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 12px; border-radius: 999px;">
              ${STATUS_LABELS[order.status]}
            </span>
          </p>
          <p style="color: #756e6a; font-size: 14px; line-height: 1.6; margin-top: 16px;">
            ${STATUS_MESSAGES[order.status]}
          </p>
        `
      ),
    });
  } catch (error) {
    console.error("[email] failed to send order status email:", error);
  }
}
