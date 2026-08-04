import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, Download, Star, ImagePlus } from "lucide-react";

import { getOrderForTracking, PAID_EQUIVALENT_STATUSES } from "@/lib/checkout/orders";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { CopyOrderNumberButton } from "@/components/checkout/copy-order-number-button";
import { RecentOrders } from "@/components/checkout/recent-orders";
import {
  OrderTrackingTimeline,
  hasTrackingTimeline,
} from "@/components/checkout/order-tracking-timeline";
import { ShipmentInfo, hasShipmentInfo } from "@/components/checkout/shipment-info";

export const metadata: Metadata = {
  title: "Lacak pesanan — Lapiita Karya",
};

/**
 * Shape this page needs from an order item to render a review card.
 * `review` is speculative — the order item type returned by
 * `getOrderForTracking` doesn't currently expose it, so this optional
 * field is guarded everywhere it's read and simply falls back to
 * "not yet reviewed" until that's wired up on the data side.
 */
type ReviewableOrderItem = {
  id: string;
  name: string;
  product?: { images?: { url: string; altText?: string | null }[] | null } | null;
  review?: { id: string } | null;
};

export default async function OrderLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const trimmed = orderNumber?.trim();
  const order = trimmed ? await getOrderForTracking(trimmed) : null;
  const notFound = Boolean(trimmed) && !order;
  const reviewItems = (order?.items ?? []) as ReviewableOrderItem[];
  const showReviewSection = order?.status === "DELIVERED" && reviewItems.length > 0;

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
                    delivered. `review` on each item is speculative until the
                    data layer exposes it (see ReviewableOrderItem above), so
                    every item currently falls back to the "not yet reviewed"
                    form state. */}
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
                              ) : (
                                <form className="flex flex-col gap-4">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate">Rating</span>
                                    <div className="flex flex-row-reverse items-center justify-end gap-1">
                                      {[5, 4, 3, 2, 1].map((n) => (
                                        <Fragment key={n}>
                                          <input
                                            type="radio"
                                            id={`rating-${item.id}-${n}`}
                                            name={`rating-${item.id}`}
                                            value={n}
                                            className="peer sr-only"
                                          />
                                          <label
                                            htmlFor={`rating-${item.id}-${n}`}
                                            className="cursor-pointer text-line transition-colors duration-150 hover:text-signal peer-checked:text-signal"
                                          >
                                            <Star
                                              className="h-5 w-5"
                                              strokeWidth={1.75}
                                              fill="currentColor"
                                            />
                                          </label>
                                        </Fragment>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                    <label
                                      htmlFor={`comment-${item.id}`}
                                      className="text-xs text-slate"
                                    >
                                      Komentar (opsional)
                                    </label>
                                    <textarea
                                      id={`comment-${item.id}`}
                                      name={`comment-${item.id}`}
                                      rows={3}
                                      placeholder="Ceritakan pengalaman Anda dengan produk ini..."
                                      className="w-full resize-none rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
                                    />
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate">Foto (opsional)</span>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-line text-slate/60">
                                      <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] sm:self-start"
                                  >
                                    Kirim Ulasan
                                  </button>
                                </form>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
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
