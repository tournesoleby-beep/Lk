"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate transition-colors duration-150 hover:bg-cloud hover:text-ink"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          Disalin
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
          {label}
        </>
      )}
    </button>
  );
}
