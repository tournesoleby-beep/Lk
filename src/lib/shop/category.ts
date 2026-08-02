import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/lib/queries/home";

export type ShopCategory = {
  slug: string;
  name: string;
  description: string;
  products: ProductCardData[];
};

/**
 * Fallback copy for categories that don't have a `description` set in the
 * database yet. Keyed by slug so the storefront still reads well while the
 * catalog is being filled in.
 */
const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  fashion:
    "Considered silhouettes and everyday essentials, cut from fabrics made to last.",
  food: "Small-batch and slow-made — pantry staples and treats worth the wait.",
  production:
    "Home and craft pieces from the studio floor, made in limited runs.",
};

/**
 * All queries here fail soft: the category page should render a designed
 * empty state rather than crash if the database is unreachable or unseeded.
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[shop category] falling back to empty result:", error);
    return fallback;
  }
}

function toProductCard(product: {
  id: string;
  name: string;
  slug: string;
  price: { toString(): string };
  compareAtPrice: { toString(): string } | null;
  currency: string;
  images: { url: string; altText: string | null }[];
  variants: { stock: number }[];
}): ProductCardData {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price.toString()),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice.toString())
      : null,
    currency: product.currency,
    imageUrl: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.altText ?? null,
    stock: product.variants.reduce((total, variant) => total + variant.stock, 0),
  };
}

/**
 * Look up a shop category by URL slug, with its active products. Returns
 * `null` if the slug doesn't match a known category — callers should render
 * a friendly empty state rather than a 404 in that case.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<ShopCategory | null> {
  return safeQuery(async () => {
    const category = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase() },
      select: {
        name: true,
        slug: true,
        description: true,
        products: {
          where: { status: "ACTIVE" },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            currency: true,
            images: {
              orderBy: { position: "asc" },
              take: 1,
              select: { url: true, altText: true },
            },
            variants: { select: { stock: true } },
          },
        },
      },
    });

    if (!category) return null;

    return {
      slug: category.slug,
      name: category.name,
      description:
        category.description ?? FALLBACK_DESCRIPTIONS[category.slug] ?? "",
      products: category.products.map(toProductCard),
    };
  }, null);
}
