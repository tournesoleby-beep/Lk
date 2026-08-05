"use client";

import { useState, useTransition } from "react";

import { approveReview, deleteReview } from "@/lib/admin/review-actions";
import { useToast } from "@/components/providers/toast-provider";

// Mirrors AdminReview from src/lib/admin/reviews.ts (getAdminReviews'
// return type) — redeclared here rather than imported so this file has no
// dependency on a server-only module (getAdminReviews calls prisma
// directly), which "use client" components can't import.
//
// `images` mirrors ProductReview.images (Json? in schema.prisma): empty
// array for reviews with no photos, so this stays compatible with every
// review that existed before photo support was added. getAdminReviews
// needs to select `images` and cast it from Json to string[] (Json can't
// be `null` on the wire once cast — normalize null to []).
type AdminReview = {
  id: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  images: string[];
  reviewerName: string;
  approved: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  product: { name: string };
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5 text-sm leading-none"
      aria-label={`${rating} dari 5 bintang`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "text-amber-500" : "text-line"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewPhotos({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-16 w-16 overflow-hidden rounded-lg border border-line"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  onApprove,
  onDelete,
  isPending,
}: {
  review: AdminReview;
  onApprove?: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink">{review.reviewerName}</span>
          <StarRating rating={review.rating} />
        </div>
        <span className="text-xs uppercase tracking-[0.1em] text-slate">
          {review.createdAt.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <p className="text-xs uppercase tracking-[0.1em] text-slate">{review.product.name}</p>

      {review.comment && <p className="text-sm text-ink/80">{review.comment}</p>}

      <ReviewPhotos images={review.images} />

      <div className="mt-2 flex items-center gap-2">
        {onApprove ? (
          <button
            type="button"
            onClick={() => onApprove(review.id)}
            disabled={isPending}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-ink px-4 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-all duration-200 hover:bg-ink/85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Setujui
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(review.id)}
          disabled={isPending}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-line px-4 text-xs font-medium uppercase tracking-[0.1em] text-slate transition-all duration-200 hover:border-signal/40 hover:text-signal active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {onApprove ? "Tolak" : "Hapus"}
        </button>
      </div>
    </div>
  );
}

export function ReviewModerationList({
  initialReviews,
}: {
  initialReviews: AdminReview[];
}) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [isPending, startTransition] = useTransition();

  const pending = reviews.filter((review) => !review.approved);
  const approved = reviews.filter((review) => review.approved);

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveReview(id);
      if (result.success) {
        setReviews((current) =>
          current.map((review) =>
            review.id === id ? { ...review, approved: true } : review
          )
        );
        toast({ title: "Ulasan disetujui", variant: "success" });
      } else {
        toast({ title: "Gagal menyetujui ulasan", description: result.error, variant: "info" });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteReview(id);
      if (result.success) {
        setReviews((current) => current.filter((review) => review.id !== id));
        toast({ title: "Ulasan dihapus", variant: "success" });
      } else {
        toast({ title: "Gagal menghapus ulasan", description: result.error, variant: "info" });
      }
    });
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-paper py-16 text-center">
        <p className="text-sm font-medium text-ink">Belum ada ulasan</p>
        <p className="text-sm text-slate">
          Ulasan pelanggan akan muncul di sini setelah dikirimkan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-base font-semibold text-ink">
          Menunggu Persetujuan ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="flex flex-col gap-3">
            {pending.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onApprove={handleApprove}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate">Tidak ada ulasan yang menunggu persetujuan.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-base font-semibold text-ink">
          Disetujui ({approved.length})
        </h2>
        {approved.length > 0 ? (
          <div className="flex flex-col gap-3">
            {approved.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate">Belum ada ulasan yang disetujui.</p>
        )}
      </div>
    </div>
  );
}
