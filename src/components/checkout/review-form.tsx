"use client";

import { Fragment, useState, useTransition } from "react";
import { ImagePlus, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { submitReview } from "@/lib/checkout/review-actions";

/**
 * The working version of the review form that used to be static markup in
 * app/orders/lookup/page.tsx. Kept as its own client component (one
 * instance per order item, mounted from the server-rendered page) since it
 * needs local state for the rating/comment/submitting/submitted state that
 * a server component can't hold.
 *
 * Visual design — including the peer-checked star radio group and the
 * (still non-functional) optional-photo placeholder — is unchanged from
 * the original static markup; only the rating input is now controlled so
 * its value can be sent to submitReview.
 */
export function ReviewForm({
  orderNumber,
  productId,
  itemId,
  itemName,
}: {
  orderNumber: string;
  productId: string;
  itemId: string;
  itemName: string;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (rating < 1) {
      setRatingError("Silakan pilih rating bintang.");
      return;
    }
    setRatingError(null);

    startTransition(async () => {
      const result = await submitReview({
        orderNumber,
        productId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        toast({ title: "Ulasan terkirim", variant: "success" });
      } else {
        toast({
          title: "Gagal mengirim ulasan",
          description: result.error,
          variant: "info",
        });
      }
    });
  }

  if (submitted) {
    return (
      <p className="text-sm text-slate">
        ✓ Terima kasih! Ulasan Anda untuk {itemName} telah terkirim dan sedang menunggu persetujuan.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate">Rating</span>
        <div className="flex flex-row-reverse items-center justify-end gap-1">
          {[5, 4, 3, 2, 1].map((n) => (
            <Fragment key={n}>
              <input
                type="radio"
                id={`rating-${itemId}-${n}`}
                name={`rating-${itemId}`}
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setRatingError(null);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={`rating-${itemId}-${n}`}
                className="cursor-pointer text-line transition-colors duration-150 hover:text-signal peer-checked:text-signal"
              >
                <Star className="h-5 w-5" strokeWidth={1.75} fill="currentColor" />
              </label>
            </Fragment>
          ))}
        </div>
        {ratingError ? <p className="text-xs text-signal">{ratingError}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`comment-${itemId}`} className="text-xs text-slate">
          Komentar (opsional)
        </label>
        <textarea
          id={`comment-${itemId}`}
          name={`comment-${itemId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder="Ceritakan pengalaman Anda dengan produk ini..."
          className="w-full resize-none rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate">Foto (opsional)</span>
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-line text-slate/60">
          <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={cn(
          "mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
        )}
      >
        {isPending ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </div>
  );
}
