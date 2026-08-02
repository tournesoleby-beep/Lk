/**
 * Manual bank-transfer payment configuration for the /checkout/payment page.
 *
 * This is store-wide (one bank account, one QRIS code), not per-order, so it
 * lives in env vars rather than the database — see `.env.example`.
 */
export const BANK_NAME = process.env.BANK_NAME ?? "";
export const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER ?? "";
export const BANK_ACCOUNT_HOLDER = process.env.BANK_ACCOUNT_HOLDER ?? "";

// URL of a static QRIS image (e.g. uploaded to Cloudinary, same as product
// images — see src/lib/cloudinary.ts). Left blank, the QRIS block is hidden.
export const QRIS_IMAGE_URL = process.env.QRIS_IMAGE_URL ?? "";

// How long a customer has to pay before the deadline shown on the payment
// page passes. Purely informational — nothing currently auto-cancels an
// order once this passes; admins can still cancel manually.
export const PAYMENT_DEADLINE_HOURS = Number(
  process.env.PAYMENT_DEADLINE_HOURS ?? "24"
);
