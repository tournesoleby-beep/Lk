"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/email/order-emails";
import { recordStockChange } from "@/lib/admin/stock-history";
import { BITESHIP_COURIERS, courierLabelForCode } from "@/lib/biteship";

export type UpdateOrderStatusResult =
  | { success: true }
  | { success: false; error: string };

export type DeleteOrderResult =
  | { success: true }
  | { success: false; error: string };

const VALID_STATUSES: OrderStatus[] = [
  "PENDING",
  "WAITING_VERIFICATION",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "PAYMENT_REJECTED",
];

/**
 * Update an order's status from the admin order detail page, then email the
 * customer about the change. Reuses the existing `Order.status` column — no
 * schema changes.
 *
 * The email send is best-effort (see sendOrderStatusEmail): if it fails, the
 * status update itself still succeeds.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<UpdateOrderStatusResult> {
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: "That isn't a valid order status." };
  }

  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!existing) {
      return { success: false, error: "This order no longer exists." };
    }

    // Stock is only ever reduced once, the moment an order first becomes
    // PAID — not on every subsequent status change (e.g. PAID -> SHIPPED
    // shouldn't deduct again).
    const shouldReduceStock = status === "PAID" && existing.status !== "PAID";

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: {
        orderNumber: true,
        user: { select: { email: true, name: true } },
        shippingAddress: { select: { fullName: true } },
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (shouldReduceStock) {
      // Stock lives on `ProductVariant`, not `Product` directly (see
      // prisma/schema.prisma and src/lib/admin/actions.ts) — every product
      // created/edited from the admin form has a single "Default" variant
      // holding its stock count, so deduct from that. Items whose product
      // was since deleted (productId is nullable via onDelete: SetNull)
      // have nothing left to deduct from and are skipped.
      for (const item of order.items) {
        if (!item.productId) continue;
        const variant = await prisma.productVariant.findFirst({
          where: { productId: item.productId },
          select: { id: true, stock: true },
        });
        if (!variant) continue;
        const newStock = Math.max(0, variant.stock - item.quantity);
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: newStock },
        });
        try {
          await recordStockChange({
            productId: item.productId,
            previousStock: variant.stock,
            newStock,
            reason: "ORDER_PAID",
            orderId,
          });
        } catch (error) {
          console.error("[admin orders] failed to log stock reduction:", error);
        }
      }
    }

    const customerEmail = order.user.email;
    const customerName = order.shippingAddress?.fullName ?? order.user.name ?? "there";

    if (customerEmail) {
      await sendOrderStatusEmail({
        orderNumber: order.orderNumber,
        customerName,
        customerEmail,
        status,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[admin orders] failed to update order status:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This order no longer exists."
          : "Something went wrong updating the order status. Please try again.",
    };
  } finally {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/products");
  }
}

export type UpdateOrderShippingResult =
  | { success: true }
  | { success: false; error: string };

const VALID_COURIER_CODES = new Set(BITESHIP_COURIERS.map((courier) => courier.code));
// A manually-typed courier code (see ShippingUpdater's "Lainnya" option)
// won't be in the curated list above, but it still has to look like a
// real Biteship courier_code — lowercase letters/digits only, matching
// the shape of every code Biteship actually uses (jne, sicepat, jnt...).
const COURIER_CODE_SHAPE = /^[a-z0-9]{2,30}$/;

/**
 * Set the courier and tracking number for an order from the admin order
 * detail page. Stores both the Biteship courier code (used to query live
 * tracking, see src/lib/biteship.ts) and its human-readable label on
 * `shippingCarrier` — the tracking page displays the label but never the
 * raw code.
 *
 * Unlike updateOrderStatus, this never sends a customer email or touches
 * stock — it's purely shipping metadata. Clearing both fields (empty
 * courier + empty tracking number) is allowed, e.g. to correct a mistaken
 * entry.
 */
export async function updateOrderShipping(
  orderId: string,
  courierCode: string,
  trackingNumber: string
): Promise<UpdateOrderShippingResult> {
  const trimmedTrackingNumber = trackingNumber.trim();
  const trimmedCourierCode = courierCode.trim();

  if (trimmedCourierCode && !VALID_COURIER_CODES.has(trimmedCourierCode)) {
    if (!COURIER_CODE_SHAPE.test(trimmedCourierCode)) {
      return {
        success: false,
        error: "Courier code should be lowercase letters/numbers only (e.g. \"gojek\").",
      };
    }
    // Not in the curated list, but shaped like a real Biteship courier
    // code — accepted as-is (see ShippingUpdater's "Lainnya" option).
  }

  // A tracking number without a courier can't be looked up on Biteship, and
  // a courier without a tracking number has nothing to display — either
  // both are set or both are cleared.
  if (Boolean(trimmedCourierCode) !== Boolean(trimmedTrackingNumber)) {
    return {
      success: false,
      error: "Please provide both a courier and a tracking number, or leave both empty.",
    };
  }

  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "This order no longer exists." };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        biteshipCourierCode: trimmedCourierCode || null,
        shippingCarrier: trimmedCourierCode ? courierLabelForCode(trimmedCourierCode) : null,
        trackingNumber: trimmedTrackingNumber || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[admin orders] failed to update order shipping:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This order no longer exists."
          : "Something went wrong updating the shipping info. Please try again.",
    };
  } finally {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/orders/lookup");
  }
}

/**
 * Delete an order from the admin orders list.
 */
export async function deleteOrder(orderId: string): Promise<DeleteOrderResult> {
  try {
    await prisma.order.delete({ where: { id: orderId } });

    return { success: true };
  } catch (error) {
    console.error("[admin orders] failed to delete order:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This order no longer exists."
          : "Something went wrong deleting the order. Please try again.",
    };
  } finally {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }
}

export type UpdateReviewResult =
  | { success: true }
  | { success: false; error: string };

export type DeleteReviewResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Approve a pending product review so it becomes publicly visible.
 */
export async function approveProductReview(reviewId: string): Promise<UpdateReviewResult> {
  try {
    await prisma.productReview.update({
      where: { id: reviewId },
      data: { approved: true },
    });

    return { success: true };
  } catch (error) {
    console.error("[admin reviews] failed to approve review:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This review no longer exists."
          : "Something went wrong approving the review. Please try again.",
    };
  } finally {
    revalidatePath("/admin/reviews");
  }
}

/**
 * Mark a review as featured (e.g. for display on the product page).
 */
export async function featureProductReview(reviewId: string): Promise<UpdateReviewResult> {
  try {
    await prisma.productReview.update({
      where: { id: reviewId },
      data: { featured: true },
    });

    return { success: true };
  } catch (error) {
    console.error("[admin reviews] failed to feature review:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This review no longer exists."
          : "Something went wrong featuring the review. Please try again.",
    };
  } finally {
    revalidatePath("/admin/reviews");
  }
}

/**
 * Remove a review's featured status.
 */
export async function unfeatureProductReview(reviewId: string): Promise<UpdateReviewResult> {
  try {
    await prisma.productReview.update({
      where: { id: reviewId },
      data: { featured: false },
    });

    return { success: true };
  } catch (error) {
    console.error("[admin reviews] failed to unfeature review:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This review no longer exists."
          : "Something went wrong unfeaturing the review. Please try again.",
    };
  } finally {
    revalidatePath("/admin/reviews");
  }
}

/**
 * Delete a product review from the admin reviews list.
 */
export async function deleteProductReview(reviewId: string): Promise<DeleteReviewResult> {
  try {
    await prisma.productReview.delete({ where: { id: reviewId } });

    return { success: true };
  } catch (error) {
    console.error("[admin reviews] failed to delete review:", error);

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    return {
      success: false,
      error:
        code === "P2025"
          ? "This review no longer exists."
          : "Something went wrong deleting the review. Please try again.",
    };
  } finally {
    revalidatePath("/admin/reviews");
  }
}
