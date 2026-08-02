"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { uploadImageToCloudinary, type UploadImageResult } from "@/lib/cloudinary";
import type { MockProduct } from "@/lib/mock/products";
import type { ProductFormValues } from "@/components/admin/product-form-modal";

export type { UploadImageResult };

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
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
    })),
    updatedAt: product.updatedAt.toISOString(),
  };
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
 * resolved to a `Category` row by slug, creating it if it doesn't exist yet
 * — the storefront already expects `fashion` / `food` / `production` to
 * exist, so this only ever matters for a category that hasn't been seeded.
 */
export async function createProduct(
  values: ProductFormValues
): Promise<SaveProductResult> {
  try {
    const slug = values.slug || slugify(values.name);
    const categorySlug = slugify(values.category);

    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: values.category, slug: categorySlug },
    });

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
 * `createProduct`. Images are replaced wholesale on every save — the form
 * always starts from the product's current images (see
 * `ProductFormModal`), so `values.images` already reflects any adds,
 * removes, or reordering the admin made before submitting.
 */
export async function updateProduct(
  id: string,
  values: ProductFormValues
): Promise<SaveProductResult> {
  try {
    const slug = values.slug || slugify(values.name);
    const categorySlug = slugify(values.category);

    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: values.category, slug: categorySlug },
    });

    // Stock is tracked on `ProductVariant`, not `Product` directly, so
    // update the existing "Default" variant if there is one, or create it
    // if this product somehow doesn't have one yet.
    const existingVariant = await prisma.productVariant.findFirst({
      where: { productId: id },
      select: { id: true },
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
