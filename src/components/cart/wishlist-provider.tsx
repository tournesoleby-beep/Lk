"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WishlistContextValue = {
  ids: Set<string>;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Frontend-only wishlist (no `Wishlist` model exists in the Prisma schema
 * yet). Tracks liked product ids in memory so the heart toggle on product
 * cards and the navbar badge are interactive in the redesign.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      toggle,
      has: (id: string) => ids.has(id),
      count: ids.size,
    }),
    [ids, toggle]
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
