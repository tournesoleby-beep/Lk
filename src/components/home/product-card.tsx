"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

import type { ProductCardData } from "@/lib/queries/home";
import { cn, formatCurrency } from "@/lib/utils";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { useCart } from "@/components/cart/cart-provider";
import { useWishlist } from "@/components/cart/wishlist-provider";

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const cart = useCart();
  const wishlist = useWishlist();

  const isMarkedDown =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const saved = wishlist.has(product.id);

  return (
    <div
      className={cn(
        "group relative flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-cloud"
      >
        {product.imageUrl ? (
          // Native <img> keeps this component simple and avoids requiring
          // remote image domains to be allow-listed in next.config.ts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <PlaceholderTile
            seed={product.id}
            label={product.name}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
      </Link>

      <button
        type="button"
        onClick={() =>
          wishlist.toggle({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            currency: product.currency,
            imageUrl: product.imageUrl,
            imageAlt: product.imageAlt,
          })
        }
        aria-pressed={saved}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition-colors hover:text-signal"
      >
        <Heart
          className={cn("h-4 w-4", saved && "fill-signal text-signal")}
          strokeWidth={1.75}
        />
      </button>

      <div className="flex flex-1 flex-col gap-1 px-4 py-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="text-sm font-medium leading-snug text-ink">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-1 font-mono text-sm">
          <span className="text-ink">
            {formatCurrency(product.price, product.currency)}
          </span>
          {isMarkedDown ? (
            <span className="text-slate line-through">
              {formatCurrency(product.compareAtPrice as number, product.currency)}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() =>
            cart.addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              currency: product.currency,
              imageUrl: product.imageUrl,
            })
          }
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper"
        >
          <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
          Add to bag
        </button>
      </div>
    </div>
  );
}
