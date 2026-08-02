"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

type WishlistContextValue = {
  items: WishlistProduct[];
  toggle: (product: WishlistProduct) => void;
  has: (id: string) => boolean;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Frontend-only wishlist (no `Wishlist` model exists in the Prisma schema
 * yet). Tracks liked products (keyed by id) in memory so the heart toggle on
 * product cards, the navbar badge, and the /wishlist page are all
 * interactive without needing a database round-trip to re-fetch products.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Map<string, WishlistProduct>>(new Map());

  const toggle = useCallback((product: WishlistProduct) => {
    setItems((current) => {
      const next = new Map(current);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, product);
      }
      return next;
    });
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items: Array.from(items.values()),
      toggle,
      has: (id: string) => items.has(id),
      count: items.size,
    }),
    [items, toggle]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
