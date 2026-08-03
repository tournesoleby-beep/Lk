/**
 * "Recent Orders on This Device" — a small localStorage-backed history so
 * customers without an account can still get back to their orders.
 *
 * This is purely a client-side convenience, not a source of truth: it never
 * substitutes for the server-side order lookup (`getOrderForPayment`), and
 * losing it (private browsing, a cleared cache, a different device) simply
 * means the list is empty — the customer can still use "Track an order"
 * with their order number from the confirmation email.
 *
 * Exposed as a `getSnapshot`/`subscribe` pair (see the bottom of this file)
 * rather than a plain getter, so components read it via
 * `useSyncExternalStore` instead of `useState` + `useEffect`. localStorage
 * is an external system, and syncing external state into React by calling
 * `setState` inside an effect is exactly the pattern
 * `react-hooks/set-state-in-effect` flags — `useSyncExternalStore` is the
 * React-native way to subscribe to a source like this without that problem,
 * and it comes with correct SSR/hydration behavior and cross-tab updates
 * for free.
 */

const STORAGE_KEY = "lapiita:recent-orders";
const MAX_ENTRIES = 8;

export type RecentOrder = {
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  /** ISO timestamp of when the order was placed. */
  createdAt: string;
  /** ISO timestamp of when this entry was saved/updated on this device. */
  savedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readFromStorage(): RecentOrder[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is RecentOrder =>
        entry &&
        typeof entry.orderNumber === "string" &&
        typeof entry.status === "string" &&
        typeof entry.total === "number" &&
        typeof entry.currency === "string" &&
        typeof entry.createdAt === "string" &&
        typeof entry.savedAt === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Returns saved orders, most recently saved first. Always safe to call —
 * returns `[]` on the server, in private-browsing lockouts, or if the
 * stored value is missing/corrupt. Reads storage fresh every call — for
 * reactive UI, use `getRecentOrdersSnapshot` + `subscribeToRecentOrders`
 * (via `useSyncExternalStore`) instead, so re-renders happen when the data
 * actually changes rather than not at all.
 */
export function getRecentOrders(): RecentOrder[] {
  return readFromStorage();
}

/**
 * Save (or update) an order in this device's recent-orders list. Re-saving
 * an order that's already there — e.g. a repeat visit to the success page —
 * moves it to the front and refreshes its saved fields rather than
 * duplicating it. Silently no-ops if localStorage is unavailable (private
 * browsing, storage disabled, quota exceeded).
 */
export function saveRecentOrder(order: Omit<RecentOrder, "savedAt">): void {
  if (!isBrowser()) return;

  try {
    const existing = readFromStorage().filter(
      (entry) => entry.orderNumber !== order.orderNumber
    );

    const next: RecentOrder[] = [
      { ...order, savedAt: new Date().toISOString() },
      ...existing,
    ].slice(0, MAX_ENTRIES);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    invalidateRecentOrdersSnapshot();
  } catch {
    // Best-effort only — recent orders is a convenience, never a
    // requirement for checkout or order tracking to work.
  }
}

// --- useSyncExternalStore support -----------------------------------------

// Cached so repeated calls between actual changes return the same array
// reference — useSyncExternalStore re-renders whenever getSnapshot returns
// a new reference, so a fresh array on every call would re-render forever.
let cachedSnapshot: RecentOrder[] | null = null;
const listeners = new Set<() => void>();

function invalidateRecentOrdersSnapshot(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

/** `getSnapshot` for `useSyncExternalStore`. */
export function getRecentOrdersSnapshot(): RecentOrder[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = readFromStorage();
  }
  return cachedSnapshot;
}

/** `getServerSnapshot` for `useSyncExternalStore` — always empty on the server. */
export function getRecentOrdersServerSnapshot(): RecentOrder[] {
  return [];
}

/**
 * `subscribe` for `useSyncExternalStore`. Also listens for the native
 * `storage` event, so a save made in another tab (or another success page
 * for a second order) shows up here without a manual refresh.
 */
export function subscribeToRecentOrders(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  function handleStorageEvent(event: StorageEvent) {
    if (event.key === STORAGE_KEY) invalidateRecentOrdersSnapshot();
  }
  if (isBrowser()) window.addEventListener("storage", handleStorageEvent);

  return () => {
    listeners.delete(onStoreChange);
    if (isBrowser()) window.removeEventListener("storage", handleStorageEvent);
  };
}
