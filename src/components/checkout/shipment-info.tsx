import { Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { CopyTrackingNumberButton } from "@/components/checkout/copy-tracking-number-button";

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
 * tracking number, with a one-tap copy button for the tracking number.
 * Purely presentational: renders whatever the order already has, no
 * carrier API calls.
 */
export function ShipmentInfo({
  carrier,
  trackingNumber,
}: {
  carrier?: string | null;
  trackingNumber?: string | null;
}) {
  if (!carrier && !trackingNumber) return null;

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
    </div>
  );
}
