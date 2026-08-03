"use client";

import { useEffect } from "react";

import { saveRecentOrder, type RecentOrder } from "@/lib/orders/recent-orders";

/**
 * Renders nothing — just persists the order to this device's localStorage
 * "Recent Orders" list on mount. Kept as its own tiny client component so
 * the (server-rendered) success page it lives on doesn't need to become a
 * client component itself.
 */
export function SaveRecentOrder(props: Omit<RecentOrder, "savedAt">) {
  const { orderNumber, status, total, currency, createdAt } = props;

  useEffect(() => {
    saveRecentOrder({ orderNumber, status, total, currency, createdAt });
    // Re-run if the customer lands back on this page for the same order
    // with an updated status (e.g. after a refresh).
  }, [orderNumber, status, total, currency, createdAt]);

  return null;
}
