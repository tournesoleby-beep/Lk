"use client";

import { CopyIconButton } from "@/components/checkout/copy-icon-button";

/**
 * Small icon button next to the order number on the order lookup page.
 * Copies the order number to the clipboard in one tap and confirms via
 * the app's existing toast queue (see toast-provider.tsx), matching the
 * pattern already used by the cart/wishlist/newsletter components.
 *
 * Thin wrapper around the shared `CopyIconButton`, so
 * `CopyTrackingNumberButton` can reuse the same clipboard/toast logic.
 */
export function CopyOrderNumberButton({
  orderNumber,
}: {
  orderNumber: string;
}) {
  return (
    <CopyIconButton
      value={orderNumber}
      ariaLabel="Salin nomor pesanan"
      copiedTitle="Nomor pesanan disalin"
      errorTitle="Gagal menyalin nomor pesanan"
    />
  );
}
