"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import type { ShopProductDetail } from "@/lib/shop/product";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { useCart } from "@/components/cart/cart-provider";

export function ProductDetail({ product }: { product: ShopProductDetail }) {
  const cart = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  const isMarkedDown =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const inStock = product.stock > 0;
  const image = product.images[activeImage] ?? null;

  function handleAddToCart() {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      imageUrl: product.images[0]?.url ?? null,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-cloud">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.altText ?? product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <PlaceholderTile
              seed={product.id}
              label={product.name}
              className="h-full w-full"
            />
          )}
        </div>

        {product.images.length > 1 ? (
          <div className="flex items-center gap-2.5">
            {product.images.map((img, index) => (
              <button
                key={img.url + index}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={activeImage === index}
                className={cn(
                  "h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-colors",
                  activeImage === index
                    ? "border-ink"
                    : "border-line hover:border-ink/40"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.altText ?? product.name}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {product.category ? (
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal transition-colors hover:text-signal/80"
            >
              {product.category.name}
            </Link>
          ) : null}

          <h1 className="font-serif text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.5rem]">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 font-mono text-lg">
            <span className="text-ink">
              {formatCurrency(product.price, product.currency)}
            </span>
            {isMarkedDown ? (
              <span className="text-slate line-through">
                {formatCurrency(product.compareAtPrice as number, product.currency)}
              </span>
            ) : null}
          </div>
        </div>

        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
            inStock ? "bg-signal/10 text-signal" : "bg-cloud text-slate"
          )}
        >
          {inStock ? `In stock — ${product.stock} available` : "Out of stock"}
        </span>

        {product.description ? (
          <p className="text-balance text-base leading-relaxed text-slate">
            {product.description}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-xs font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-cloud disabled:text-slate sm:w-auto sm:px-8"
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
          {inStock ? (added ? "Added to bag" : "Add to cart") : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
