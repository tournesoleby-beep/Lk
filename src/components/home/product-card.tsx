"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Heart, ShoppingBag } from "lucide-react";

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
  const [added, setAdded] = useState(false);

  const isMarkedDown =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const saved = wishlist.has(product.id);
  const inStock = product.stock > 0;
  const isLowStock = inStock && product.stock <= 5;

  function handleAddToCart() {
    if (!inStock) return;
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div
      className={cn(
        "group relative flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink/15 hover:shadow-lg",
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

        {!inStock ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-paper backdrop-blur">
            Stok Habis
          </span>
        ) : null}
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
            stock: product.stock,
          })
        }
        aria-pressed={saved}
        aria-label={saved ? "Hapus dari wishlist" : "Simpan ke wishlist"}
        className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition-all duration-200 hover:scale-110 hover:text-signal active:scale-95 sm:h-8 sm:w-8"
      >
        <Heart
          className={cn("h-4 w-4", saved && "fill-signal text-signal")}
          strokeWidth={1.75}
        />
      </button>

      <div className="flex flex-1 flex-col gap-1 px-3.5 py-3.5 sm:px-4 sm:py-4">
        <Link href={`/shop/${product.slug}`} className="group/title">
          <h3 className="text-sm font-medium leading-snug text-ink transition-colors duration-200 group-hover/title:text-signal">
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

        {isLowStock ? (
          <span className="font-mono text-[11px] font-medium text-signal">
            Tersisa {product.stock} produk
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className={cn(
            "mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-line disabled:bg-cloud disabled:text-slate sm:min-h-0",
            added
              ? "border-ink bg-ink text-paper"
              : "border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-paper"
          )}
        >
          {added ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          {!inStock ? "Stok Habis" : added ? "Berhasil Ditambahkan" : "Tambah ke Keranjang"}
        </button>
      </div>
    </div>
  );
}
