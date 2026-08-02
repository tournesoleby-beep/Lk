import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes conditionally, resolving conflicts.
 * Used throughout shadcn/ui components and app components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency (default: IDR / Indonesian Rupiah).
 */
export function formatCurrency(
  amount: number,
  currency: string = "IDR",
  locale: string = "id-ID"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a Date (or date string) into a human readable string.
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Turn a string into a URL-friendly slug.
 */
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncate a string to a max length, appending an ellipsis if needed.
 */
export function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}…`;
}

/**
 * Await-able delay, useful for simulating latency in dev.
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random alphanumeric order/reference number, e.g. ORD-9F3K2A.
 */
export function generateOrderNumber(prefix: string = "ORD") {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * A small set of curated dark gradient pairs used as deterministic
 * placeholder art for products/categories that don't have a photo yet.
 * Picking from a fixed palette (rather than randomly) keeps the grid
 * looking designed instead of noisy.
 */
const GRADIENT_PALETTE: [string, string][] = [
  ["#1d1d1f", "#2c2c2e"],
  ["#0a2540", "#0a84ff"],
  ["#1a1a2e", "#4f46e5"],
  ["#241a10", "#c2703d"],
  ["#0f2027", "#2c5364"],
  ["#1f1a24", "#6e56cf"],
];

/** Simple deterministic string hash, used to pick a stable gradient/index. */
function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministically pick a gradient CSS value for a given seed string. */
export function getPlaceholderGradient(seed: string) {
  const [from, to] = GRADIENT_PALETTE[hashString(seed) % GRADIENT_PALETTE.length];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

/** First letter(s) of a name, for use inside placeholder art. */
export function getInitials(name: string, maxChars = 2) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, maxChars)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
