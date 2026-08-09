import { prisma } from "@/lib/prisma";
import { classifyFashionSubcategorySlug } from "@/lib/admin/fashion-subcategory-classifier";

// Fashion subcategory setup + safe product migration.
//
// - Creates any missing Fashion subcategories (idempotent — checked by
//   unique `slug` before creating).
// - Reassigns only products whose CURRENT categoryId is Fashion's id, so
//   re-running this script is a no-op for products already moved.
// - Never deletes products or categories, never renames/re-slugs a
//   product, never touches products outside Fashion.
// - Products that can't be confidently classified are left under Fashion
//   directly (untouched) and reported in the summary.
//
// This is now a backfill/catch-up script rather than the only place
// classification happens — src/lib/admin/actions.ts applies the same
// rules live, at product create/update time (see
// fashion-subcategory-classifier.ts, shared by both). Run this one
// whenever products were added some other way (a direct DB insert, an
// import script, etc.) and may have skipped that live classification.
//
// Run with: npx tsx prisma/seed-fashion-subcategories.ts

const FASHION_SUBCATEGORIES = [
  { name: "Tas Rajut", slug: "tas-rajut" },
  { name: "Tas Mote", slug: "tas-mote" },
  { name: "Batik", slug: "batik" },
  { name: "Aksesoris", slug: "aksesoris" },
  { name: "Pouch", slug: "pouch" },
  { name: "Tas Kulit", slug: "tas-kulit" },
  { name: "Tas Kain", slug: "tas-kain" },
];

async function main() {
  const fashion = await prisma.category.findUnique({
    where: { slug: "fashion" },
    select: { id: true, slug: true },
  });

  if (!fashion) {
    console.error(
      "[seed-fashion-subcategories] No category with slug 'fashion' found — aborting. Create the Fashion category first."
    );
    process.exitCode = 1;
    return;
  }

  // --- Step 1: create any missing subcategories -------------------------
  const categoriesCreated: string[] = [];
  const subcategoryIdBySlug = new Map<string, string>();

  for (const sub of FASHION_SUBCATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { slug: sub.slug },
      select: { id: true, parentId: true },
    });

    if (existing) {
      if (existing.parentId !== fashion.id) {
        console.warn(
          `[seed-fashion-subcategories] Category '${sub.slug}' already exists but is not a child of Fashion (parentId: ${existing.parentId}). Leaving it untouched.`
        );
      }
      subcategoryIdBySlug.set(sub.slug, existing.id);
      continue;
    }

    const created = await prisma.category.create({
      data: { name: sub.name, slug: sub.slug, parentId: fashion.id },
      select: { id: true, slug: true },
    });
    subcategoryIdBySlug.set(created.slug, created.id);
    categoriesCreated.push(created.slug);
  }

  // --- Step 2: reassign eligible products currently under Fashion -------
  const fashionProducts = await prisma.product.findMany({
    where: { categoryId: fashion.id },
    select: { id: true, slug: true, name: true },
  });

  const movedBySubcategory: Record<string, string[]> = {};
  const skipped: string[] = [];

  for (const product of fashionProducts) {
    const targetSlug = classifyFashionSubcategorySlug(product.slug);

    if (!targetSlug) {
      skipped.push(product.slug);
      continue;
    }

    const targetId = subcategoryIdBySlug.get(targetSlug);
    if (!targetId) {
      // Shouldn't happen — every targetSlug above is in FASHION_SUBCATEGORIES.
      console.warn(
        `[seed-fashion-subcategories] Unknown target subcategory '${targetSlug}' for product '${product.slug}' — skipping.`
      );
      skipped.push(product.slug);
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { categoryId: targetId },
    });

    (movedBySubcategory[targetSlug] ??= []).push(product.slug);
  }

  // --- Summary ------------------------------------------------------------
  console.log("\n[seed-fashion-subcategories] Summary");
  console.log("=====================================");

  console.log(
    `\nCategories created (${categoriesCreated.length}):` +
      (categoriesCreated.length ? "" : " none")
  );
  for (const slug of categoriesCreated) console.log(`  - ${slug}`);

  const movedTotal = Object.values(movedBySubcategory).reduce(
    (sum, list) => sum + list.length,
    0
  );
  console.log(`\nProducts moved (${movedTotal}):`);
  for (const [subSlug, slugs] of Object.entries(movedBySubcategory)) {
    console.log(`  ${subSlug} (${slugs.length}):`);
    for (const slug of slugs) console.log(`    - ${slug}`);
  }
  if (movedTotal === 0) console.log("  none");

  console.log(`\nProducts left under Fashion / skipped (${skipped.length}):`);
  for (const slug of skipped) console.log(`  - ${slug}`);
  if (skipped.length === 0) console.log("  none");

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("[seed-fashion-subcategories] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
