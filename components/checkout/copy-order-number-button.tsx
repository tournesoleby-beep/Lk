"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

/**
 * Small icon button next to the order number on the order lookup page.
 * Copies the order number to the clipboard in one tap and confirms via
 * the app's existing toast queue (see toast-provider.tsx), matching the
 * pattern already used by the cart/wishlist/newsletter components.
 */
export function CopyOrderNumberButton({
  orderNumber,
}: {
  orderNumber: string;
}) {
  const { toast } = useToast();
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(orderNumber);
      } else {
        // Fallback for browsers/webviews without Clipboard API support.
        const textarea = document.createElement("textarea");
        textarea.value = orderNumber;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setJustCopied(true);
      toast({ title: "Nomor pesanan disalin", variant: "success" });
      window.setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast({
        title: "Gagal menyalin nomor pesanan",
        description: "Silakan salin secara manual.",
        variant: "info",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Salin nomor pesanan"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate transition-all duration-200 hover:bg-cloud hover:text-signal active:scale-[0.94]"
      )}
    >
      {justCopied ? (
        <Check className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Copy className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
