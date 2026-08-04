import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

/**
 * All queries here fail soft: the admin dashboard should render zeroed-out
 * metrics rather than crash if the database is unreachable (same pattern as
 * src/lib/admin/orders.ts and src/lib/admin/products.ts).
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[admin analytics] falling back to empty result:", error);
    return fallback;
  }
}

// Same "needs admin attention" definition as the pending-orders caption on
// the dashboard cards in src/app/admin/page.tsx — kept here so this becomes
// the single source of truth for that grouping.
const PENDING_ORDER_STATUSES: OrderStatus[] = ["PENDING", "WAITING_VERIFICATION"];

export type AdminAnalyticsOverview = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
};

const EMPTY_OVERVIEW: AdminAnalyticsOverview = {
  totalOrders: 0,
  totalRevenue: 0,
  pendingOrders: 0,
  totalProducts: 0,
};

/**
 * Basic store-wide overview metrics for the admin analytics dashboard:
 * total orders, total revenue (summed across all orders' `total` field),
 * orders currently pending action, and total products in the catalog.
 *
 * Deliberately simple counts/sums over the whole table — no date ranges,
 * breakdowns, or per-product aggregation yet.
 */
export async function getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  return safeQuery(async () => {
    const [totalOrders, revenue, pendingOrders, totalProducts] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.count({ where: { status: { in: PENDING_ORDER_STATUSES } } }),
      prisma.product.count(),
    ]);

    return {
      totalOrders,
      totalRevenue: Number(revenue._sum.total?.toString() ?? "0"),
      pendingOrders,
      totalProducts,
    };
  }, EMPTY_OVERVIEW);
}
