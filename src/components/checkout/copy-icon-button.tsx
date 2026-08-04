"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

const DEFAULT_BUTTON_CLASS =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate transition-all duration-200 hover:bg-cloud hover:text-signal active:scale-[0.94]";

/**
 * Generic copy-to-clipboard icon button. Extracted from what used to be
 * order-number-only logic in `CopyOrderNumberButton` so the same
 * clipboard/toast/fallback behavior can be reused by any short piece of
 * copyable text (order numbers, tracking numbers, etc.) without duplicating
 * it — `CopyOrderNumberButton` and `CopyTrackingNumberButton` are now thin
 * wrappers around this.
 */
export function CopyIconButton({
  value,
  ariaLabel,
  copiedTitle,
  errorTitle,
  errorDescription = "Silakan salin secara manual.",
  className,
}: {
  value: string;
  ariaLabel: string;
  copiedTitle: string;
  errorTitle: string;
  errorDescription?: string;
  className?: string;
}) {
  const { toast } = useToast();
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for browsers/webviews without Clipboard API support.
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setJustCopied(true);
      toast({ title: copiedTitle, variant: "success" });
      window.setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "info",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className={cn(DEFAULT_BUTTON_CLASS, className)}
    >
      {justCopied ? (
        <Check className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Copy className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
