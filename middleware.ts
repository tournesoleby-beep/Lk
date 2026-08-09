import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

// A separate, edge-safe NextAuth instance built from the shared config
// (no Prisma adapter, no bcrypt) — this is the only auth import allowed in
// middleware, which runs in the Edge runtime by default.
const { auth } = NextAuth(authConfig);

// Lapiita Karya has no customer accounts: browsing, cart, wishlist, and
// checkout are all guest flows and stay fully public. The only gated area
// is the hidden admin dashboard, which uses its own login page.
const ADMIN_LOGIN_ROUTE = "/admin/login";
const ADMIN_ROUTE_PREFIX = "/admin";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  const isAdminLoginRoute = nextUrl.pathname === ADMIN_LOGIN_ROUTE;
  const isAdminRoute =
    nextUrl.pathname.startsWith(ADMIN_ROUTE_PREFIX) && !isAdminLoginRoute;

  // An already-authenticated admin doesn't need the admin login page.
  if (isAdminLoginRoute && isLoggedIn && isAdmin) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  // Everything under /admin (other than /admin/login) requires an
  // authenticated session with the ADMIN role.
  if (isAdminRoute && (!isLoggedIn || !isAdmin)) {
    const redirectUrl = new URL(ADMIN_LOGIN_ROUTE, nextUrl);
    redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets, images, and Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
