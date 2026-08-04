"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

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
  | { success: true }
  | { success: false; error: string };

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

    try {
      await prisma.productReview.create({
        data: {
          productId,
          orderId: order.id,
          rating,
          comment: comment || null,
          reviewerName,
          approved: false,
        },
      });
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
    return { success: true };
  } catch (error) {
    console.error("[checkout] failed to submit review:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengirim ulasan. Silakan coba lagi.",
    };
  }
}
