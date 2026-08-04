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

// Revenue should only reflect orders that were actually fulfilled. This
// project's OrderStatus enum has no "COMPLETED" value — SHIPPED and
// DELIVERED are its fulfilled/terminal-success states (same pairing used in
// src/lib/admin/order-actions.ts and src/lib/checkout/orders.ts), so those
// are what count here. Everything else (PENDING, WAITING_VERIFICATION,
// PAID, PROCESSING, PAYMENT_REJECTED, CANCELLED, REFUNDED) is excluded.
const FULFILLED_ORDER_STATUSES: OrderStatus[] = ["SHIPPED", "DELIVERED"];

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
 * total orders, total revenue (summed across fulfilled orders' `total`
 * field only — see FULFILLED_ORDER_STATUSES), orders currently pending
 * action, and total products in the catalog.
 *
 * Deliberately simple counts/sums over the whole table — no date ranges,
 * breakdowns, or per-product aggregation yet.
 */
export async function getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  return safeQuery(async () => {
    const [totalOrders, revenue, pendingOrders, totalProducts] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: FULFILLED_ORDER_STATUSES } },
      }),
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

export type ProductSold = {
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
};

export type AdminRevenueDetails = {
  totalRevenue: number;
  productsSold: ProductSold[];
};

const EMPTY_REVENUE_DETAILS: AdminRevenueDetails = {
  totalRevenue: 0,
  productsSold: [],
};

/**
 * Revenue breakdown for the admin analytics dashboard: total revenue from
 * fulfilled orders (same SHIPPED/DELIVERED rule as getAdminAnalyticsOverview,
 * via FULFILLED_ORDER_STATUSES), plus a per-product breakdown of quantity
 * sold and revenue generated.
 *
 * Reads from OrderItem rather than Product: `name` and `price` there are
 * snapshots taken at purchase time, so the breakdown reflects what was
 * actually sold even if a product was later renamed, repriced, or deleted
 * (productId is nullable — see prisma/schema.prisma OrderItem.productId).
 * Grouping by that snapshotted name keeps this consistent with the order
 * history the customer/admin actually see, at the cost of splitting a
 * product's totals across rows if its name changed between purchases.
 */
export async function getAdminRevenueDetails(): Promise<AdminRevenueDetails> {
  return safeQuery(async () => {
    const fulfilledItems = await prisma.orderItem.findMany({
      where: { order: { status: { in: FULFILLED_ORDER_STATUSES } } },
      select: { name: true, price: true, quantity: true },
    });

    const byProductName = new Map<string, ProductSold>();
    let totalRevenue = 0;

    for (const item of fulfilledItems) {
      const unitPrice = Number(item.price.toString());
      const lineRevenue = unitPrice * item.quantity;
      totalRevenue += lineRevenue;

      const existing = byProductName.get(item.name);
      if (existing) {
        existing.totalQuantitySold += item.quantity;
        existing.totalRevenue += lineRevenue;
      } else {
        byProductName.set(item.name, {
          productName: item.name,
          totalQuantitySold: item.quantity,
          totalRevenue: lineRevenue,
        });
      }
    }

    return {
      totalRevenue,
      productsSold: Array.from(byProductName.values()),
    };
  }, EMPTY_REVENUE_DETAILS);
}

export type RevenueByPeriod = {
  period: string;
  totalRevenue: number;
};

const EMPTY_REVENUE_BY_PERIOD: RevenueByPeriod[] = [];

/**
 * Revenue grouped by calendar month (YYYY-MM, in UTC) for the admin
 * analytics dashboard's time-based view.
 *
 * Only counts fulfilled orders (same SHIPPED/DELIVERED rule as
 * getAdminAnalyticsOverview and getAdminRevenueDetails, via
 * FULFILLED_ORDER_STATUSES) — unpaid, unverified, cancelled, and refunded
 * orders are excluded. Grouping is done in application code rather than a
 * raw SQL groupBy so the "fulfilled" definition stays centralized in
 * FULFILLED_ORDER_STATUSES instead of being duplicated as a query filter.
 *
 * Periods are returned sorted chronologically ascending.
 */
export async function getAdminRevenueByPeriod(): Promise<RevenueByPeriod[]> {
  return safeQuery(async () => {
    const fulfilledOrders = await prisma.order.findMany({
      where: { status: { in: FULFILLED_ORDER_STATUSES } },
      select: { createdAt: true, total: true },
    });

    const byPeriod = new Map<string, number>();

    for (const order of fulfilledOrders) {
      const period = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const orderTotal = Number(order.total.toString());
      byPeriod.set(period, (byPeriod.get(period) ?? 0) + orderTotal);
    }

    return Array.from(byPeriod.entries())
      .map(([period, totalRevenue]) => ({ period, totalRevenue }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, EMPTY_REVENUE_BY_PERIOD);
}
