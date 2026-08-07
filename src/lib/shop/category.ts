import { prisma } from "@/lib/prisma";
import type { CategoryCardData, ProductCardData } from "@/lib/queries/home";

export type ShopCategoryProduct = ProductCardData & { categorySlug: string };

export type ShopCategory = {
  slug: string;
  name: string;
  description: string;
  products: ShopCategoryProduct[];
  subcategories: CategoryCardData[];
};

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  fashion:
    "Considered silhouettes and everyday essentials, cut from fabrics made to last.",
  food: "Small-batch and slow-made — pantry staples and treats worth the wait.",
  production:
    "Home and craft pieces from the studio floor, made in limited runs.",
};

const FASHION_SUBCATEGORY_ORDER = [
  "tas-rajut",
  "tas-mote",
  "batik",
  "aksesoris",
  "pouch",
];

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[shop category] falling back to empty result:", error);
    return fallback;
  }
}

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  images: {
    orderBy: { position: "asc" as const },
    take: 1,
    select: { url: true, altText: true },
  },
  variants: { select: { stock: true } },
} as const;

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

function sortSubcategories<T extends { slug: string }>(children: T[]): T[] {
  const order = FASHION_SUBCATEGORY_ORDER;
  const known = children.filter((c) => order.includes(c.slug));
  const rest = children.filter((c) => !order.includes(c.slug));
  known.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  return [...known, ...rest];
}

/**
 * Look up a shop category by URL slug, with its active products —
 * including products that live under its subcategories (children), so a
 * parent category page (e.g. Fashion) shows everything beneath it by
 * default. Each returned product carries `categorySlug` (its *direct*
 * category, which may be a subcategory) so callers can filter by
 * subcategory without a second query.
 *
 * Returns `null` if the slug doesn't match a known category — callers
 * should render a friendly empty state rather than a 404 in that case.
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
          select: PRODUCT_CARD_SELECT,
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            products: {
              where: { status: "ACTIVE" },
              orderBy: { updatedAt: "desc" },
              select: PRODUCT_CARD_SELECT,
            },
          },
        },
      },
    });

    if (!category) return null;

    const ownProducts: ShopCategoryProduct[] = category.products.map((p) => ({
      ...toProductCard(p),
      categorySlug: category.slug,
    }));

    const childProducts: ShopCategoryProduct[] = category.children.flatMap(
      (child) =>
        child.products.map((p) => ({
          ...toProductCard(p),
          categorySlug: child.slug,
        }))
    );

    const subcategories: CategoryCardData[] = sortSubcategories(
      category.children
    ).map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      imageUrl: child.imageUrl,
      productCount: child.products.length,
    }));

    return {
      slug: category.slug,
      name: category.name,
      description:
        category.description ?? FALLBACK_DESCRIPTIONS[category.slug] ?? "",
      products: [...ownProducts, ...childProducts],
      subcategories,
    };
  }, null);
}

export type FashionHomeCategories = {
  /** "Tampilkan Semua" tile data — Fashion itself, with its total count
   *  across the category and all its subcategories. */
  fashion: CategoryCardData;
  /** Tas Rajut, Tas Mote, Batik, Aksesoris, Pouch, in that fixed order. */
  subcategories: CategoryCardData[];
};

/**
 * Data for the homepage "Belanja per Kategori" section: Fashion's
 * subcategories plus a "Tampilkan Semua" tile for Fashion itself. Reads
 * from the same Category hierarchy as `getCategoryBySlug` — no separate
 * taxonomy.
 */
export async function getFashionHomeCategories(): Promise<FashionHomeCategories | null> {
  return safeQuery(async () => {
    const fashion = await prisma.category.findUnique({
      where: { slug: "fashion" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        products: { where: { status: "ACTIVE" }, select: { id: true } },
        children: {
          where: { slug: { in: FASHION_SUBCATEGORY_ORDER } },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            products: { where: { status: "ACTIVE" }, select: { id: true } },
          },
        },
      },
    });

    if (!fashion) return null;

    const totalProductCount =
      fashion.products.length +
      fashion.children.reduce((sum, child) => sum + child.products.length, 0);

    const subcategories = sortSubcategories(fashion.children).map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      imageUrl: child.imageUrl,
      productCount: child.products.length,
    }));

    return {
      fashion: {
        id: fashion.id,
        name: fashion.name,
        slug: fashion.slug,
        imageUrl: fashion.imageUrl,
        productCount: totalProductCount,
      },
      subcategories,
    };
  }, null);
}
