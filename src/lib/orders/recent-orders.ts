/**
 * "Recent Orders on This Device" — a small localStorage-backed history so
 * customers without an account can still get back to their orders.
 *
 * This is purely a client-side convenience, not a source of truth: it never
 * substitutes for the server-side order lookup (`getOrderForPayment`), and
 * losing it (private browsing, a cleared cache, a different device) simply
 * means the list is empty — the customer can still use "Track an order"
 * with their order number from the confirmation email.
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

/**
 * Returns saved orders, most recently saved first. Always safe to call —
 * returns `[]` on the server, in private-browsing lockouts, or if the
 * stored value is missing/corrupt.
 */
export function getRecentOrders(): RecentOrder[] {
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
 * Save (or update) an order in this device's recent-orders list. Re-saving
 * an order that's already there — e.g. a repeat visit to the success page —
 * moves it to the front and refreshes its saved fields rather than
 * duplicating it. Silently no-ops if localStorage is unavailable (private
 * browsing, storage disabled, quota exceeded).
 */
export function saveRecentOrder(order: Omit<RecentOrder, "savedAt">): void {
  if (!isBrowser()) return;

  try {
    const existing = getRecentOrders().filter(
      (entry) => entry.orderNumber !== order.orderNumber
    );

    const next: RecentOrder[] = [
      { ...order, savedAt: new Date().toISOString() },
      ...existing,
    ].slice(0, MAX_ENTRIES);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort only — recent orders is a convenience, never a
    // requirement for checkout or order tracking to work.
  }
}
