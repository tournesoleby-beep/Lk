"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { uploadImageToCloudinary, type UploadImageResult } from "@/lib/cloudinary";
import type { MockProduct } from "@/lib/mock/products";
import type { ProductFormValues } from "@/components/admin/product-form-modal";
import {
  recordStockChange,
  queryProductStockHistory,
  type StockHistoryEntry,
} from "@/lib/admin/stock-history";

export type { UploadImageResult };

// Product image uploads (see uploadProductImage below) are capped at 5MB.
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Fetch a single product's stock ledger, newest first, for the Stock
 * History section of the admin "Edit product" modal (see
 * src/components/admin/product-form-modal.tsx). Thin re-export as a server
 * action so the client component can call it directly, the same way it
 * already calls createProduct/updateProduct/deleteProduct below.
 */
export async function getProductStockHistory(
  productId: string
): Promise<StockHistoryEntry[]> {
  return queryProductStockHistory(productId);
}

/**
 * Upload a single product image to Cloudinary and return its hosted URL.
 * Thin wrapper around the shared helper in src/lib/cloudinary.ts.
 */
export async function uploadProductImage(
  formData: FormData
): Promise<UploadImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No image file was provided." };
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return { success: false, error: "Image must be smaller than 5MB." };
  }

  return uploadImageToCloudinary(file, "lapiita-karya/products");
}

export type SaveProductResult =
  | { success: true; product: MockProduct }
  | { success: false; error: string };

type CreatedProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: { toString(): string };
  compareAtPrice: { toString(): string } | null;
  currency: string;
  status: MockProduct["status"];
  featured: boolean;
  weightGrams: number;
  updatedAt: Date;
  category: { name: string } | null;
  images: { id: string; url: string; altText: string | null }[];
  variants: { stock: number }[];
};

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  status: true,
  featured: true,
  weightGrams: true,
  updatedAt: true,
  category: { select: { name: true } },
  images: {
    orderBy: { position: "asc" as const },
    select: { id: true, url: true, altText: true },
  },
  variants: { select: { stock: true } },
} as const;

function toMockProduct(product: CreatedProductRow): MockProduct {
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
    weightGrams: product.weightGrams,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
    })),
    updatedAt: product.updatedAt.toISOString(),
  };
}

const DEFAULT_WEIGHT_GRAMS = 500;

/**
 * The admin form already defaults/validates weight on the client (see
 * ProductFormModal), but a server action should never fully trust client
 * input — fall back to the same 500g default here for anything missing,
 * non-numeric, negative, or zero, rather than persisting a bad value.
 */
function normalizeWeightGrams(value: number | undefined | null): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_WEIGHT_GRAMS;
  }
  return Math.round(value);
}

// The "Produksi" / "Production" category was retired — we no longer sell
// or upload products under it. Blocked by slug (not just name) so it can
// never be recreated through the product form, regardless of what casing
// or label the client sends. Kept as a small explicit blocklist rather
// than only relying on the category no longer existing in the DB, so a
// stray re-seed or manual insert can't quietly reopen this path.
const BLOCKED_CATEGORY_SLUGS = new Set(["produksi", "production"]);

/**
 * Resolve `values.category` (a category name/label from the admin form,
 * e.g. "Fashion") to an existing `Category` row by slug.
 *
 * This intentionally does NOT create categories. Previously both
 * createProduct and updateProduct called `prisma.category.upsert(...)`
 * here, which meant any free-text/unexpected category value from the
 * client silently created a new Category row — that's how a retired
 * category like "Produksi" could get recreated. Category management is
 * now out of scope for the product save flow: a product may only be
 * filed under a category that already exists, and a blocked or unknown
 * category slug fails the save with a clear error instead of creating
 * anything.
 */
async function resolveCategoryId(
  categoryInput: string
): Promise<{ id: string } | { id: null; error: string }> {
  const categorySlug = slugify(categoryInput);

  if (BLOCKED_CATEGORY_SLUGS.has(categorySlug)) {
    return {
      id: null,
      error: "This category is no longer available. Please choose a different category.",
    };
  }

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });

  if (!category) {
    return {
      id: null,
      error: "Please select a valid, existing category.",
    };
  }

  return category;
}

/**
 * Create a new product from the admin "Add Product" form.
 *
 * - `Product` is always created.
 * - A `ProductImage` row is created for each image in `values.images`, in
 *   order — array index becomes `position`, so the first image is always
 *   the cover shown in listings.
 * - A single "Default" `ProductVariant` is created to hold the stock count
 *   entered in the form, since stock is tracked per-variant rather than on
 *   `Product` directly.
 *
 * The product's category (a plain string on the form, e.g. "Fashion") is
 * resolved to an existing `Category` row by slug (see resolveCategoryId
 * above). It is never created here — a category must already exist (and
 * not be on the blocklist) for the product to save, so arbitrary or
 * retired category text can't silently create/recreate a Category row.
 */
export async function createProduct(
  values: ProductFormValues
): Promise<SaveProductResult> {
  try {
    const slug = values.slug || slugify(values.name);

    const category = await resolveCategoryId(values.category);
    if (category.id === null) {
      return { success: false, error: category.error };
    }

    const product = await prisma.product.create({
      data: {
        name: values.name,
        slug,
        sku: values.sku || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice ?? null,
        currency: values.currency,
        status: values.status,
        featured: values.featured,
        weightGrams: normalizeWeightGrams(values.weightGrams),
        categoryId: category.id,
        images: values.images.length
          ? {
              create: values.images.map((image, position) => ({
                url: image.url,
                altText: image.altText || null,
                position,
              })),
            }
          : undefined,
        variants: {
          create: [
            {
              name: "Default",
              sku: values.sku || null,
              stock: values.stock,
              options: {},
            },
          ],
        },
      },
      select: PRODUCT_SELECT,
    });

    // Best-effort: the ledger entry documents the product's starting stock,
    // but a logging failure should never fail the product creation itself.
    try {
      await recordStockChange({
        productId: product.id,
        previousStock: 0,
        newStock: values.stock,
        reason: "INITIAL_STOCK",
      });
    } catch (error) {
      console.error("[admin products] failed to log initial stock:", error);
    }

    return { success: true, product: toMockProduct(product) };
  } catch (error) {
    console.error("[admin products] failed to create product:", error);

    const isUniqueConstraintError =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002";

    return {
      success: false,
      error: isUniqueConstraintError
        ? "A product with that slug or SKU already exists."
        : "Something went wrong saving this product. Please try again.",
    };
  } finally {
    // Keep the server-rendered admin products list (and any other view of
    // this data) in sync with what was just written.
    revalidatePath("/admin/products");
  }
}

/**
 * Update an existing product from the admin "Edit product" modal.
 *
 * Reuses the same field-mapping and category-resolution logic as
 * `createProduct` (see resolveCategoryId) — a product can only be moved to
 * a category that already exists and isn't blocked; it never creates one.
 * Images are replaced wholesale on every save — the form always starts
 * from the product's current images (see `ProductFormModal`), so
 * `values.images` already reflects any adds, removes, or reordering the
 * admin made before submitting.
 */
export async function updateProduct(
  id: string,
  values: ProductFormValues
): Promise<SaveProductResult> {
  try {
    const slug = values.slug || slugify(values.name);

    const category = await resolveCategoryId(values.category);
    if (category.id === null) {
      return { success: false, error: category.error };
    }

    // Stock is tracked on `ProductVariant`, not `Product` directly, so
    // update the existing "Default" variant if there is one, or create it
    // if this product somehow doesn't have one yet.
    const existingVariant = await prisma.productVariant.findFirst({
      where: { productId: id },
      select: { id: true, stock: true },
    });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: values.name,
        slug,
        sku: values.sku || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice ?? null,
        currency: values.currency,
        status: values.status,
        featured: values.featured,
        weightGrams: normalizeWeightGrams(values.weightGrams),
        categoryId: category.id,
        images: {
          deleteMany: {},
          create: values.images.map((image, position) => ({
            url: image.url,
            altText: image.altText || null,
            position,
          })),
        },
        variants: existingVariant
          ? {
              update: {
                where: { id: existingVariant.id },
                data: { stock: values.stock, sku: values.sku || null },
              },
            }
          : {
              create: [
                {
                  name: "Default",
                  sku: values.sku || null,
                  stock: values.stock,
                  options: {},
                },
              ],
            },
      },
      select: PRODUCT_SELECT,
    });

    // Best-effort ledger entry — see the note in createProduct above.
    // A product that never had a variant (edge case) is treated the same
    // as a fresh product: its first tracked stock count is "initial
    // stock" rather than a restock/adjustment.
    try {
      const previousStock = existingVariant?.stock ?? 0;
      await recordStockChange({
        productId: id,
        previousStock,
        newStock: values.stock,
        reason: !existingVariant
          ? "INITIAL_STOCK"
          : values.stock > previousStock
            ? "RESTOCK"
            : "MANUAL_ADJUSTMENT",
      });
    } catch (error) {
      console.error("[admin products] failed to log stock change:", error);
    }

    return { success: true, product: toMockProduct(product) };
  } catch (error) {
    console.error("[admin products] failed to update product:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2002"
          ? "A product with that slug or SKU already exists."
          : code === "P2025"
            ? "This product no longer exists. It may have already been deleted."
            : "Something went wrong saving this product. Please try again.",
    };
  } finally {
    revalidatePath("/admin/products");
  }
}

export type DeleteProductResult =
  | { success: true }
  | { success: false; error: string };

// Orders in these states are done, one way or another — they'll never be
// fulfilled, so a product that only appears in orders like these is free to
// be removed from the catalog. Everything else (PENDING through DELIVERED)
// is still "in flight" and should keep the product around.
const NON_BLOCKING_ORDER_STATUSES: OrderStatus[] = [
  "CANCELLED",
  "REFUNDED",
  "PAYMENT_REJECTED",
];

/**
 * Delete a product from the admin products table.
 *
 * `ProductImage` and `ProductVariant` rows cascade-delete with the product.
 * `OrderItem.productId` is nullable with `onDelete: SetNull` (see
 * prisma/schema.prisma) — order history keeps its own snapshot of
 * `name`/`price`/`quantity`, so it doesn't need a live product row and is
 * never the reason a delete should fail at the database level.
 *
 * The actual business rule — a product can't be deleted while it's part of
 * an *active* order — is enforced explicitly here, before the delete runs,
 * by checking order status rather than relying on a foreign-key error.
 * Cancelled, refunded, and payment-rejected orders don't count as active,
 * so a product whose only orders are in those states can be deleted freely.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  try {
    const blockingOrderItem = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: { status: { notIn: NON_BLOCKING_ORDER_STATUSES } },
      },
      select: { id: true },
    });

    if (blockingOrderItem) {
      return {
        success: false,
        error:
          "This product can't be deleted because it's part of an active order. Archive it instead.",
      };
    }

    await prisma.product.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[admin products] failed to delete product:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This product no longer exists. It may have already been deleted."
          : "Something went wrong deleting this product. Please try again.",
    };
  } finally {
    revalidatePath("/admin/products");
  }
}
