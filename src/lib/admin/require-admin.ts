import { auth } from "@/auth";

export class AdminAuthError extends Error {
  constructor(message = "You must be signed in as an admin to do this.") {
    super(message);
    this.name = "AdminAuthError";
  }
}

/**
 * Verify the current request has an authenticated ADMIN session, for use
 * at the top of every admin Server Action (src/lib/admin/*.ts).
 *
 * `middleware.ts` already gates every page under `/admin` behind an admin
 * session, but Next.js Server Actions are effectively their own public
 * endpoints — the framework does not scope an action to only be callable
 * from the page(s) that currently import it. Relying solely on route-based
 * middleware to protect these actions is a known Next.js footgun: a
 * Server Action reference bundled into client JS could, in principle, be
 * invoked directly (with the right encrypted action id and headers) from
 * any request context, bypassing whatever page-level redirect middleware
 * would otherwise apply.
 *
 * Every admin-only Server Action must therefore call this first and
 * propagate its result — either by returning its `success: false` error,
 * or (for actions with no defined "unauthorized" result shape) letting the
 * thrown `AdminAuthError` fail the action.
 */
export async function requireAdminSession(): Promise<{ id: string } | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return { id: session.user.id };
}

/**
 * Same check as `requireAdminSession`, but throws `AdminAuthError` instead
 * of returning null — for actions that don't have a `{ success: false }`
 * result type to return early with.
 */
export async function assertAdmin(): Promise<{ id: string }> {
  const admin = await requireAdminSession();
  if (!admin) {
    throw new AdminAuthError();
  }
  return admin;
}
