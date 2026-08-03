import { MessageCircle } from "lucide-react";

import { getWhatsAppLink } from "@/lib/whatsapp/config";

type WhatsAppButtonProps = {
  message: string;
  className?: string;
  children?: React.ReactNode;
};

const DEFAULT_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-cloud/60 px-6 py-3 text-sm font-medium text-ink shadow-xs transition-all duration-200 hover:bg-cloud active:scale-[0.98]";

/**
 * Opens a WhatsApp chat with the store, prefilled with `message`. Renders
 * nothing if `NEXT_PUBLIC_WHATSAPP_NUMBER` isn't configured (see
 * `lib/whatsapp/config`), rather than linking somewhere broken.
 */
export function WhatsAppButton({ message, className, children }: WhatsAppButtonProps) {
  const href = getWhatsAppLink(message);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? DEFAULT_CLASS}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
      {children ?? "Contact via WhatsApp"}
    </a>
  );
}
