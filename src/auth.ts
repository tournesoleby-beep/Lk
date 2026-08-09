import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import authConfig from "@/auth.config";

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
