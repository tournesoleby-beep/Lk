"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
// Same signed-upload helper already used for admin product images
// (src/lib/admin/actions.ts) and checkout payment-proof uploads
// (src/lib/checkout/payment-actions.ts) — `folder` keeps review photos
// separated from those in Cloudinary.
import { uploadImageToCloudinary } from "@/lib/cloudinary";

const submitReviewSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required."),
  productId: z.string().trim().min(1, "Product is required."),
  rating: z.coerce
    .number()
    .int("Please select a rating.")
    .min(1, "Please select a rating from 1 to 5 stars.")
    .max(5, "Please select a rating from 1 to 5 stars."),
  comment: z
    .string()
    .trim()
    .max(2000, "Comments can't be longer than 2000 characters.")
    .optional(),
});

export type SubmitReviewInput = {
  orderNumber: string;
  productId: string;
  rating: number;
  comment?: string;
};

export type SubmitReviewResult =
  | { success: true; reviewId: string }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Review photos
// ---------------------------------------------------------------------------

const MAX_REVIEW_IMAGES = 5;
// Cap applies to the file as sent by the client. review-form.tsx already
// compresses/resizes images before upload, so in practice these are only
// hit by a raw file the client-side compression skipped (e.g. decode
// failure) — this is the server-side backstop, not the primary control.
const MAX_REVIEW_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_REVIEW_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export type UploadReviewImagesResult =
  | { success: true; images: string[] }
  | { success: false; error: string };

/**
 * Uploads up to MAX_REVIEW_IMAGES photos for a review that was just created
 * by submitReview, and attaches their Cloudinary URLs to it.
 *
 * Deliberately a separate action/request from submitReview rather than
 * folded into it: submitReview's input stays plain JSON (matching every
 * other order-lookup action in this file), and a photo upload failure here
 * never rolls back or blocks the review itself from being submitted —
 * review-form.tsx surfaces it as a soft "review submitted, photos failed"
 * toast instead.
 *
 * Ownership: like submitReview, this has no customer-account check — it
 * trusts the caller to have just received reviewId from a successful
 * submitReview call in the same flow. That review starts with images: null
 * and approved: false, so there's no path for this to silently attach
 * photos to someone else's already-approved review.
 */
export async function uploadReviewImages(
  reviewId: string,
  formData: FormData
): Promise<UploadReviewImagesResult> {
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return { success: true, images: [] };
  }

  if (files.length > MAX_REVIEW_IMAGES) {
    return {
      success: false,
      error: `You can upload up to ${MAX_REVIEW_IMAGES} photos.`,
    };
  }

  for (const file of files) {
    if (!ALLOWED_REVIEW_IMAGE_TYPES.has(file.type)) {
      return {
        success: false,
        error: "Photos must be JPG, PNG, or WebP.",
      };
    }
    if (file.size > MAX_REVIEW_IMAGE_BYTES) {
      return {
        success: false,
        error: "Each photo must be smaller than 8MB.",
      };
    }
  }

  try {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      select: { id: true, images: true },
    });

    if (!review) {
      return { success: false, error: "We couldn't find that review." };
    }

    const existing = Array.isArray(review.images) ? (review.images as string[]) : [];

    const uploaded: string[] = [];
    for (const file of files) {
      const result = await uploadImageToCloudinary(file, "reviews");
      if (!result.success) {
        // Partial failure: keep whatever uploaded successfully so far
        // rather than losing it, but report the error so the form can
        // tell the customer some photos didn't make it.
        if (uploaded.length > 0) {
          const images = [...existing, ...uploaded].slice(0, MAX_REVIEW_IMAGES);
          await prisma.productReview.update({ where: { id: reviewId }, data: { images } });
        }
        return { success: false, error: result.error };
      }
      uploaded.push(result.url);
    }

    const images = [...existing, ...uploaded].slice(0, MAX_REVIEW_IMAGES);

    await prisma.productReview.update({
      where: { id: reviewId },
      data: { images },
    });

    revalidatePath("/orders/lookup");
    return { success: true, images };
  } catch (error) {
    console.error("[checkout] failed to upload review images:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengunggah foto. Ulasan Anda tetap tersimpan.",
    };
  }
}

/**
 * Submit a customer review from the /orders/lookup tracking page.
 *
 * Same public, unauth'd-by-orderNumber lookup model as
 * getOrderForTracking/getOrderForPayment/getOrderForInvoice (see
 * src/lib/checkout/orders.ts) — there are no customer accounts, so the
 * order number the customer was given at checkout is what authorizes the
 * review, the same way it authorizes viewing tracking/invoice.
 *
 * Enforces the eligibility rules that schema.prisma leaves to business
 * logic (see the comment on ProductReview there):
 * - the order must exist
 * - the order must be DELIVERED
 * - the product must actually be part of that order
 * - one review per product per order (also enforced at the DB level by
 *   ProductReview's @@unique([productId, orderId]), so a duplicate is
 *   caught here as a friendly message rather than a raw constraint error)
 *
 * reviewerName is a snapshot taken from the order's shipping address (or,
 * failing that, the guest user's name) at submission time, per the
 * ProductReview model comment — not a live User relation.
 *
 * Returns the new review's id on success so the caller can follow up with
 * uploadReviewImages for any attached photos.
 */
export async function submitReview(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check your review and try again.",
    };
  }

  const { orderNumber, productId, rating, comment } = parsed.data;

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        status: true,
        shippingAddress: { select: { fullName: true } },
        user: { select: { name: true } },
        items: { select: { productId: true } },
      },
    });

    if (!order) {
      return { success: false, error: "We couldn't find that order." };
    }

    if (order.status !== "DELIVERED") {
      return {
        success: false,
        error: "This order hasn't been delivered yet, so it can't be reviewed.",
      };
    }

    const productBelongsToOrder = order.items.some(
      (item) => item.productId === productId
    );
    if (!productBelongsToOrder) {
      return { success: false, error: "That product isn't part of this order." };
    }

    const reviewerName =
      order.shippingAddress?.fullName ?? order.user?.name ?? "Pelanggan";

    let reviewId: string;
    try {
      const review = await prisma.productReview.create({
        data: {
          productId,
          orderId: order.id,
          rating,
          comment: comment || null,
          reviewerName,
          approved: false,
        },
        select: { id: true },
      });
      reviewId = review.id;
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: unknown }).code
          : undefined;

      // ProductReview's @@unique([productId, orderId]) — someone already
      // reviewed this product for this order.
      if (code === "P2002") {
        return {
          success: false,
          error: "Anda sudah memberikan ulasan untuk produk ini.",
        };
      }
      throw error;
    }

    revalidatePath("/orders/lookup");
    return { success: true, reviewId };
  } catch (error) {
    console.error("[checkout] failed to submit review:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengirim ulasan. Silakan coba lagi.",
    };
  }
}
