"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/email/order-emails";
import { recordStockChange } from "@/lib/admin/stock-history";

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
