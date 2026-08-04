import { prisma } from "@/lib/prisma";

// Fetches all product reviews for the admin reviews list, newest first.
// Only the product's name is pulled in via `select` since that's all the
// admin list needs to render — see ProductReview in schema.prisma for the
// full shape (reviewerName/rating/comment are snapshot fields already on
// the review itself).
export async function getAdminReviews() {
  const reviews = await prisma.productReview.findMany({
    include: {
      product: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews;
}

export type AdminReview = Awaited<ReturnType<typeof getAdminReviews>>[number];
