import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { getOrderForTracking, getOrdersForPhoneTracking, PAID_EQUIVALENT_STATUSES } from "@/lib/checkout/orders";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { CopyOrderNumberButton } from "@/components/checkout/copy-order-number-button";
import { RecentOrders } from "@/components/checkout/recent-orders";
import { ReviewForm } from "@/components/checkout/review-form";
import {
  OrderTrackingTimeline,
  hasTrackingTimeline,
} from "@/components/checkout/order-tracking-timeline";
import { ShipmentInfo, hasShipmentInfo } from "@/components/checkout/shipment-info";

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
  // Order numbers are always "ORD-..." (see generateOrderNumber) — that
  // prefix is checked explicitly rather than inferred, so this can't
  // misclassify an order number even if its random suffix happens to be
  // all digits. Anything not in that shape is treated as a phone number
  // only if it actually looks like one (digits, optionally with "+",
  // spaces, or dashes); any other input falls through to the existing
  // order-number lookup, same as before this feature existed.
  const isOrderNumberInput = trimmed ? trimmed.toUpperCase().startsWith("ORD-") : false;
  const isPhoneInput = trimmed
    ? !isOrderNumberInput && /^\+?[0-9][0-9\s-]*$/.test(trimmed)
    : false;

  let order: Awaited<ReturnType<typeof getOrderForTracking>> = null;
  let phoneMatches: Awaited<ReturnType<typeof getOrdersForPhoneTracking>> | null = null;

  if (trimmed && isPhoneInput) {
    const matches = await getOrdersForPhoneTracking(trimmed);
    if (matches.length === 1) {
      order = await getOrderForTracking(matches[0].orderNumber);
    } else if (matches.length > 1) {
      phoneMatches = matches;
    }
  } else if (trimmed) {
    order = await getOrderForTracking(trimmed);
  }

  const notFound = Boolean(trimmed) && !order && !phoneMatches;
  const reviewItems = order?.items ?? [];
  const showReviewSection = order?.status === "DELIVERED" && reviewItems.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Bantuan"
              title="Lacak Pesanan"
              description="Masukkan nomor pesanan atau nomor HP untuk melihat status pesanan Anda."
            />

            {/* Plain GET form — no client JS needed, the order number just
                becomes a query param this page reads server-side. Its own
                card (rather than a pill-shaped search bar) so it reads as a
                dedicated lookup tool, not the site's product search. */}
            <form
              method="GET"
              className="flex w-full max-w-xl flex-col gap-2 rounded-2xl border border-line bg-paper p-6 shadow-xs sm:p-8"
            >
              <label
                htmlFor="order-lookup"
                className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate"
              >
                Nomor Pesanan atau Nomor HP
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <input
                  id="order-lookup"
                  type="text"
                  name="order"
                  defaultValue={trimmed ?? ""}
                  placeholder="Masukkan nomor pesanan atau nomor HP"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-h-[52px] w-full flex-1 rounded-xl border border-line bg-cloud/50 px-5 text-base text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10 sm:text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-xl bg-ink px-8 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                >
                  Lacak Pesanan
                </button>
              </div>

              <span className="mt-1 font-mono text-xs text-slate">
                Contoh: ORD-6MKMAB atau 0812xxxxxxxx
              </span>
            </form>

            {order ? (
              <div className="flex w-full max-w-xl flex-col gap-6">
                {/* Order header — order number, date, current status, total, CTA */}
                <div className="flex flex-col gap-6 rounded-2xl border border-line p-6 shadow-xs sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                        Nomor Pesanan
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-lg font-semibold text-ink sm:text-xl">
                          {order.orderNumber}
                        </span>
                        <CopyOrderNumberButton orderNumber={order.orderNumber} />
                      </div>
                      <span className="text-sm text-slate">
                        Dipesan pada {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-5 text-sm">
                    <span className="text-slate">Total Pesanan</span>
                    <span className="font-mono text-base font-semibold text-ink">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </div>

                  {!PAID_EQUIVALENT_STATUSES.has(order.status) ? (
                    <Link
                      href={`/checkout/payment?order=${encodeURIComponent(order.orderNumber)}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                    >
                      Lihat Detail Pembayaran
                    </Link>
                  ) : (
                    <a
                      href={`/api/orders/${encodeURIComponent(order.orderNumber)}/invoice`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4" strokeWidth={1.75} />
                      Unduh Invoice
                    </a>
                  )}
                </div>

                {/* Tracking timeline — only rendered while the order is still
                    on the normal fulfillment path (see hasTrackingTimeline) */}
                {hasTrackingTimeline(order.status) ? (
                  <div className="flex flex-col gap-6 rounded-2xl border border-line p-6 shadow-xs sm:p-8">
                    <h2 className="font-serif text-base font-semibold text-ink">
                      Status Pesanan
                    </h2>
                    <OrderTrackingTimeline status={order.status} />
                  </div>
                ) : null}

                {/* Shipment card — only once a carrier/tracking number exists */}
                {hasShipmentInfo(order) ? (
                  <div className="rounded-2xl border border-line p-6 shadow-xs sm:p-8">
                    <ShipmentInfo
                      carrier={order.shippingCarrier}
                      trackingNumber={order.trackingNumber}
                    />
                  </div>
                ) : null}

                {/* Review submission — only once the order has actually been
                    delivered. Each item's `review` comes from a real
                    ProductReview lookup (see getOrderForTracking); items
                    without one get the working ReviewForm, items with one
                    just show the "already reviewed" note. Items whose
                    product was since deleted (productId null) can't be
                    reviewed at all. */}
                {showReviewSection ? (
                  <div className="rounded-2xl border border-line p-6 shadow-xs sm:p-8">
                    <div className="flex flex-col gap-6">
                      <h2 className="font-serif text-base font-semibold text-ink">
                        Bagaimana produk yang Anda terima?
                      </h2>

                      <div className="flex flex-col gap-6">
                        {reviewItems.map((item, index) => {
                          const image = item.product?.images?.[0] ?? null;

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex flex-col gap-4",
                                index > 0 && "border-t border-line pt-6"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cloud">
                                  {image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={image.url}
                                      alt={image.altText ?? item.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <PlaceholderTile
                                      seed={item.name}
                                      label={item.name}
                                      className="h-full w-full"
                                    />
                                  )}
                                </div>
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                                  {item.name}
                                </span>
                              </div>

                              {item.review ? (
                                <p className="text-sm text-slate">
                                  ✓ Anda sudah memberikan ulasan untuk produk ini.
                                </p>
                              ) : item.productId ? (
                                <ReviewForm
                                  orderNumber={order.orderNumber}
                                  productId={item.productId}
                                  itemId={item.id}
                                  itemName={item.name}
                                />
                              ) : (
                                <p className="text-sm text-slate">
                                  Produk ini tidak lagi tersedia untuk diulas.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : phoneMatches ? (
              <div className="flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-line p-6 shadow-xs sm:p-8">
                <h2 className="font-serif text-base font-semibold text-ink">
                  Pilih Pesanan
                </h2>
                <div className="flex flex-col divide-y divide-line">
                  {phoneMatches.map((match) => (
                    <Link
                      key={match.orderNumber}
                      href={`/orders/lookup?order=${encodeURIComponent(match.orderNumber)}`}
                      className="flex items-center justify-between gap-4 py-4 text-sm transition-colors duration-200 hover:text-signal"
                    >
                      <span className="font-mono font-medium text-ink">
                        {match.orderNumber}
                      </span>
                      <OrderStatusBadge status={match.status} />
                    </Link>
                  ))}
                </div>
              </div>
            ) : notFound ? (
              <EmptyState message="Pesanan tidak ditemukan. Periksa kembali nomor pesanan atau nomor HP yang Anda masukkan." />
            ) : null}

            <RecentOrders />
          </Container>
        </section>
      </main>
    </div>
  );
}
