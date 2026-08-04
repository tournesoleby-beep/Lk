import type { Metadata } from "next";
import Link from "next/link";
import { Search, Download } from "lucide-react";

import { getOrderForPayment, PAID_EQUIVALENT_STATUSES } from "@/lib/checkout/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { CopyOrderNumberButton } from "@/components/checkout/copy-order-number-button";
import { RecentOrders } from "@/components/checkout/recent-orders";

export const metadata: Metadata = {
  title: "Lacak pesanan — Lapiita Karya",
};

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
              eyebrow="Bantuan"
              title="Lacak Pesanan"
              description="Masukkan nomor pesanan dari email konfirmasi Anda untuk melihat statusnya."
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
                  placeholder="cth. ORD-1A2B3C4D"
                  className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-base text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Lacak Pesanan
              </button>
            </form>

            {order ? (
              <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-line p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm text-ink">
                      {order.orderNumber}
                    </span>
                    <CopyOrderNumberButton orderNumber={order.orderNumber} />
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="text-slate">Dipesan</span>
                  <span className="text-ink">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Total</span>
                  <span className="font-mono text-ink">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </div>

                {!PAID_EQUIVALENT_STATUSES.has(order.status) ? (
                  <Link
                    href={`/checkout/payment?order=${encodeURIComponent(order.orderNumber)}`}
                    className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                  >
                    Lihat Detail Pembayaran
                  </Link>
                ) : (
                  <a
                    href={`/api/orders/${encodeURIComponent(order.orderNumber)}/invoice`}
                    className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                    Unduh Invoice
                  </a>
                )}
              </div>
            ) : notFound ? (
              <EmptyState message="Kami tidak dapat menemukan pesanan dengan nomor tersebut. Periksa kembali nomor pesanan dari email konfirmasi Anda, lalu coba lagi." />
            ) : null}

            <RecentOrders />
          </Container>
        </section>
      </main>
    </div>
  );
}
