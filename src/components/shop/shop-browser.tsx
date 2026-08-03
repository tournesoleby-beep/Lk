"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Heart, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import type { ShopProductCardData } from "@/lib/shop/products";
import { ProductCard } from "@/components/home/product-card";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { EmptyState } from "@/components/home/empty-state";
import { useCart } from "@/components/cart/cart-provider";
import { useWishlist } from "@/components/cart/wishlist-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "newest" | "price-asc" | "price-desc";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

/**
 * Mobile/tablet-only product card for the shop grid — a premium
 * restyle of `ProductCard` scoped entirely to this page so the shared
 * component (used on the homepage, wishlist, and category pages) and
 * the desktop shop grid stay untouched. Same data and the same cart/
 * wishlist behavior, just a different presentation:
 * - taller radius + softer shadow instead of a hard border, for a
 *   quieter "floating" card
 * - a clamped two-line title so every card in a row lands at the same
 *   height (this is what makes the grid scroll smoothly — no ragged
 *   row edges as names wrap differently)
 * - tap feedback (`active:scale`) instead of hover states, since hover
 *   doesn't apply on touch and can stick on first tap
 */
function MobileShopProductCard({ product }: { product: ShopProductCardData }) {
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
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[20px] bg-paper shadow-sm transition-transform duration-200 active:scale-[0.985]">
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-cloud"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderTile
            seed={product.id}
            label={product.name}
            className="h-full w-full"
          />
        )}

        {!inStock ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-paper backdrop-blur">
            Out of Stock
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
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition-transform duration-200 active:scale-90"
      >
        <Heart
          className={cn("h-4 w-4", saved && "fill-signal text-signal")}
          strokeWidth={1.75}
        />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
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
            Only {product.stock} left
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className={cn(
            "mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-cloud disabled:text-slate",
            added ? "bg-ink text-paper" : "bg-cloud text-ink"
          )}
        >
          {added ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          {!inStock ? "Out of Stock" : added ? "Added to bag" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}

export function ShopBrowser({
  initialProducts,
  initialQuery = "",
  initialCategory = "ALL",
}: {
  initialProducts: ShopProductCardData[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [sort, setSort] = useState<SortOption>("newest");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const product of initialProducts) {
      if (product.category && !seen.has(product.category.slug)) {
        seen.set(product.category.slug, product.category.name);
      }
    }
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [initialProducts]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    const result = initialProducts.filter((product) => {
      const matchesQuery =
        !trimmed || product.name.toLowerCase().includes(trimmed);
      const matchesCategory =
        categoryFilter === "ALL" || product.category?.slug === categoryFilter;
      return matchesQuery && matchesCategory;
    });

    if (sort === "price-asc") {
      return [...result].sort((a, b) => a.price - b.price);
    }
    if (sort === "price-desc") {
      return [...result].sort((a, b) => b.price - a.price);
    }
    return result;
  }, [initialProducts, query, categoryFilter, sort]);

  const sortButton = (
    <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
      <SelectTrigger aria-label="Sort by price" className="w-auto">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-slate" strokeWidth={1.75} />
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ================================================================
          MOBILE / TABLET (< lg) — thumb-friendly search + filter toolbar.
          ================================================================ */}
      <div className="flex flex-col gap-3.5 lg:hidden">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            strokeWidth={1.75}
          />
          {/* h-12 + text-base: a comfortable 48px tap target that also
              stops iOS Safari zooming the page on focus. */}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-12 w-full rounded-2xl border border-line bg-cloud/60 pl-11 pr-4 text-base text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Category chips scroll horizontally so they never crowd the
              sort control off the thumb-reachable end of the row. */}
          <div className="-mx-6 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-6 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              aria-pressed={categoryFilter === "ALL"}
              className={cn(
                "min-h-11 shrink-0 rounded-full px-4 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95",
                categoryFilter === "ALL"
                  ? "bg-ink text-paper shadow-sm"
                  : "border border-line text-slate"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setCategoryFilter(category.slug)}
                aria-pressed={categoryFilter === category.slug}
                className={cn(
                  "min-h-11 shrink-0 rounded-full px-4 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95",
                  categoryFilter === category.slug
                    ? "bg-ink text-paper shadow-sm"
                    : "border border-line text-slate"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Sort stays fixed at the end of the row instead of scrolling
              away with the chips, so it's always one thumb-reach away. */}
          <div className="shrink-0">{sortButton}</div>
        </div>
      </div>

      {/* ================================================================
          DESKTOP (lg+) — unchanged from the original layout.
          ================================================================ */}
      <div className="hidden gap-3 lg:flex lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              aria-pressed={categoryFilter === "ALL"}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95",
                categoryFilter === "ALL"
                  ? "bg-ink text-paper shadow-sm"
                  : "border border-line text-slate hover:border-ink/25 hover:bg-cloud/60 hover:text-ink"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setCategoryFilter(category.slug)}
                aria-pressed={categoryFilter === category.slug}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95",
                  categoryFilter === category.slug
                    ? "bg-ink text-paper shadow-sm"
                    : "border border-line text-slate hover:border-ink/25 hover:bg-cloud/60 hover:text-ink"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
            <SelectTrigger aria-label="Sort by price" className="w-auto">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate">
        {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
      </p>

      {filtered.length > 0 ? (
        <>
          {/* Mobile/tablet grid — premium card, roomier rhythm. */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:hidden">
            {filtered.map((product) => (
              <MobileShopProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Desktop grid — unchanged. */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState message="No products match your search or filters. Try a different name or category." />
      )}
    </div>
  );
}
