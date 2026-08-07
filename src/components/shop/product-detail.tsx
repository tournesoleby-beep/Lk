"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Maximize2, Minus, Plus, ShoppingBag, Star } from "lucide-react";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ShopProductDetail, ShopProductReview } from "@/lib/shop/product";
import { EmptyState } from "@/components/home/empty-state";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { Reveal } from "@/components/home/reveal";
import { useCart } from "@/components/cart/cart-provider";
import { ProductImageLightbox } from "@/components/shop/product-image-lightbox";
import { MobileProductGallery } from "@/components/shop/product-gallery/mobile-product-gallery";

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

/**
 * Small "★ 4.5 (12)" badge shown next to the price. Only rendered by the
 * caller when reviewCount > 0 — an average of zero reviews isn't
 * meaningful, so there's no "no ratings yet" variant of this badge.
 */
function AverageRatingBadge({
  averageRating,
  reviewCount,
}: {
  averageRating: number;
  reviewCount: number;
}) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-slate">
      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" strokeWidth={1.75} />
      {averageRating.toFixed(1)}
      <span className="text-slate/70">
        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

// How many reviews render up front. "Show all reviews" reveals the rest
// from the same already-fetched list — see ProductReviewsSection below.
const INITIAL_REVIEW_COUNT = 10;

/**
 * A single review's comment text, clamped to 6 lines with a "Read more" /
 * "Show less" toggle when it actually overflows (see the literal
 * "line-clamp-6" class below — Tailwind's scanner needs a static class
 * name, so this can't be built from a shared constant). Line breaks from
 * the original comment are preserved (whitespace-pre-line).
 *
 * Overflow is detected once on mount by comparing the clamped element's
 * scrollHeight to its clientHeight — if the full text is taller than the
 * clamped box, a toggle is shown; short comments never get one.
 */
function ReviewComment({ comment }: { comment: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClampable, setIsClampable] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Measured while collapsed (the initial state), so this reflects
    // whether the clamp is actually cutting anything off.
    setIsClampable(el.scrollHeight > el.clientHeight + 1);
  }, [comment]);

  return (
    <div className="flex flex-col gap-1.5">
      <p
        ref={textRef}
        className={cn(
          "whitespace-pre-line text-sm leading-relaxed text-slate",
          // Literal class name (not built from a variable) — Tailwind's
          // scanner needs static text to generate the "line-clamp-6" CSS.
          !expanded && "line-clamp-6"
        )}
      >
        {comment}
      </p>
      {isClampable ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-signal transition-colors hover:text-signal/80"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Approved-reviews list shown on the product page — always rendered by the
 * caller now, including when there are zero approved reviews (a polished
 * empty state instead of hiding the section). See getProductBySlug in
 * src/lib/shop/product.ts, which already filters to `approved: true`.
 * Used identically in both the mobile and desktop trees below.
 *
 * Only the newest INITIAL_REVIEW_COUNT reviews render up front; "Show all
 * reviews" expands to the rest on the client from the same `reviews` prop
 * — every approved review is already fetched in one query, so expanding
 * never triggers another request.
 */
function ProductReviewsSection({ reviews }: { reviews: ShopProductReview[] }) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = reviews.length > INITIAL_REVIEW_COUNT;
  const visibleReviews = showAll ? reviews : reviews.slice(0, INITIAL_REVIEW_COUNT);

  return (
    <div className="flex flex-col gap-5 border-t border-line pt-6">
      <h2 className="font-serif text-base font-semibold text-ink">Customer Reviews</h2>
      {reviews.length === 0 ? (
        <EmptyState message="No reviews yet — be the first to share your experience with this product." />
      ) : (
        <>
          <div className="flex flex-col gap-5">
            {visibleReviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{review.reviewerName}</span>
                    <span className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < review.rating
                              ? "fill-amber-500 text-amber-500"
                              : "fill-none text-line"
                          )}
                          strokeWidth={1.75}
                        />
                      ))}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment ? <ReviewComment comment={review.comment} /> : null}
                {review.images && review.images.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {review.images.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="h-16 w-16 rounded-lg border border-line object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {hasMore && !showAll ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="self-start font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-signal transition-colors hover:text-signal/80"
            >
              Show all reviews ({reviews.length})
            </button>
          ) : null}
        </>
      )}
    </div>
  );
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
  const isLowStock = inStock && product.stock <= 5;
  const image = product.images[activeImage] ?? null;
  const imageCount = product.images.length;
  const hasReviews = product.reviewCount > 0;

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

  return (
    <>
      {/* ================================================================
          MOBILE / TABLET (< lg) — image-first, full-bleed composition.
          Fully independent from the desktop tree below.
          ================================================================ */}
      <div className="lg:hidden">
        {/* Break out of the page section's top padding and the container's
            side padding so the hero photo starts flush under the navbar
            and runs edge to edge — the first screen is the image. */}
        <div className="-mx-6 -mt-16 sm:-mt-24 md:-mx-10">
          <MobileProductGallery
            images={product.images}
            productId={product.id}
            productName={product.name}
            activeIndex={activeImage}
            onIndexChange={showImage}
            onOpenFullscreen={() => setLightboxOpen(true)}
          />
        </div>

        <Reveal as="div" className="flex flex-col gap-6 pb-28 pt-6" variant="fade-up">
          <div className="flex flex-col gap-3">
            {product.category ? (
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal"
              >
                {product.category.name}
              </Link>
            ) : null}

            <h1 className="font-serif text-[2.05rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[2.3rem]">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-baseline gap-2.5 font-mono text-xl text-ink">
                <span>{formatCurrency(product.price, product.currency)}</span>
                {isMarkedDown ? (
                  <span className="text-sm text-slate line-through">
                    {formatCurrency(product.compareAtPrice as number, product.currency)}
                  </span>
                ) : null}
              </div>

              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
                  inStock ? "bg-signal/10 text-signal" : "bg-cloud text-slate"
                )}
              >
                {!inStock
                  ? "Out of Stock"
                  : isLowStock
                    ? `Only ${product.stock} left`
                    : `In stock — ${product.stock} available`}
              </span>

              {hasReviews ? (
                <AverageRatingBadge
                  averageRating={product.averageRating as number}
                  reviewCount={product.reviewCount}
                />
              ) : null}
            </div>
          </div>

          {product.description ? (
            <p className="text-balance border-t border-line pt-5 text-[15px] leading-relaxed text-slate">
              {product.description}
            </p>
          ) : null}

          <ProductReviewsSection reviews={product.reviews} />
        </Reveal>
      </div>

      {/* ================================================================
          DESKTOP (lg+)
          ================================================================ */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16">
        {/* Gallery — desktop: hover-zoom experience. */}
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

        {/* Info — desktop. */}
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

            {hasReviews ? (
              <AverageRatingBadge
                averageRating={product.averageRating as number}
                reviewCount={product.reviewCount}
              />
            ) : null}
          </div>

          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
              inStock ? "bg-signal/10 text-signal" : "bg-cloud text-slate"
            )}
          >
            {!inStock
              ? "Out of Stock"
              : isLowStock
                ? `Only ${product.stock} left`
                : `In stock — ${product.stock} available`}
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

          {/* Inline add-to-bag — desktop only now; mobile/tablet use the
              sticky bar below. */}
          <div className="mt-2 flex">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-xs font-medium uppercase tracking-[0.12em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-cloud disabled:text-slate disabled:shadow-none disabled:active:scale-100 sm:flex-none sm:px-8"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
              {inStock ? (added ? "Added to bag" : "Add to cart") : "Out of Stock"}
            </button>
          </div>

          <ProductReviewsSection reviews={product.reviews} />
        </div>
      </div>

      {/* ================================================================
          MOBILE / TABLET sticky purchase bar — the whole purchase flow
          (quantity + total + add-to-cart) consolidated into one always
          -reachable, thumb-width bar pinned above the safe area.
          ================================================================ */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2.5 border-t border-line bg-paper/95 px-4 py-3 pb-safe shadow-[0_-8px_24px_-12px_rgba(23,21,26,0.15)] backdrop-blur-md supports-[backdrop-filter]:bg-paper/85 lg:hidden">
        {inStock ? (
          <div className="flex h-12 shrink-0 items-center rounded-full border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-12 w-11 items-center justify-center text-ink transition-colors duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <span className="w-6 text-center font-mono text-sm text-ink">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
              aria-label="Increase quantity"
              className="flex h-12 w-11 items-center justify-center text-ink transition-colors duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={
            inStock
              ? `Add ${quantity} ${product.name} to cart, total ${formatCurrency(product.price * quantity, product.currency)}`
              : "Out of stock"
          }
          className="inline-flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full bg-ink py-2 text-paper shadow-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-cloud disabled:text-slate disabled:shadow-none disabled:active:scale-100"
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em]">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            {inStock ? (added ? "Added to bag" : "Add to cart") : "Out of Stock"}
          </span>
          {inStock ? (
            <span className="font-mono text-[11px] text-paper/75">
              {formatCurrency(product.price * quantity, product.currency)}
            </span>
          ) : null}
        </button>
      </div>

      {lightboxOpen && imageCount > 0 ? (
        <ProductImageLightbox
          images={product.images}
          productName={product.name}
          initialIndex={activeImage}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </>
  );
}
