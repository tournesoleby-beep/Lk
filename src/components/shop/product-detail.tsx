"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Maximize2, Minus, Plus, ShoppingBag } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import type { ShopProductDetail } from "@/lib/shop/product";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { useCart } from "@/components/cart/cart-provider";
import { ProductImageLightbox } from "@/components/shop/product-image-lightbox";

const HOVER_ZOOM_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeToHoverZoomSupport(callback: () => void) {
  const query = window.matchMedia(HOVER_ZOOM_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getHoverZoomSupportSnapshot() {
  return window.matchMedia(HOVER_ZOOM_QUERY).matches;
}

function getHoverZoomServerSnapshot() {
  return false;
}

export function ProductDetail({ product }: { product: ShopProductDetail }) {
  const cart = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Cursor-follow zoom is a hover affordance — only enabled on devices that
  // actually have a precise pointer, so touch users get swipe/tap instead
  // of a magnifier that could never track their finger between moves.
  // Synced via useSyncExternalStore rather than effect+setState so it also
  // stays correct if the user connects/disconnects a mouse mid-session.
  const supportsHoverZoom = useSyncExternalStore(
    subscribeToHoverZoomSupport,
    getHoverZoomSupportSnapshot,
    getHoverZoomServerSnapshot
  );
  const [hoverOrigin, setHoverOrigin] = useState<{ x: number; y: number } | null>(
    null
  );

  const isMarkedDown =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const inStock = product.stock > 0;
  const image = product.images[activeImage] ?? null;
  const imageCount = product.images.length;

  function handleAddToCart() {
    cart.addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        imageUrl: product.images[0]?.url ?? null,
      },
      quantity
    );
    setAdded(true);
    setQuantity(1);
    window.setTimeout(() => setAdded(false), 2000);
  }

  function showImage(index: number) {
    setActiveImage(((index % imageCount) + imageCount) % imageCount);
  }

  const addToBagButton = (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={!inStock}
      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-xs font-medium uppercase tracking-[0.12em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-cloud disabled:text-slate disabled:shadow-none disabled:active:scale-100 sm:flex-none sm:px-8"
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
      {inStock ? (added ? "Added to bag" : "Add to cart") : "Out of stock"}
    </button>
  );

  return (
    <div className="grid grid-cols-1 gap-8 pb-24 sm:gap-10 sm:pb-0 lg:grid-cols-2 lg:gap-16">
      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "relative aspect-[4/5] w-full touch-pan-y select-none overflow-hidden rounded-2xl bg-cloud shadow-sm",
            image && supportsHoverZoom && "cursor-zoom-in"
          )}
          onTouchStart={(event) => {
            event.currentTarget.dataset.touchStartX = String(
              event.touches[0]?.clientX ?? ""
            );
          }}
          onTouchEnd={(event) => {
            if (imageCount <= 1) return;
            const startX = Number(event.currentTarget.dataset.touchStartX);
            const endX = event.changedTouches[0]?.clientX ?? startX;
            const delta = endX - startX;
            // Simple swipe-to-navigate for touch galleries — a 40px
            // threshold keeps ordinary scrolling from triggering it.
            if (Math.abs(delta) > 40) {
              showImage(activeImage + (delta < 0 ? 1 : -1));
            }
          }}
          onMouseMove={(event) => {
            if (!supportsHoverZoom) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setHoverOrigin({
              x: ((event.clientX - rect.left) / rect.width) * 100,
              y: ((event.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseLeave={() => setHoverOrigin(null)}
          onClick={() => image && setLightboxOpen(true)}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.altText ?? product.name}
              className={cn(
                "h-full w-full object-cover transition-transform duration-150 ease-out",
                supportsHoverZoom && hoverOrigin ? "scale-[1.8]" : "scale-100"
              )}
              style={
                supportsHoverZoom && hoverOrigin
                  ? { transformOrigin: `${hoverOrigin.x}% ${hoverOrigin.y}%` }
                  : undefined
              }
              key={image.url}
            />
          ) : (
            <PlaceholderTile
              seed={product.id}
              label={product.name}
              className="h-full w-full"
            />
          )}

          {image ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxOpen(true);
              }}
              aria-label="View fullscreen"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/50 text-paper opacity-0 transition-opacity duration-200 hover:bg-ink/70 active:scale-90 sm:opacity-100"
            >
              <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}

          {imageCount > 1 ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5"
              aria-hidden="true"
            >
              {product.images.map((img, index) => (
                <span
                  key={img.url + index}
                  className={cn(
                    "h-1.5 rounded-full bg-paper/70 shadow-sm transition-all duration-200",
                    index === activeImage ? "w-5 bg-paper" : "w-1.5"
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        {imageCount > 1 ? (
          <div className="-mx-4 flex items-center gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            {product.images.map((img, index) => (
              <button
                key={img.url + index}
                type="button"
                onClick={() => showImage(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={activeImage === index}
                className={cn(
                  "h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 hover:scale-[1.03]",
                  activeImage === index
                    ? "border-ink shadow-sm"
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

          <h1 className="font-serif text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[2.5rem]">
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

        {/* Quantity selector — hidden once out of stock since there's
            nothing to add. */}
        {inStock ? (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
              Quantity
            </span>
            <div className="flex w-fit items-center rounded-full border border-line">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:bg-cloud active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:h-9 sm:w-9"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <span className="w-8 text-center font-mono text-sm text-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                disabled={quantity >= product.stock}
                aria-label="Increase quantity"
                className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:bg-cloud active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:h-9 sm:w-9"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Inline add-to-bag — stays in flow on tablet/desktop; hidden on
            phones in favor of the sticky bar below so it's never covered
            by the keyboard or cut off mid-scroll. */}
        <div className="mt-2 hidden sm:flex">{addToBagButton}</div>
      </div>

      {/* Sticky add-to-bag bar — mobile only. Pinned above the safe area
          so it clears the home indicator on notched phones. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-paper/95 px-4 py-3 pb-safe shadow-[0_-8px_24px_-12px_rgba(23,21,26,0.15)] backdrop-blur-md supports-[backdrop-filter]:bg-paper/85 sm:hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-ink">
            {product.name}
          </span>
          <span className="font-mono text-sm text-ink">
            {formatCurrency(product.price * quantity, product.currency)}
          </span>
        </div>
        {addToBagButton}
      </div>

      {lightboxOpen && imageCount > 0 ? (
        <ProductImageLightbox
          images={product.images}
          productName={product.name}
          initialIndex={activeImage}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}
