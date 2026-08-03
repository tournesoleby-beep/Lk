"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";

import { uploadPaymentProof } from "@/lib/checkout/payment-actions";

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";

export function PaymentProofUpload({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
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

    // Upload succeeded — take the customer to the success page rather than
    // just refreshing this page's "waiting for verification" state in
    // place, so they land somewhere that confirms what happened and gives
    // them next steps (copy order number, track order, contact us).
    router.push(`/checkout/payment/success?order=${encodeURIComponent(orderNumber)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Payment proof (screenshot or photo)</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-3 text-base text-ink outline-none transition-all duration-200 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-3.5 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.08em] file:text-paper file:transition-colors file:hover:bg-ink/85 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10 sm:py-2.5 sm:text-sm"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
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
