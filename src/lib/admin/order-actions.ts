"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/email/order-emails";

export type UpdateOrderStatusResult =
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
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: {
        orderNumber: true,
        user: { select: { email: true, name: true } },
        shippingAddress: { select: { fullName: true } },
      },
    });

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
  }
}
