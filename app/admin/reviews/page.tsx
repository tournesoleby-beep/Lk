import type { Metadata } from "next";

import { getAdminReviews } from "@/lib/admin/reviews";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReviewModerationList } from "@/components/admin/review-moderation-list";

export const metadata: Metadata = {
  title: "Reviews — Admin — Lapiita Karya",
};

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />
        <ReviewModerationList initialReviews={reviews} />
      </Container>
    </div>
  );
}
