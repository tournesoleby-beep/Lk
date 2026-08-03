/**
 * WhatsApp contact link helper.
 *
 * Requires `NEXT_PUBLIC_WHATSAPP_NUMBER` (add to `.env.example` /
 * `.env.local`) — the store's WhatsApp number in international format,
 * digits only, no leading "+" (e.g. "6281234567890" for an Indonesian
 * number). Must be `NEXT_PUBLIC_` since the generated link is used from a
 * client component.
 */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

/**
 * Builds a `wa.me` link that opens a chat with the store, prefilled with
 * `message`. Returns `null` if no WhatsApp number is configured, so callers
 * can hide the button entirely rather than link somewhere broken.
 */
export function getWhatsAppLink(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
