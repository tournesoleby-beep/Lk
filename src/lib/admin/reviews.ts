import { prisma } from "@/lib/prisma";

// Fetches all product reviews for the admin reviews list, newest first.
// Only the product's name is pulled in via `select` since that's all the
// admin list needs to render — see ProductReview in schema.prisma for the
// full shape (reviewerName/rating/comment are snapshot fields already on
// the review itself).
//
// `images` comes back from Prisma as Json? (could be null, or in principle
// any JSON value) — normalized to a plain string[] here so every caller,
// and the AdminReview type below (inferred from this function's return
// type), can treat it as a simple array. Reviews created before photo
// support existed have images: null and normalize to [].
export async function getAdminReviews() {
  const reviews = await prisma.productReview.findMany({
    include: {
      product: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    ...review,
    images: Array.isArray(review.images) ? (review.images as string[]) : [],
  }));
}

export type AdminReview = Awaited<ReturnType<typeof getAdminReviews>>[number];
