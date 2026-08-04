import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BANK_NAME,
  BANK_ACCOUNT_NUMBER,
  BANK_ACCOUNT_HOLDER,
  QRIS_IMAGE_URL,
  PAYMENT_DEADLINE_HOURS,
} from "@/lib/payment/config";
import { resend } from "@/lib/resend";

// Same siteUrl pattern as app/layout.tsx's metadataBase — kept in sync so
// the link in the email and the site's own canonical URL never drift.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapiitakarya.com";

// "Display Name <address>" — Resend's expected `from` format.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Lapiita Karya <orders@lapiitakarya.com>";

// Where the "new order" admin alert goes. If unset, that email is skipped
// (logged, not thrown) — the customer confirmation still sends normally.
const ADMIN_EMAIL = process.env.STORE_ADMIN_EMAIL;

export type OrderEmailItem = {
  name: string;
  price: number;
  quantity: number;
};

export type OrderEmailData = {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  // Single combined address string — this project has no customer accounts
  // and stores the shipping address as one free-text field (see
  // lib/checkout/actions.ts), so the email mirrors that rather than
  // inventing a structured address it doesn't have.
  shippingAddress: string;
  shippingNotes: string | null;
  items: OrderEmailItem[];
  subtotal: number;
  shippingCost: number;
  shippingMethod: string;
  courier: string;
  service: string;
  total: number;
  currency: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Payment",
  WAITING_VERIFICATION: "Verifying Payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PAYMENT_REJECTED: "Payment Rejected",
};

// Short, customer-facing sentence shown under the status badge in the
// status-update email — same statuses as STATUS_LABELS above.
const STATUS_MESSAGES: Record<string, string> = {
  PENDING: "Your order is awaiting payment.",
  WAITING_VERIFICATION: "We've received your payment proof and are verifying it now.",
  PAID: "Your payment has been confirmed — we're preparing your order.",
  PROCESSING: "Your order is being prepared for shipment.",
  SHIPPED: "Your order is on its way.",
  DELIVERED: "Your order has been delivered. We hope you love it!",
  CANCELLED: "This order has been cancelled.",
  REFUNDED: "This order has been refunded.",
  PAYMENT_REJECTED:
    "We couldn't verify your last payment proof — please upload a new one on your order's payment page.",
};

function statusMessage(status: string) {
  return STATUS_MESSAGES[status] ?? "Your order status has been updated.";
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Lapiita Karya design tokens (see app/globals.css :root) — duplicated here
// rather than imported since email HTML can't reference CSS variables and
// needs every color inlined.
const COLOR = {
  ink: "#17151a",
  paper: "#ffffff",
  cloud: "#f7f5f3",
  line: "#ece7e2",
  slate: "#756e6a",
  signal: "#a8324f",
  accentSoft: "#fbebee",
  gold: "#a9843f",
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Helvetica, Arial, sans-serif";

/**
 * Shared table-based shell (header wordmark + footer) used by both emails
 * below. Table-based layout + inline styles throughout, since Outlook and
 * many mobile mail clients don't support flexbox/grid in email HTML.
 */
function emailShell(previewText: string, bodyRowsHtml: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Lapiita Karya</title>
    <style>
      @media only screen and (max-width: 620px) {
        .lk-container { width: 100% !important; border-radius: 0 !important; }
        .lk-px { padding-left: 20px !important; padding-right: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:${COLOR.cloud}; font-family:${SANS};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapeHtml(previewText)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.cloud};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" class="lk-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:100%; background-color:${COLOR.paper}; border-radius:16px; border:1px solid ${COLOR.line};">
            <tr>
              <td class="lk-px" style="padding:32px 40px 24px 40px; border-bottom:1px solid ${COLOR.line};">
                <span style="font-family:${SERIF}; font-size:21px; font-weight:700; letter-spacing:0.01em; color:${COLOR.ink};">
                  Lapiita Karya
                </span>
              </td>
            </tr>
            ${bodyRowsHtml}
            <tr>
              <td class="lk-px" style="padding:24px 40px 32px 40px; border-top:1px solid ${COLOR.line};">
                <p style="margin:0; font-size:12px; line-height:1.6; color:${COLOR.slate};">
                  Lapiita Karya — handmade goods made by women building new
                  skills through vocational training at Lapas Perempuan
                  Kelas IIA Jakarta.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function statusBadgeHtml(status: string) {
  return `<span style="display:inline-block; padding:4px 12px; border-radius:999px; background-color:${COLOR.accentSoft}; color:${COLOR.signal}; font-size:12px; font-weight:600; letter-spacing:0.02em;">
    ${escapeHtml(statusLabel(status))}
  </span>`;
}

function ctaButtonHtml(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border-radius:999px; background-color:${COLOR.ink};">
        <a href="${href}" style="display:inline-block; padding:13px 28px; font-family:${SANS}; font-size:14px; font-weight:600; color:${COLOR.paper}; text-decoration:none; border-radius:999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function itemRowsHtml(items: OrderEmailItem[], currency: string) {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0; border-bottom:1px solid ${COLOR.line}; font-size:14px; color:${COLOR.ink};">
          ${escapeHtml(item.name)}
          <div style="margin-top:2px; font-size:12px; color:${COLOR.slate};">
            Qty ${item.quantity} × ${escapeHtml(formatCurrency(item.price, currency))}
          </div>
        </td>
        <td align="right" style="padding:12px 0; border-bottom:1px solid ${COLOR.line}; font-size:14px; color:${COLOR.ink}; white-space:nowrap;">
          ${escapeHtml(formatCurrency(item.price * item.quantity, currency))}
        </td>
      </tr>`
    )
    .join("");
}

function totalsRowsHtml(data: OrderEmailData) {
  return `
    <tr>
      <td style="padding-top:14px; font-size:13px; color:${COLOR.slate};">Subtotal</td>
      <td align="right" style="padding-top:14px; font-size:13px; color:${COLOR.ink};">
        ${escapeHtml(formatCurrency(data.subtotal, data.currency))}
      </td>
    </tr>
    <tr>
      <td style="padding-top:6px; font-size:13px; color:${COLOR.slate};">
        Shipping (${escapeHtml(data.courier)}${data.service ? ` · ${escapeHtml(data.service)}` : ""})
      </td>
      <td align="right" style="padding-top:6px; font-size:13px; color:${COLOR.ink};">
        ${escapeHtml(formatCurrency(data.shippingCost, data.currency))}
      </td>
    </tr>
    <tr>
      <td style="padding-top:12px; border-top:1px solid ${COLOR.line}; font-size:15px; font-weight:600; color:${COLOR.ink};">
        Total
      </td>
      <td align="right" style="padding-top:12px; border-top:1px solid ${COLOR.line}; font-size:15px; font-weight:700; color:${COLOR.ink};">
        ${escapeHtml(formatCurrency(data.total, data.currency))}
      </td>
    </tr>`;
}

function paymentInstructionsHtml(data: OrderEmailData) {
  const qris = QRIS_IMAGE_URL
    ? `<p style="margin:10px 0 0; font-size:13px; line-height:1.6; color:${COLOR.slate};">
         Prefer QRIS? Scan the code on your order's payment page instead.
       </p>`
    : "";

  return `
    <tr>
      <td class="lk-px" style="padding:24px 40px 0 40px;">
        <div style="border-radius:12px; background-color:${COLOR.cloud}; padding:20px;">
          <p style="margin:0 0 10px; font-size:13px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:${COLOR.slate};">
            Payment instructions
          </p>
          <p style="margin:0; font-size:14px; line-height:1.7; color:${COLOR.ink};">
            Bank transfer to:<br />
            <strong>${escapeHtml(BANK_NAME)}</strong><br />
            ${escapeHtml(BANK_ACCOUNT_NUMBER)} — a.n. ${escapeHtml(BANK_ACCOUNT_HOLDER)}
          </p>
          <p style="margin:10px 0 0; font-size:13px; line-height:1.6; color:${COLOR.slate};">
            Please complete payment within ${PAYMENT_DEADLINE_HOURS} hours and
            upload your transfer proof on the order's payment page.
          </p>
          ${qris}
        </div>
      </td>
    </tr>`;
}

/**
 * Renders the customer-facing order confirmation email. Includes every
 * field the order-confirmation requirements call for: order ID/date,
 * customer info, shipping address, line items with qty/price, shipping
 * cost, total, payment instructions, status, and a link back to
 * /orders/lookup.
 */
function renderOrderConfirmationEmail(data: OrderEmailData) {
  const lookupUrl = `${SITE_URL}/orders/lookup?order=${encodeURIComponent(data.orderNumber)}`;

  const body = `
    <tr>
      <td class="lk-px" style="padding:28px 40px 0 40px;">
        <p style="margin:0 0 4px; font-family:${SERIF}; font-size:22px; font-weight:700; color:${COLOR.ink};">
          Thanks for your order, ${escapeHtml(data.customerName)}
        </p>
        <p style="margin:0; font-size:14px; color:${COLOR.slate};">
          We've received your order and it's being prepared.
        </p>
      </td>
    </tr>

    <tr>
      <td class="lk-px" style="padding:20px 40px 0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size:12px; color:${COLOR.slate};">Order number</div>
              <div style="font-family:${SANS}; font-size:14px; font-weight:600; color:${COLOR.ink};">
                ${escapeHtml(data.orderNumber)}
              </div>
            </td>
            <td>
              <div style="font-size:12px; color:${COLOR.slate};">Order date</div>
              <div style="font-size:14px; color:${COLOR.ink};">${escapeHtml(formatDate(data.createdAt))}</div>
            </td>
            <td align="right">${statusBadgeHtml(data.status)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="lk-px" style="padding:24px 40px 0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="vertical-align:top; padding-right:12px;">
              <p style="margin:0 0 6px; font-size:13px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:${COLOR.slate};">
                Customer
              </p>
              <p style="margin:0; font-size:14px; line-height:1.6; color:${COLOR.ink};">
                ${escapeHtml(data.customerName)}<br />
                ${escapeHtml(data.customerEmail)}<br />
                ${escapeHtml(data.customerPhone)}
              </p>
            </td>
            <td width="50%" style="vertical-align:top; padding-left:12px;">
              <p style="margin:0 0 6px; font-size:13px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:${COLOR.slate};">
                Shipping address
              </p>
              <p style="margin:0; font-size:14px; line-height:1.6; color:${COLOR.ink};">
                ${escapeHtml(data.customerName)}<br />
                ${escapeHtml(data.shippingAddress)}
                ${data.shippingNotes ? `<br /><span style="color:${COLOR.slate};">Note: ${escapeHtml(data.shippingNotes)}</span>` : ""}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td class="lk-px" style="padding:24px 40px 0 40px;">
        <p style="margin:0 0 4px; font-size:13px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:${COLOR.slate};">
          Order summary
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRowsHtml(data.items, data.currency)}
          ${totalsRowsHtml(data)}
        </table>
      </td>
    </tr>

    ${paymentInstructionsHtml(data)}

    <tr>
      <td class="lk-px" align="center" style="padding:28px 40px 4px 40px;">
        ${ctaButtonHtml(lookupUrl, "Track your order")}
      </td>
    </tr>`;

  return emailShell(
    `Order ${data.orderNumber} confirmed — ${formatCurrency(data.total, data.currency)}`,
    body
  );
}

/**
 * Renders the internal "new order" alert sent to the store admin — same
 * data, condensed, with a direct link into /admin/orders/[id] instead of
 * the public order-lookup link.
 */
function renderAdminNotificationEmail(data: OrderEmailData) {
  const adminUrl = `${SITE_URL}/admin/orders/${data.orderId}`;

  const body = `
    <tr>
      <td class="lk-px" style="padding:28px 40px 0 40px;">
        <p style="margin:0 0 4px; font-family:${SERIF}; font-size:20px; font-weight:700; color:${COLOR.ink};">
          New order — ${escapeHtml(data.orderNumber)}
        </p>
        <p style="margin:0; font-size:14px; color:${COLOR.slate};">
          Placed ${escapeHtml(formatDate(data.createdAt))} · ${statusBadgeHtml(data.status)}
        </p>
      </td>
    </tr>

    <tr>
      <td class="lk-px" style="padding:20px 40px 0 40px;">
        <p style="margin:0 0 6px; font-size:13px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:${COLOR.slate};">
          Customer
        </p>
        <p style="margin:0; font-size:14px; line-height:1.6; color:${COLOR.ink};">
          ${escapeHtml(data.customerName)} — ${escapeHtml(data.customerEmail)} — ${escapeHtml(data.customerPhone)}<br />
          ${escapeHtml(data.shippingAddress)}
        </p>
      </td>
    </tr>

    <tr>
      <td class="lk-px" style="padding:20px 40px 0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRowsHtml(data.items, data.currency)}
          ${totalsRowsHtml(data)}
        </table>
      </td>
    </tr>

    <tr>
      <td class="lk-px" align="center" style="padding:28px 40px 4px 40px;">
        ${ctaButtonHtml(adminUrl, "View in admin")}
      </td>
    </tr>`;

  return emailShell(`New order ${data.orderNumber} from ${data.customerName}`, body);
}

export type OrderStatusEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
};

/**
 * Renders the customer-facing "your order status changed" email, sent from
 * the admin order detail page (lib/admin/order-actions.ts::updateOrderStatus)
 * whenever an admin moves an order to a new status.
 */
function renderOrderStatusEmail(data: OrderStatusEmailData) {
  const lookupUrl = `${SITE_URL}/orders/lookup?order=${encodeURIComponent(data.orderNumber)}`;

  const body = `
    <tr>
      <td class="lk-px" style="padding:28px 40px 0 40px;">
        <p style="margin:0 0 4px; font-family:${SERIF}; font-size:22px; font-weight:700; color:${COLOR.ink};">
          Hi ${escapeHtml(data.customerName)}, your order has an update
        </p>
        <p style="margin:0; font-size:14px; color:${COLOR.slate};">
          Order ${escapeHtml(data.orderNumber)} is now:
        </p>
      </td>
    </tr>

    <tr>
      <td class="lk-px" style="padding:16px 40px 0 40px;">
        ${statusBadgeHtml(data.status)}
      </td>
    </tr>

    <tr>
      <td class="lk-px" style="padding:16px 40px 0 40px;">
        <p style="margin:0; font-size:14px; line-height:1.6; color:${COLOR.ink};">
          ${escapeHtml(statusMessage(data.status))}
        </p>
      </td>
    </tr>

    <tr>
      <td class="lk-px" align="center" style="padding:28px 40px 4px 40px;">
        ${ctaButtonHtml(lookupUrl, "View order details")}
      </td>
    </tr>`;

  return emailShell(`Order ${data.orderNumber} is now ${statusLabel(data.status)}`, body);
}

/**
 * Sends the customer order-status-update email. Best-effort, same as the
 * two functions below — critically, `updateOrderStatus` in
 * lib/admin/order-actions.ts awaits this call *inside* its own try block
 * with no separate try/catch around the email call itself, so this must
 * never throw or a failed email would incorrectly report the whole status
 * update as failed.
 */
export async function sendOrderStatusEmail(data: OrderStatusEmailData): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order update — ${data.orderNumber} is now ${statusLabel(data.status)}`,
      html: renderOrderStatusEmail(data),
    });
  } catch (error) {
    console.error("[email] failed to send order status update:", error);
  }
}

/**
 * Sends the customer order-confirmation email. Best-effort: any failure
 * (bad API key, network issue, invalid address) is logged and swallowed —
 * placeOrder (lib/checkout/actions.ts) must still succeed either way.
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order confirmed — ${data.orderNumber}`,
      html: renderOrderConfirmationEmail(data),
    });
  } catch (error) {
    console.error("[email] failed to send order confirmation:", error);
  }
}

/**
 * Sends the internal "new order" alert to the store admin. Also
 * best-effort. Skipped (with a warning, not an error) if STORE_ADMIN_EMAIL
 * isn't configured, since that's an expected state for local/dev setups.
 */
export async function sendAdminOrderNotificationEmail(data: OrderEmailData): Promise<void> {
  if (!ADMIN_EMAIL) {
    console.warn("[email] STORE_ADMIN_EMAIL is not set — skipping admin order notification.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New order — ${data.orderNumber} (${formatCurrency(data.total, data.currency)})`,
      html: renderAdminNotificationEmail(data),
    });
  } catch (error) {
    console.error("[email] failed to send admin order notification:", error);
  }
}
