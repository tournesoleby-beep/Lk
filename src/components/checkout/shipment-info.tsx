import { Truck } from "lucide-react";

import { cn, formatDate } from "@/lib/utils";
import { CopyTrackingNumberButton } from "@/components/checkout/copy-tracking-number-button";
import type { BiteshipTracking } from "@/lib/biteship";

/**
 * Lets the page decide whether to render a wrapper (border, spacing) around
 * this section at all — both `shippingCarrier` and `trackingNumber` are set
 * later by the carrier integration (see schema.prisma), so early-stage
 * orders won't have either yet.
 */
export function hasShipmentInfo(order: {
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
}): boolean {
  return Boolean(order.shippingCarrier || order.trackingNumber);
}

/**
 * "Shipment Information" section on the order tracking page — courier and
 * tracking number, with a one-tap copy button for the tracking number, plus
 * (when available) the live checkpoint history fetched from Biteship's
 * public tracking API. `tracking` is `null` whenever there's no tracking
 * number yet or the live Biteship lookup didn't return anything (see
 * getOrderForTracking in src/lib/checkout/orders.ts) — in that case this
 * renders exactly as it did before the Biteship integration, just carrier +
 * tracking number, no history section.
 */
export function ShipmentInfo({
  carrier,
  trackingNumber,
  tracking,
}: {
  carrier?: string | null;
  trackingNumber?: string | null;
  tracking?: BiteshipTracking | null;
}) {
  if (!carrier && !trackingNumber) return null;

  // Newest checkpoint first, since that's what a customer checking on
  // their package cares about seeing at a glance — Biteship returns them
  // oldest first.
  const history = tracking?.history ? [...tracking.history].reverse() : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cloud text-slate">
          <Truck className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="font-serif text-base font-semibold text-ink">Informasi Pengiriman</h2>
      </div>

      <div className="flex flex-col gap-4 text-sm">
        {carrier ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate">Kurir</span>
            <span className="font-medium text-ink">{carrier}</span>
          </div>
        ) : null}
        {trackingNumber ? (
          <div
            className={cn(
              "flex items-center justify-between gap-3",
              carrier && "border-t border-line pt-4"
            )}
          >
            <span className="text-slate">Nomor Resi</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-ink">{trackingNumber}</span>
              <CopyTrackingNumberButton trackingNumber={trackingNumber} />
            </div>
          </div>
        ) : null}
      </div>

      {history.length > 0 ? (
        <div className="flex flex-col gap-4 border-t border-line pt-4">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
            Riwayat Pengiriman
          </span>
          <ol className="flex flex-col gap-4">
            {history.map((checkpoint, index) => (
              <li key={`${checkpoint.updatedAt}-${index}`} className="flex gap-3">
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    index === 0 ? "bg-signal" : "bg-line"
                  )}
                />
                <div className="flex flex-col gap-0.5">
                  <span className={cn("text-sm", index === 0 ? "font-medium text-ink" : "text-ink")}>
                    {checkpoint.note}
                  </span>
                  <span className="text-xs text-slate">{formatDate(checkpoint.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
