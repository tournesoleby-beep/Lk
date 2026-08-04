"use client";

import { CopyIconButton } from "@/components/checkout/copy-icon-button";

/**
 * Small icon button next to the tracking number in the shipment info
 * section of the order tracking page. Same copy/toast behavior as
 * `CopyOrderNumberButton`, via the shared `CopyIconButton`.
 */
export function CopyTrackingNumberButton({
  trackingNumber,
}: {
  trackingNumber: string;
}) {
  return (
    <CopyIconButton
      value={trackingNumber}
      ariaLabel="Salin nomor resi"
      copiedTitle="Nomor resi disalin"
      errorTitle="Gagal menyalin nomor resi"
    />
  );
}
