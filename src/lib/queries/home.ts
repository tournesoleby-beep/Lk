import { prisma } from "@/lib/prisma";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  stock: number;
};

export type CategoryCardData = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
};

/**
 * All queries here fail soft: the homepage should render a designed empty
 * state rather than crash if the database is unreachable or unseeded (e.g.
 * in a fresh environment before `prisma migrate` + seed data have run).
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[home queries] falling back to empty result:", error);
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
    // Stock is tracked per `ProductVariant` (see prisma/schema.prisma), same
    // as src/lib/shop/product.ts — sum across variants for the simple,
    // single-variant products this storefront uses today.
    stock: product.variants.reduce((total, variant) => total + variant.stock, 0),
  };
}

/** Curated products (`featured: true`) for the homepage's flagship rail. */
export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  return safeQuery(async () => {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", featured: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
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
    });
    return products.map(toProductCard);
  }, []);
}

/** Most recently published products, for the "New Arrivals" rail. */
export async function getNewArrivals(limit = 8): Promise<ProductCardData[]> {
  return safeQuery(async () => {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: limit,
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
    });
    return products.map(toProductCard);
  }, []);
}

// Retired categories that must never appear on the homepage, keyed by
// slug (the schema's unique, safe identifier for a category — unlike
// `name`, which is free text and could be relabeled). Kept in sync with
// the same blocklist enforced in src/lib/admin/actions.ts so a category
// can't be re-created through the product form and still slip back onto
// the homepage. Includes both slugs seen for this category historically:
// the original "production" row, and "produksi" from when it was
// recreated with a different label.
const BLOCKED_CATEGORY_SLUGS = ["production", "produksi"];

/** Top-level categories (no parent), with a live product count each. */
export async function getTopCategories(limit = 6): Promise<CategoryCardData[]> {
  return safeQuery(async () => {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        // Excluded from the homepage grid — the storefront no longer
        // sells this category. See BLOCKED_CATEGORY_SLUGS above; delete
        // the row(s) in the Category table when convenient (see
        // scripts/remove-produksi-category), this filter is a safety net
        // that keeps it out of the UI even if such a row exists.
        slug: { notIn: BLOCKED_CATEGORY_SLUGS },
      },
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        _count: { select: { products: true } },
      },
    });
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      productCount: category._count.products,
    }));
  }, []);
}
