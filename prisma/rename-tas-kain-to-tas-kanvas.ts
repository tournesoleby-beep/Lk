import { prisma } from "@/lib/prisma";

// One-off rename: updates the `name` field on the existing 'tas-kain'
// category row to "Tas Kanvas". Slug is intentionally left as 'tas-kain'
// (see seed-fashion-subcategories.ts / fashion-subcategory-classifier.ts /
// update-fashion-subcategory-images.ts, which all key off that slug).
//
// Run with: npx tsx prisma/rename-tas-kain-to-tas-kanvas.ts

async function main() {
  const existing = await prisma.category.findUnique({
    where: { slug: "tas-kain" },
    select: { id: true, name: true },
  });

  if (!existing) {
    console.error(
      "[rename-tas-kain-to-tas-kanvas] No category with slug 'tas-kain' found — nothing to rename."
    );
    process.exitCode = 1;
    return;
  }

  if (existing.name === "Tas Kanvas") {
    console.log(
      "[rename-tas-kain-to-tas-kanvas] Category name is already 'Tas Kanvas' — nothing to do."
    );
    return;
  }

  await prisma.category.update({
    where: { id: existing.id },
    data: { name: "Tas Kanvas" },
  });

  console.log(
    `[rename-tas-kain-to-tas-kanvas] Renamed category (slug: tas-kain) from '${existing.name}' to 'Tas Kanvas'.`
  );
}

main()
  .catch((error) => {
    console.error("[rename-tas-kain-to-tas-kanvas] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
