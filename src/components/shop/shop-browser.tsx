"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ShopProductCardData } from "@/lib/shop/products";
import { ProductCard } from "@/components/home/product-card";
import { EmptyState } from "@/components/home/empty-state";
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

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Search + category filter + sort */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            strokeWidth={1.75}
          />
          {/* h-11 + text-base keeps this a comfortable 44px tap target and
              stops iOS Safari zooming the page on focus; both relax back to
              the original compact sizing at lg (desktop). */}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-line bg-cloud/60 pl-10 pr-4 text-base text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10 lg:h-auto lg:py-2.5 lg:text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Category chips scroll horizontally on mobile instead of
              wrapping into a cramped multi-row block; reverts to a normal
              wrapping row once there's room at lg. */}
          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-wrap [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              aria-pressed={categoryFilter === "ALL"}
              className={cn(
                "min-h-11 shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95 lg:min-h-0",
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
                  "min-h-11 shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95 lg:min-h-0",
                  categoryFilter === category.slug
                    ? "bg-ink text-paper shadow-sm"
                    : "border border-line text-slate hover:border-ink/25 hover:bg-cloud/60 hover:text-ink"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortOption)}
          >
            <SelectTrigger
              aria-label="Sort by price"
              className="min-h-11 w-full lg:min-h-0 lg:w-auto"
            >
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
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState message="No products match your search or filters. Try a different name or category." />
      )}
    </div>
  );
}
