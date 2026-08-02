"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { AdminOrderListItem } from "@/lib/admin/orders";
import { EmptyState } from "@/components/home/empty-state";
import { OrderStatusBadge, ORDER_STATUS_LABELS } from "@/components/admin/order-status-badge";

const STATUS_FILTERS: { label: string; value: OrderStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  ...(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(
    ([value, label]) => ({ label, value })
  ),
];

const PAGE_SIZE = 10;

export function OrdersManager({ initialOrders }: { initialOrders: AdminOrderListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return initialOrders.filter((order) => {
      const matchesQuery =
        !trimmed ||
        order.orderNumber.toLowerCase().includes(trimmed) ||
        order.customerName.toLowerCase().includes(trimmed) ||
        order.email.toLowerCase().includes(trimmed) ||
        order.phone.toLowerCase().includes(trimmed);
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [initialOrders, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    (currentPage - 1) * PAGE_SIZE + PAGE_SIZE
  );

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatusFilter(value: OrderStatus | "ALL") {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
          Fulfillment
        </span>
        <h1 className="font-serif text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-3xl">
          Orders
        </h1>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search by order #, name, email, or phone…"
            aria-label="Search orders"
            className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => updateStatusFilter(filter.value)}
              aria-pressed={statusFilter === filter.value}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95",
                statusFilter === filter.value
                  ? "bg-ink text-paper shadow-sm"
                  : "border border-line text-slate hover:border-ink/25 hover:bg-cloud/60 hover:text-ink"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No orders match your search or filter. Try a different name, email, phone, or status." />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line shadow-xs md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-cloud/60">
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Order
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Customer
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Email
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Phone
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Date
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Total
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Status
                  </th>
                  <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Proof
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-cloud/40"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-ink">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-ink">{order.customerName}</td>
                    <td className="px-5 py-3 text-slate">{order.email}</td>
                    <td className="px-5 py-3 text-slate">{order.phone}</td>
                    <td className="px-5 py-3 text-slate">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3 font-mono text-ink">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "font-mono text-[10px] font-medium uppercase tracking-[0.1em]",
                          order.hasPaymentProof ? "text-signal" : "text-slate"
                        )}
                      >
                        {order.hasPaymentProof ? "Uploaded" : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium uppercase tracking-[0.1em] text-ink underline underline-offset-4 transition-colors duration-200 hover:text-signal"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {paginated.map((order) => (
              <li key={order.id} className="rounded-2xl border border-line p-4 shadow-xs transition-shadow duration-200 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-slate">{order.orderNumber}</span>
                    <span className="font-medium text-ink">{order.customerName}</span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex flex-col gap-1 text-xs text-slate">
                  <span>{order.email}</span>
                  <span>{order.phone}</span>
                  <span>{formatDate(order.createdAt)}</span>
                  <span>
                    Payment proof:{" "}
                    <span className={order.hasPaymentProof ? "text-signal" : "text-slate"}>
                      {order.hasPaymentProof ? "Uploaded" : "Not uploaded"}
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-ink">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs font-medium uppercase tracking-[0.1em] text-ink underline underline-offset-4 transition-colors duration-200 hover:text-signal"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate">
                Page {currentPage} of {pageCount} · {filtered.length}{" "}
                {filtered.length === 1 ? "order" : "orders"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink transition-all duration-200 hover:bg-cloud/60 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink transition-all duration-200 hover:bg-cloud/60 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
