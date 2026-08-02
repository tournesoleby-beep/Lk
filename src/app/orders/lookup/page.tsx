import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { getOrderForPayment } from "@/lib/checkout/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

export const metadata: Metadata = {
  title: "Track an order — Lapiita Karya",
};

const CONFIRMED_STATUSES = new Set(["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]);

export default async function OrderLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const trimmed = orderNumber?.trim();
  const order = trimmed ? await getOrderForPayment(trimmed) : null;
  const notFound = Boolean(trimmed) && !order;

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Support"
              title="Track an order"
              description="Enter the order number from your confirmation email to check its status."
            />

            {/* Plain GET form — no client JS needed, the order number just
                becomes a query param this page reads server-side. */}
            <form
              method="GET"
              className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  name="order"
                  defaultValue={trimmed ?? ""}
                  placeholder="e.g. ORD-1A2B3C4D"
                  className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Track order
              </button>
            </form>

            {order ? (
              <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-line p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-ink">
                    {order.orderNumber}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="text-slate">Placed</span>
                  <span className="text-ink">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Total</span>
                  <span className="font-mono text-ink">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </div>

                {!CONFIRMED_STATUSES.has(order.status) ? (
                  <Link
                    href={`/checkout/payment?order=${encodeURIComponent(order.orderNumber)}`}
                    className="mt-2 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                  >
                    View payment details
                  </Link>
                ) : null}
              </div>
            ) : notFound ? (
              <EmptyState message="We couldn't find an order with that number. Double check the order number from your confirmation email and try again." />
            ) : null}
          </Container>
        </section>
      </main>
    </div>
  );
}
