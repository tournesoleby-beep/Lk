import type { Metadata } from "next";

import { getAdminReviews } from "@/lib/admin/reviews";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Reviews — Admin — Lapiita Karya",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5 text-sm leading-none"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "text-amber-500" : "text-line"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-paper py-16 text-center">
            <p className="text-sm font-medium text-ink">No reviews yet</p>
            <p className="text-sm text-slate">
              Customer reviews will show up here once they&apos;re submitted.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink">
                      {review.reviewerName}
                    </span>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="text-xs uppercase tracking-[0.1em] text-slate">
                    {review.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-xs uppercase tracking-[0.1em] text-slate">
                  {review.product.name}
                </p>

                {review.comment && (
                  <p className="text-sm text-ink/80">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
