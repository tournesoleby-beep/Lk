"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";

import { uploadPaymentProof } from "@/lib/checkout/payment-actions";

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";

export function PaymentProofUpload({ orderId }: { orderId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose an image of your payment proof.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsSubmitting(true);
    const result = await uploadPaymentProof(orderId, formData);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Re-fetches the server component so the page switches to the
    // "waiting for verification" state now that the upload succeeded.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Payment proof (screenshot or photo)</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3.5 file:py-1.5 file:text-xs file:font-medium file:uppercase file:tracking-[0.08em] file:text-paper"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        ) : (
          <Upload className="h-4 w-4" strokeWidth={1.75} />
        )}
        {isSubmitting ? "Uploading…" : "Upload payment proof"}
      </button>
    </form>
  );
}
