/**
 * WhatsApp message templates.
 *
 * Pure string builders only — no API calls, no database access. Callers
 * (e.g. lib/whatsapp/client.ts's sendWhatsAppMessage) are responsible for
 * actually delivering the message this returns.
 */

/** Input for newOrderAdmin(). Plain data in, plain string out. */
export type NewOrderAdminData = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  /** Order total, in the smallest-unit-free numeric amount (e.g. 150000 for Rp150.000). */
  total: number;
  /** Human-readable payment status, e.g. "Menunggu Pembayaran", "Lunas". */
  paymentStatus: string;
  /** Currency code for formatting the total. Defaults to "IDR". */
  currency?: string;
};

/**
 * Formats a number as currency for display in the message.
 * Defaults to Indonesian Rupiah formatting (no decimal places).
 */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Builds the Indonesian-language WhatsApp notification sent to the admin
 * whenever a new Lapiita order comes in.
 */
export function newOrderAdmin(data: NewOrderAdminData): string {
  const { orderNumber, customerName, customerPhone, total, paymentStatus } = data;
  const currency = data.currency ?? "IDR";

  return [
    "🔔 *Pesanan Baru - Lapiita*",
    "",
    `No. Pesanan: *${orderNumber}*`,
    `Nama Pelanggan: ${customerName}`,
    `No. HP Pelanggan: ${customerPhone}`,
    `Total: *${formatAmount(total, currency)}*`,
    `Status Pembayaran: ${paymentStatus}`,
    "",
    "Mohon segera diperiksa dan ditindaklanjuti. Terima kasih 🙏",
  ].join("\n");
}
