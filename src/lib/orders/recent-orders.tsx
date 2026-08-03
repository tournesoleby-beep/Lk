"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import {
  getRecentOrdersServerSnapshot,
  getRecentOrdersSnapshot,
  subscribeToRecentOrders,
} from "@/lib/orders/recent-orders";
import { formatCurrency, formatDate } from "@/lib/utils";

// Local, best-effort label for a cached status string. Deliberately not the
// same component as the live `OrderStatusBadge` used elsewhere: an entry
// here can be stale (saved on a previous visit, status may have moved on
// since), so it's presented as a plain label rather than the same
// authoritative-looking badge the live lookup result gets.
function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * "Recent Orders on This Device" — reads from localStorage via
 * `useSyncExternalStore`, so it renders empty on the server/first paint
 * (matching hydration) and picks up the real list right after, including
 * updates from other tabs. Renders nothing at all if there's no history
 * yet, so it never adds empty chrome to the page.
 */
export function RecentOrders() {
  const orders = useSyncExternalStore(
    subscribeToRecentOrders,
    getRecentOrdersSnapshot,
    getRecentOrdersServerSnapshot
  );

  if (orders.length === 0) return null;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
        Recent orders on this device
      </h2>
      <ul className="flex flex-col gap-2.5">
        {orders.map((order) => (
          <li key={order.orderNumber}>
            <Link
              href={`/orders/lookup?order=${encodeURIComponent(order.orderNumber)}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm transition-colors duration-200 hover:bg-cloud/60"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-mono text-ink">{order.orderNumber}</span>
                <span className="text-xs text-slate">
                  {formatDate(order.createdAt)} · {statusLabel(order.status)}
                </span>
              </span>
              <span className="font-mono text-ink">
                {formatCurrency(order.total, order.currency)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
