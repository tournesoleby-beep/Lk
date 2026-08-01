"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Purely a frontend cart shell for the redesign — there's no cart API route
 * wired up yet (the Prisma `Cart`/`CartItem` models exist, but nothing reads
 * or writes them over HTTP). Keeping this in-memory means the "Add to bag"
 * / drawer UI is fully interactive without touching auth, middleware, or
 * data layer. Swap for real fetches to a cart endpoint later.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
      subtotal,
      count,
    };
  }, [lines, isOpen, addItem, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
