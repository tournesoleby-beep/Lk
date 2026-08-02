import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

export type PaymentOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: string;
  paymentProofUrl: string | null;
};

/**
 * Look up an order by its order number for the /checkout/payment page.
 *
 * Lapiita Karya has no customer accounts (see src/auth.config.ts), so — same
 * as the pre-existing /checkout/success page — this is a public, unauth'd
 * lookup keyed on the order number the customer was just given. It only
 * returns the fields the payment page needs, not the full order.
 */
export async function getOrderForPayment(orderNumber: string): Promise<PaymentOrder | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        paymentProofUrl: true,
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total.toString()),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      paymentProofUrl: order.paymentProofUrl,
    };
  } catch (error) {
    console.error("[checkout] failed to load order for payment:", error);
    return null;
  }
}
