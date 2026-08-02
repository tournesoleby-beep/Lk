import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

/**
 * All queries here fail soft: the admin orders table should render its
 * empty state rather than crash if the database is unreachable (mirrors
 * src/lib/admin/products.ts).
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[admin orders] falling back to empty result:", error);
    return fallback;
  }
}

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: string;
};

/**
 * Fetch every order for the admin table.
 *
 * Customer name/phone come from the order's `shippingAddress` (captured at
 * checkout time) rather than the `User` row, since Lapiita Karya has no
 * customer accounts — the guest "user" created at checkout only carries an
 * email. See src/lib/checkout/actions.ts.
 */
export async function getAdminOrders(): Promise<AdminOrderListItem[]> {
  return safeQuery(async () => {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
        shippingAddress: { select: { fullName: true, phone: true } },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.shippingAddress?.fullName ?? order.user.name ?? "—",
      email: order.user.email ?? "—",
      phone: order.shippingAddress?.phone ?? "—",
      status: order.status,
      total: Number(order.total.toString()),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
    }));
  }, []);
}

export type AdminOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  // `line2` carries checkout notes, not a literal second address line — see
  // the comment in src/lib/checkout/actions.ts on why it's reused that way.
  shippingAddress: { line1: string; notes: string | null } | null;
  items: AdminOrderItem[];
};

export async function getAdminOrderById(id: string): Promise<AdminOrderDetail | null> {
  return safeQuery(async () => {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        subtotal: true,
        shippingTotal: true,
        taxTotal: true,
        total: true,
        currency: true,
        user: { select: { email: true, name: true } },
        shippingAddress: {
          select: { fullName: true, phone: true, line1: true, line2: true },
        },
        items: { select: { id: true, name: true, price: true, quantity: true } },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      customerName: order.shippingAddress?.fullName ?? order.user.name ?? "—",
      email: order.user.email ?? "—",
      phone: order.shippingAddress?.phone ?? "—",
      subtotal: Number(order.subtotal.toString()),
      shippingTotal: Number(order.shippingTotal.toString()),
      taxTotal: Number(order.taxTotal.toString()),
      total: Number(order.total.toString()),
      currency: order.currency,
      shippingAddress: order.shippingAddress
        ? { line1: order.shippingAddress.line1, notes: order.shippingAddress.line2 }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price.toString()),
        quantity: item.quantity,
      })),
    };
  }, null);
}
