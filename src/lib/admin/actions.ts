"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { MockProduct } from "@/lib/mock/products";
import type { ProductFormValues } from "@/components/admin/product-form-modal";

export type UploadImageResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Upload a single product image to Cloudinary and return its hosted URL.
 *
 * Uses a signed upload (via a direct call to Cloudinary's REST API, no SDK
 * dependency needed) so the API secret never reaches the browser. Requires
 * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
 * to be set — see `.env.example`.
 */
export async function uploadProductImage(
  formData: FormData
): Promise<UploadImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No image file was provided." };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      "[admin products] Cloudinary env vars are not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)."
    );
    return { success: false, error: "Image upload isn't configured yet." };
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "lapiita-karya/products";

    // Cloudinary signed uploads require a SHA-1 hash of every non-file
    // param (alphabetically sorted) plus the API secret appended at the end.
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[admin products] Cloudinary upload failed:", body);
      return { success: false, error: "Image upload failed. Please try again." };
    }

    const data = (await response.json()) as { secure_url?: string };
    if (!data.secure_url) {
      return { success: false, error: "Image upload failed. Please try again." };
    }

    return { success: true, url: data.secure_url };
  } catch (error) {
    console.error("[admin products] failed to upload image:", error);
    return { success: false, error: "Image upload failed. Please try again." };
  }
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
  images: { url: string }[];
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
    take: 1,
    select: { url: true },
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
    imageUrl: product.images[0]?.url ?? null,
    updatedAt: product.updatedAt.toISOString(),
  };
}

/**
 * Create a new product from the admin "Add Product" form.
 *
 * - `Product` is always created.
 * - `ProductImage` is created only if the form supplied an image URL.
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
        images: values.imageUrl
          ? { create: [{ url: values.imageUrl, position: 0 }] }
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
 * `createProduct`. The image is replaced only when `values.imageUrl`
 * differs from what's already stored — since `ProductFormModal` always
 * pre-fills `imageUrl` with the product's current image, submitting the
 * form without picking a new file naturally keeps the old image.
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
          create: values.imageUrl
            ? [{ url: values.imageUrl, position: 0 }]
            : [],
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

/**
 * Delete a product from the admin products table.
 *
 * `ProductImage` and `ProductVariant` rows cascade-delete with the product.
 * `OrderItem` uses `onDelete: Restrict`, so deleting a product that appears
 * in an existing order fails with a foreign-key error (P2003) — surfaced
 * here as a friendly message rather than a crash.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  try {
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
        code === "P2003"
          ? "This product can't be deleted because it's part of an existing order. Archive it instead."
          : code === "P2025"
            ? "This product no longer exists. It may have already been deleted."
            : "Something went wrong deleting this product. Please try again.",
    };
  } finally {
    revalidatePath("/admin/products");
  }
}
