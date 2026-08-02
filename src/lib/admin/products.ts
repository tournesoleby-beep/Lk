import { prisma } from "@/lib/prisma";
import type { MockProduct } from "@/lib/mock/products";

/**
 * All queries here fail soft: the admin products table should render its
 * empty state rather than crash if the database is unreachable.
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[admin products] falling back to empty result:", error);
    return fallback;
  }
}

/**
 * Fetch every product for the admin catalog table, shaped as `MockProduct`
 * (see src/lib/mock/products.ts) so the existing UI components — which were
 * built against that shape — don't need to change.
 *
 * Note: the `Product` model has no direct stock column; stock is tracked per
 * variant, so we sum variant stock here. Products without variants show 0.
 */
type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: { toString(): string };
  compareAtPrice: { toString(): string } | null;
  currency: string;
  status: MockProduct["status"];
  featured: boolean;
  updatedAt: Date;
  category: { name: string } | null;
  images: { id: string; url: string; altText: string | null }[];
  variants: { stock: number }[];
};

function toAdminProduct(product: AdminProductRow): MockProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category: product.category?.name ?? "Uncategorized",
    price: Number(product.price.toString()),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice.toString())
      : null,
    currency: product.currency,
    status: product.status,
    featured: product.featured,
    stock: product.variants.reduce(
      (total: number, variant: { stock: number }) => total + variant.stock,
      0
    ),
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
    })),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function getAdminProducts(): Promise<MockProduct[]> {
  return safeQuery(async () => {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        currency: true,
        status: true,
        featured: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: {
          orderBy: { position: "asc" },
          select: { id: true, url: true, altText: true },
        },
        variants: { select: { stock: true } },
      },
    });

    return products.map(toAdminProduct);
  }, []);
}
