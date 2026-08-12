import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import authConfig from "@/auth.config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Admin login is the single gate to the entire /admin dashboard (see
// middleware.ts) and has no CAPTCHA or account lockout, so it's rate
// limited by both IP and the attempted email — IP alone would let an
// attacker spread guesses for one admin email across many IPs miss
// nothing, and email alone would let a single IP hammer many different
// email guesses. Limiting on both closes each gap the other leaves open.
// Deliberately generous (a legitimate admin mistyping a password a few
// times shouldn't get locked out) but low enough to make online
// brute-forcing impractical.
const LOGIN_IP_LIMIT = 10;
const LOGIN_IP_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_EMAIL_LIMIT = 5;
const LOGIN_EMAIL_WINDOW_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // The Prisma adapter persists users/accounts/sessions for OAuth providers
  // added later. Credentials sign-in bypasses it and issues a JWT directly,
  // since Auth.js does not support database sessions for the Credentials
  // provider. `authConfig.session` (strategy + maxAge) is left as-is from
  // the spread above rather than redeclared here — a plain object key on
  // top of a spread REPLACES the whole `session` object rather than
  // merging it, so redeclaring `session: { strategy: "jwt" }` here would
  // silently drop `authConfig.session.maxAge` and this Node.js sign-in
  // path (the one that actually issues the session on login) would fall
  // back to Auth.js's 30-day default even though middleware.ts, reading
  // the same authConfig directly, would still enforce the shorter one.
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate limit before touching the database or bcrypt at all — both
        // a failed IP check and a failed email check reject the same way
        // a bad password does (return null), so a scripted attacker can't
        // distinguish "rate limited" from "wrong credentials" and use that
        // to fingerprint the limiter.
        const headerList = await headers();
        const ip = getClientIp(headerList);
        const ipResult = checkRateLimit(`admin-login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_MS);
        const emailResult = checkRateLimit(
          `admin-login:email:${email}`,
          LOGIN_EMAIL_LIMIT,
          LOGIN_EMAIL_WINDOW_MS
        );
        if (!ipResult.allowed || !emailResult.allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        // This login is admin-only — Lapiita Karya customers shop as
        // guests and never have a User record with a password.
        if (user.role !== "ADMIN") return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
