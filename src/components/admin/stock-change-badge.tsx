import { cn } from "@/lib/utils";

/**
 * Signed quantity badge for a single stock ledger entry — green for stock
 * in (a positive change: initial stock, restock), the existing brand
 * "signal" accent for stock out (a negative change: manual reduction, an
 * order being paid). Same visual shape as StatusBadge for consistency
 * across the admin panel.
 */
export function StockChangeBadge({ quantityChange }: { quantityChange: number }) {
  const isStockIn = quantityChange > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ring-1 ring-inset ring-current/10",
        isStockIn ? "bg-emerald-500/10 text-emerald-700" : "bg-signal/10 text-signal"
      )}
    >
      {isStockIn ? "+" : ""}
      {quantityChange}
    </span>
  );
}
