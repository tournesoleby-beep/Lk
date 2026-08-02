// Seeds (or updates) a single ADMIN user so you can sign in at /admin/login.
//
// Usage:
//   npx prisma db seed
//
// Configure the credentials via env vars (falls back to sensible defaults
// for local/dev use only — change the password before using this in a real
// deployment):
//   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=your-password npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@lapiitakarya.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email,
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`✔ Admin user ready: ${admin.email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(
      `  Using default password "ChangeMe123!" — set SEED_ADMIN_PASSWORD to use your own, and change it after first login.`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
