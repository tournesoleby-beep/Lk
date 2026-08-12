/**
 * Lightweight in-memory sliding-window(ish) rate limiter.
 *
 * Used to blunt brute-force/enumeration attempts against:
 * - public, unauth'd-by-orderNumber lookups (order tracking, payment
 *   status, invoice PDFs — see src/lib/checkout/orders.ts), and
 * - the admin credentials login (see src/auth.ts).
 *
 * NOTE ON SCALE: this state lives in a single Node.js process's memory.
 * On a multi-instance or serverless deployment (multiple regions, many
 * short-lived lambdas, etc.) each instance keeps its own independent
 * counters, so this raises the bar against casual/scripted abuse from a
 * single source but is not a hard guarantee at scale. If/when this app
 * runs across multiple instances in production, swap the Map below for a
 * shared store (e.g. Upstash Redis via @upstash/ratelimit) — the
 * `checkRateLimit` call sites don't need to change, only this file.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically forget stale buckets so this Map can't grow unbounded over
// the life of the process.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();
function cleanupIfNeeded(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

/**
 * Fixed-window rate limiter: allows up to `limit` calls per `windowMs` for
 * a given `key`. Not perfectly precise at window boundaries (a caller
 * timing requests around the edge could get a bit over `limit` in a short
 * span) but simple, dependency-free, and good enough to blunt scripted
 * brute-force/enumeration attempts.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanupIfNeeded(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 };
}

/**
 * Best-effort client IP for rate-limiting keys, read from the headers a
 * reverse proxy / hosting platform sets in front of the app. This is never
 * trustworthy for anything beyond rate limiting — it's attacker-
 * controllable if no proxy sits in front of the app — but that's fine
 * here, since the worst case is a limiter keyed on "unknown" that's
 * slightly easier to exhaust, not a broken security boundary.
 */
export function getClientIp(headerList: Headers): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
