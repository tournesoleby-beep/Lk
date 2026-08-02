import { prisma } from "@/lib/prisma";

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
      },
    });

    if (!product) return null;

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
    };
  }, null);
}
