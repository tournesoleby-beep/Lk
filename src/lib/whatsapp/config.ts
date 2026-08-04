/**
 * WhatsApp contact link helper.
 *
 * Requires `NEXT_PUBLIC_WHATSAPP_NUMBER` (add to `.env.example` /
 * `.env.local`) — the store's WhatsApp number in international format,
 * digits only, no leading "+" (e.g. "6287811049055" for an Indonesian
 * number). Must be `NEXT_PUBLIC_` since the generated link is used from a
 * client component.
 *
 * The raw env value is sanitized to digits-only below: wa.me only accepts
 * a plain digit string in its path, and silently renders a blank/error
 * page — not the chat — if it gets a "+", space, dash, or parenthesis
 * instead (e.g. "+62 878-1104-9055" pasted straight from a contact card).
 * Stripping non-digits here means the link still works even if the env
 * var isn't entered in the exact plain-digits format.
 */
const RAW_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
export const WHATSAPP_NUMBER = RAW_WHATSAPP_NUMBER.replace(/\D/g, "");

/**
 * Builds a `wa.me` link that opens a chat with the store, prefilled with
 * `message`. `wa.me` itself handles the desktop/mobile split — desktop
 * browsers redirect to WhatsApp Web, mobile opens the native app — so no
 * separate api.whatsapp.com/send URL or platform detection is needed here.
 * Returns `null` if no WhatsApp number is configured, so callers can hide
 * the button entirely rather than link somewhere broken.
 */
export function getWhatsAppLink(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
