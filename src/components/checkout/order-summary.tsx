import { formatCurrency } from "@/lib/utils";
import { PlaceholderTile } from "@/components/home/placeholder-tile";

type OrderSummaryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: { name: string } | null;
  product?: { images?: { url: string; altText?: string | null }[] | null } | null;
};

/**
 * "Order Summary" section on the order tracking page — one row per line
 * item with its product image (falling back to the same PlaceholderTile
 * used on product cards when there's no image), name, variant (if any),
 * quantity, and price. Presentational only: renders exactly what's on
 * `order.items`, no pricing or stock logic.
 */
export function OrderSummary({
  items,
  currency,
}: {
  items: OrderSummaryItem[];
  currency: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-base font-semibold text-ink">Ringkasan Pesanan</h2>
      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const image = item.product?.images?.[0] ?? null;

          return (
            <li key={item.id} className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cloud">
                {image ? (
                  // Native <img>, matching the pattern already used for
                  // product images elsewhere (e.g. ProductCard) — avoids
                  // requiring remote image domains to be allow-listed.
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

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-ink">{item.name}</span>
                {item.variant?.name ? (
                  <span className="truncate text-xs text-slate">{item.variant.name}</span>
                ) : null}
                <span className="text-xs text-slate">
                  {formatCurrency(item.price, currency)} × {item.quantity}
                </span>
              </div>

              <span className="shrink-0 font-mono text-sm text-ink">
                {formatCurrency(item.price * item.quantity, currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
