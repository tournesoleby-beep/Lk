import { Truck } from "lucide-react";

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
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-base font-semibold text-ink">Informasi Pengiriman</h2>
      <div className="flex flex-col gap-3 text-sm">
        {carrier ? (
          <div className="flex items-center justify-between">
            <span className="text-slate">Kurir</span>
            <span className="flex items-center gap-1.5 font-medium text-ink">
              <Truck className="h-4 w-4 text-slate" strokeWidth={1.75} />
              {carrier}
            </span>
          </div>
        ) : null}
        {trackingNumber ? (
          <div className="flex items-center justify-between gap-3">
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
