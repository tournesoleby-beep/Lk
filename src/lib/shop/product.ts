import { prisma } from "@/lib/prisma";

export type ShopProductReview = {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  reviewerName: string;
  createdAt: string;
};

export type ShopProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  category: { name: string; slug: string } | null;
  images: { url: string; altText: string | null }[];
  reviews: ShopProductReview[];
  reviewCount: number;
  averageRating: number | null;
};

/**
 * All queries here fail soft: the product page should render a designed
 * empty state rather than crash if the database is unreachable.
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[shop product] falling back to empty result:", error);
    return fallback;
  }
}

/**
 * Look up a single storefront product by slug. Only `ACTIVE` products are
 * returned — a draft product's slug should 404 (render the "not found"
 * empty state) the same way an unknown slug does, since it isn't published
 * yet.
 *
 * Reviews are limited to `approved: true` — a review only becomes visible
 * here once an admin approves it from /admin/reviews (see
 * src/lib/admin/review-actions.ts). averageRating is computed from that
 * same approved set, so it moves in lockstep with what's actually shown.
 */
export async function getProductBySlug(
  slug: string
): Promise<ShopProductDetail | null> {
  return safeQuery(async () => {
    const product = await prisma.product.findFirst({
      where: { slug: slug.toLowerCase(), status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        currency: true,
        category: { select: { name: true, slug: true } },
        images: {
          orderBy: { position: "asc" },
          select: { url: true, altText: true },
        },
        variants: { select: { stock: true } },
        productReviews: {
          where: { approved: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            images: true,
            reviewerName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) return null;

    const reviews: ShopProductReview[] = product.productReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      // ProductReview.images is Json? — normalize null/anything-not-an-array
      // to [] so every caller can treat it as a plain string array.
      images: Array.isArray(review.images) ? (review.images as string[]) : [],
      reviewerName: review.reviewerName,
      createdAt: review.createdAt.toISOString(),
    }));
    const reviewCount = reviews.length;
    const averageRating = reviewCount
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price.toString()),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice.toString())
        : null,
      currency: product.currency,
      stock: product.variants.reduce((total, variant) => total + variant.stock, 0),
      category: product.category,
      images: product.images,
      reviews,
      reviewCount,
      averageRating,
    };
  }, null);
}
