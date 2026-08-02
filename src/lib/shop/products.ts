import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/lib/queries/home";

export type ShopProductCardData = ProductCardData & {
  category: { name: string; slug: string } | null;
};

/**
 * All queries here fail soft: the shop page should render a designed empty
 * state rather than crash if the database is unreachable.
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[shop products] falling back to empty result:", error);
    return fallback;
  }
}

/**
 * Every live product for the main `/shop` catalog page, including its
 * category, so the page can offer client-side search, category filtering,
 * and price sorting without a round-trip per interaction.
 */
export async function getShopProducts(): Promise<ShopProductCardData[]> {
  return safeQuery(async () => {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        currency: true,
        category: { select: { name: true, slug: true } },
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true, altText: true },
        },
        variants: { select: { stock: true } },
      },
    });

    return products.map((product) => ({
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
      category: product.category,
      stock: product.variants.reduce((total, variant) => total + variant.stock, 0),
    }));
  }, []);
}
