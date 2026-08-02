"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ShopProductCardData } from "@/lib/shop/products";
import { ProductCard } from "@/components/home/product-card";
import { EmptyState } from "@/components/home/empty-state";

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
    <div className="flex flex-col gap-8">
      {/* Search + category filter + sort */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
            className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-slate focus:border-signal/50 focus:bg-paper"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              aria-pressed={categoryFilter === "ALL"}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
                categoryFilter === "ALL"
                  ? "bg-ink text-paper"
                  : "border border-line text-slate hover:bg-cloud/60"
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
                  "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
                  categoryFilter === category.slug
                    ? "bg-ink text-paper"
                    : "border border-line text-slate hover:bg-cloud/60"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            aria-label="Sort by price"
            className="rounded-full border border-line bg-cloud/60 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-ink outline-none transition-colors focus:border-signal/50 focus:bg-paper"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate">
        {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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
