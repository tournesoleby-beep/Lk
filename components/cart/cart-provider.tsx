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

export type CartLine = {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "lapiita-karya:cart";

/**
 * Purely a frontend cart shell for the redesign — there's no cart API route
 * wired up yet (the Prisma `Cart`/`CartItem` models exist, but nothing reads
 * or writes them over HTTP). Cart lines persist to `localStorage` so the bag
 * survives a page refresh; swap for real fetches to a cart endpoint later.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load any saved cart once, after mount — reading localStorage during the
  // initial render would return different results on the server vs. the
  // client and trigger a hydration mismatch. This is a deliberate one-time
  // restore (guarded by hasHydrated below), not an external-store sync, so
  // it's safe to opt out of the effect lint rule here.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartLine[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLines(parsed);
        }
      }
    } catch (error) {
      console.error("[cart] failed to read saved cart:", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Keep localStorage in sync — but only once the load above has run, so we
  // don't blow away a saved cart with the initial empty state.
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch (error) {
      console.error("[cart] failed to save cart:", error);
    }
  }, [lines, hasHydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1) => {
      setLines((current) => {
        const existing = current.find((line) => line.id === item.id);
        if (existing) {
          return current.map((line) =>
            line.id === item.id
              ? { ...line, quantity: line.quantity + quantity }
              : line
          );
        }
        return [...current, { ...item, quantity }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity } : line))
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0
    );
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);

    return {
      lines,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((current) => !current),
      addItem,
      removeItem,
      updateQuantity,
      clear,
      subtotal,
      count,
    };
  }, [lines, isOpen, addItem, removeItem, updateQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
