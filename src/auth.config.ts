import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-safe Auth.js config, used directly by middleware.
 *
 * This intentionally has NO Prisma adapter and NO `authorize()` database
 * lookup — Prisma's Node.js driver (`pg`) and `bcryptjs` are not supported
 * in the Edge runtime that middleware executes in. Middleware only needs to
 * read/verify the JWT session cookie, not run the credential check itself
 * (that only happens when `signIn()` is called from a Node.js runtime).
 *
 * `src/auth.ts` extends this config with the Prisma adapter and the real
 * `authorize()` implementation for use in Route Handlers, Server Components,
 * and Server Actions.
 */
export default {
  pages: {
    // Lapiita Karya has no customer sign-in — this auth setup exists solely
    // for the hidden admin dashboard.
    signIn: "/admin/login",
  },
  // Admin dashboard only — no customer accounts, so there's no reason to
  // trade convenience for a long-lived session here. 1 hour, absolute:
  // the session becomes invalid 1 hour after login regardless of activity
  // (no rolling/sliding renewal), so a device left logged in overnight or
  // shared afterward can't be used to reach /admin without signing in
  // again. jwt.maxAge mirrors session.maxAge explicitly rather than
  // relying on it inheriting that value by default, so this stays correct
  // even if `session` is ever restructured later.
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour, in seconds
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour, in seconds — kept equal to session.maxAge above
  },
  providers: [
    // Listed here (without `authorize`) so middleware and the client know
    // this provider exists. The real `authorize()` lives in src/auth.ts.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
