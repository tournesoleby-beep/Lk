import { prisma } from "@/lib/prisma";

// Updates only the `imageUrl` field on specific, already-existing Fashion
// subcategory rows, matched by exact `slug`. Does not touch UI, routing,
// schema, product data, or any other Category field.
//
// Idempotent: setting the same imageUrl again is a no-op in effect; safe
// to run multiple times. Only the 6 slugs listed below are touched —
// `tas-kulit` is intentionally left alone (no image yet).
//
// Run with: npx tsx prisma/update-fashion-subcategory-images.ts

const IMAGE_UPDATES: Record<string, string> = {
  "tas-kain":
    "https://res.cloudinary.com/vkuafeej/image/upload/v1786088147/lapiita-karya/products/omgzkl1mkqqpdilhsvvy.jpg",
  aksesoris:
    "https://res.cloudinary.com/vkuafeej/image/upload/v1786088618/lapiita-karya/products/rptka5vfghr7atutomrx.jpg",
  "tas-rajut":
    "https://res.cloudinary.com/vkuafeej/image/upload/v1786083543/lapiita-karya/products/bactouky4dzkfolvvfuq.jpg",
  "tas-mote":
    "https://res.cloudinary.com/vkuafeej/image/upload/v1785997610/lapiita-karya/products/kweyn50gsddekmvtcsyn.jpg",
  pouch:
    "https://res.cloudinary.com/vkuafeej/image/upload/v1785994308/lapiita-karya/products/qmp5mff5ndmq95efirg5.jpg",
  batik:
    "https://res.cloudinary.com/vkuafeej/image/upload/v1786264028/lapiita-karya/products/pvnsydtnhlntydabjgoi.jpg",
};

async function main() {
  const updated: string[] = [];
  const missing: string[] = [];

  for (const [slug, imageUrl] of Object.entries(IMAGE_UPDATES)) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!existing) {
      console.warn(
        `[update-fashion-subcategory-images] No category found with slug '${slug}' — skipping.`
      );
      missing.push(slug);
      continue;
    }

    await prisma.category.update({
      where: { id: existing.id },
      data: { imageUrl },
    });

    updated.push(slug);
  }

  console.log("\n[update-fashion-subcategory-images] Summary");
  console.log("============================================");
  console.log(`\nImages updated (${updated.length}):`);
  for (const slug of updated) console.log(`  - ${slug}`);
  if (updated.length === 0) console.log("  none");

  console.log(`\nSlugs not found (${missing.length}):`);
  for (const slug of missing) console.log(`  - ${slug}`);
  if (missing.length === 0) console.log("  none");

  console.log(
    "\nUntouched by design: 'tas-kulit' (no new image provided yet)."
  );
  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("[update-fashion-subcategory-images] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
