"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

const WISHLIST_STORAGE_KEY = "lapiita-karya:wishlist";

/**
 * Frontend-only wishlist (no `Wishlist` model exists in the Prisma schema
 * yet). Tracks liked products (keyed by id) in memory so the heart toggle on
 * product cards, the navbar badge, and the /wishlist page are all
 * interactive without needing a database round-trip to re-fetch products.
 * Persists to `localStorage` the same way the cart does, so saved items
 * survive a page refresh.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Map<string, WishlistProduct>>(new Map());
  const [hasHydrated, setHasHydrated] = useState(false);
  const { toast } = useToast();

  // Load any saved wishlist once, after mount — reading localStorage during
  // the initial render would return different results on the server vs.
  // the client and trigger a hydration mismatch. This is a deliberate
  // one-time restore (guarded by hasHydrated below), not an external-store
  // sync, so it's safe to opt out of the effect lint rule here.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WishlistProduct[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(new Map(parsed.map((product) => [product.id, product])));
        }
      }
    } catch (error) {
      console.error("[wishlist] failed to read saved wishlist:", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Keep localStorage in sync — but only once the load above has run, so we
  // don't blow away a saved wishlist with the initial empty state.
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(Array.from(items.values()))
      );
    } catch (error) {
      console.error("[wishlist] failed to save wishlist:", error);
    }
  }, [items, hasHydrated]);

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
