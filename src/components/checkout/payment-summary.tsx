import { formatCurrency } from "@/lib/utils";

/**
 * "Payment Summary" section on the order tracking page — subtotal,
 * shipping, an optional admin fee, and total. Purely presentational: adds
 * up nothing itself, just displays the amounts already on the order.
 *
 * `adminFee` is optional and only rendered when present ("if available"),
 * since the current Order schema doesn't have a dedicated admin-fee field
 * — pass it through only if your data layer surfaces one.
 */
export function PaymentSummary({
  subtotal,
  shippingTotal,
  adminFee,
  total,
  currency,
}: {
  subtotal: number;
  shippingTotal: number;
  adminFee?: number | null;
  total: number;
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-base font-semibold text-ink">Ringkasan Pembayaran</h2>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate">Subtotal</span>
          <span className="font-mono text-ink">{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate">Ongkos Kirim</span>
          <span className="font-mono text-ink">
            {formatCurrency(shippingTotal, currency)}
          </span>
        </div>
        {adminFee ? (
          <div className="flex items-center justify-between">
            <span className="text-slate">Biaya Admin</span>
            <span className="font-mono text-ink">{formatCurrency(adminFee, currency)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-medium text-ink">Total</span>
          <span className="font-mono text-base font-semibold text-ink">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
