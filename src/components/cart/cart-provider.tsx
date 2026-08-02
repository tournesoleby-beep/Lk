"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
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

// `localStorage` is the source of truth for the cart, read via
// useSyncExternalStore instead of "useEffect + setState on mount". That
// older pattern causes an extra render pass (and trips the
// react-hooks/set-state-in-effect lint rule); useSyncExternalStore is
// React's built-in tool for exactly this — subscribing to an external
// store and staying in sync with it, without any setState-on-mount
// hydration logic living in an Effect body. The server snapshot is always
// `null` (no localStorage on the server), so the first client render
// matches the server render and there's no hydration mismatch — the real
// value is picked up as soon as the store is subscribed on the client.
const CART_EVENT = "lapiita-karya:cart-updated";

function readRawCart(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error("[cart] failed to read saved cart:", error);
    return null;
  }
}

function writeRawCart(lines: CartLine[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    // storage events only fire in *other* tabs, so dispatch our own to let
    // useSyncExternalStore know the snapshot changed in this tab too.
    window.dispatchEvent(new Event(CART_EVENT));
  } catch (error) {
    console.error("[cart] failed to save cart:", error);
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CART_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CART_EVENT, callback);
  };
}

function getSnapshot() {
  return readRawCart();
}

function getServerSnapshot() {
  return null;
}

function parseCartLines(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[cart] failed to parse saved cart:", error);
    return [];
  }
}

/**
 * Purely a frontend cart shell for the redesign — there's no cart API route
 * wired up yet (the Prisma `Cart`/`CartItem` models exist, but nothing reads
 * or writes them over HTTP). Cart lines persist to `localStorage` so the bag
 * survives a page refresh; swap for real fetches to a cart endpoint later.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const rawCart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lines = useMemo(() => parseCartLines(rawCart), [rawCart]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, quantity = 1) => {
      const current = parseCartLines(readRawCart());
      const existing = current.find((line) => line.id === item.id);
      const next = existing
        ? current.map((line) =>
            line.id === item.id
              ? { ...line, quantity: line.quantity + quantity }
              : line
          )
        : [...current, { ...item, quantity }];
      writeRawCart(next);
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    const current = parseCartLines(readRawCart());
    writeRawCart(current.filter((line) => line.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const current = parseCartLines(readRawCart());
    const next =
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity } : line));
    writeRawCart(next);
  }, []);

  const clear = useCallback(() => {
    writeRawCart([]);
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
