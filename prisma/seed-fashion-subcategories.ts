import { prisma } from "@/lib/prisma";

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

// Explicit, hand-verified slug -> subcategory moves. Checked first, before
// any pattern-based guess, since these are known with certainty.
const EXPLICIT_MOVES: Record<string, string> = {
  // Aksesoris — rajut-material accessories (not bags)
  "sendal-rajut-pink-hitam": "aksesoris",
  "sendal-rajut-hijau-pink": "aksesoris",
  "botol-minum-cover-rajut-biru-langit-putih": "aksesoris",
  "botol-minum-cover-rajut-biru-putih": "aksesoris",
  "botol-minum-cover-rajut-skyblue": "aksesoris",
  "syal-rajut-cyan-putih": "aksesoris",
  "kotak-tissue-cover-rajut-natal": "aksesoris",
  "ganci-rajut-bunga": "aksesoris",
  "ganci-rajut-donat": "aksesoris",
  "dompet-koin-rajut-love-abu-abu-biru": "aksesoris",

  // Tas Kain
  "tas-hitam-pita": "tas-kain",

  // Tas Rajut — bags
  "tas-rajut-abu-abu": "tas-rajut",
  "tas-rajut-biru": "tas-rajut",
  "tas-rajut-merah-garis-hijau": "tas-rajut",
  "tas-rajut-abu-abu-orange": "tas-rajut",
  "tas-rajut-hijau-kuning": "tas-rajut",
  "tas-rajut-pink": "tas-rajut",
  "tas-rajut-hitam": "tas-rajut",
  "tas-rajut-coklat": "tas-rajut",
  "backpack-rajut-navy-ungu": "tas-rajut",

  // Tas Mote
  "tas-mote": "tas-mote",
};

// Keywords that mark a rajut item as an accessory (not a bag), even if it
// also contains "rajut". Checked before the broad Tas Rajut catch-all
// below so items like "sendal-rajut-*" or "syal-rajut-*" never get
// misclassified as bags.
const RAJUT_ACCESSORY_KEYWORDS =
  /(sendal|botol|syal|kotak|dompet|ganci|gantungan|charm|keychain)/;

// Slug prefixes that unambiguously identify a knitted (rajut) bag,
// including the "selmpang" typo variant observed in the source data.
const RAJUT_BAG_PREFIXES = [
  "tas-selempang-rajut-",
  "tas-selmpang-rajut-",
  "tas-jinjing-rajut-",
  "tas-rajut-",
  "backpack-rajut-",
];

/**
 * Best-effort classification for Fashion products NOT covered by
 * EXPLICIT_MOVES above. Deliberately conservative — anything that doesn't
 * clearly match one of these patterns returns `null` and is left under
 * Fashion directly rather than guessed at.
 */
function classifyBySlug(slug: string): string | null {
  const s = slug.toLowerCase();

  if (s.startsWith("tas-kain-")) return "tas-kain";
  if (s.startsWith("tas-mote-")) return "tas-mote";
  if (s.startsWith("tas-kulit-")) return "tas-kulit";
  if (s.startsWith("pouch-") || s.endsWith("-pouch") || s.includes("-pouch-")) {
    return "pouch";
  }
  if (s.startsWith("batik-") || s.includes("-batik-") || s.endsWith("-batik")) {
    return "batik";
  }

  // Rajut (knitted) items: bags vs. accessories.
  if (s.includes("rajut")) {
    if (RAJUT_ACCESSORY_KEYWORDS.test(s)) {
      return "aksesoris";
    }
    if (RAJUT_BAG_PREFIXES.some((prefix) => s.startsWith(prefix))) {
      return "tas-rajut";
    }
    // Broad catch-all: any other clearly bag-shaped rajut item — the slug
    // contains both a "tas" (bag) token and "rajut", with no accessory
    // keyword present (checked above).
    if (/(^|-)tas(-|$)/.test(s)) {
      return "tas-rajut";
    }
    // Rajut item that's neither a recognized bag prefix nor a known
    // accessory keyword — ambiguous, leave for manual review.
    return null;
  }

  // Small-item / jewelry keywords — clearly accessories, not bags.
  if (
    /(^|-)(gantungan|charm|keychain|gelang|anting|bros|kalung|cincin|ganci)(-|$)/.test(
      s
    )
  ) {
    return "aksesoris";
  }

  return null;
}

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
    const targetSlug =
      EXPLICIT_MOVES[product.slug] ?? classifyBySlug(product.slug);

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
