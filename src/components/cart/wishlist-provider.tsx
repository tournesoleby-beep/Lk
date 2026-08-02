"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Heart } from "lucide-react";

import { useToast } from "@/components/providers/toast-provider";

export type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  stock: number;
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
  const { toast } = useToast();

  const toggle = useCallback(
    (product: WishlistProduct) => {
      setItems((current) => {
        const next = new Map(current);
        if (next.has(product.id)) {
          next.delete(product.id);
          toast({
            title: "Removed from wishlist",
            description: product.name,
            variant: "removed",
          });
        } else {
          next.set(product.id, product);
          toast({
            title: "Saved to wishlist",
            description: product.name,
            variant: "success",
            icon: Heart,
          });
        }
        return next;
      });
    },
    [toast]
  );

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
