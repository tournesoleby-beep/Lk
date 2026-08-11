import { prisma } from "@/lib/prisma";
import { classifyFashionSubcategorySlug } from "@/lib/admin/fashion-subcategory-classifier";

// One-off correction: move products that are currently sitting under
// Tas Kain ("tas-kain") but should actually be under Tas Kulit
// ("tas-kulit") — i.e. "kulit sintetis" (synthetic leather) products that
// got misfiled before the classifier's kulit-detection fix.
//
// Scope, by design:
// - Only reads products whose CURRENT categoryId is Tas Kain's id. Never
//   touches products in any other category (including Fashion itself,
//   which is handled separately by seed-fashion-subcategories.ts).
// - Only moves a product if re-running the shared classifier on its slug
//   now disagrees with its current subcategory (i.e. returns "tas-kulit"
//   instead of "tas-kain"). Anything the classifier still calls
//   "tas-kain" for is left untouched.
// - Never deletes products or categories, never renames/re-slugs a
//   product.
// - Idempotent: re-running after products have been moved finds nothing
//   left to move (they're no longer under Tas Kain).
//
// Run with: npx tsx prisma/move-kulit-sintetis-to-tas-kulit.ts

async function main() {
  const tasKain = await prisma.category.findUnique({
    where: { slug: "tas-kain" },
    select: { id: true },
  });
  const tasKulit = await prisma.category.findUnique({
    where: { slug: "tas-kulit" },
    select: { id: true },
  });

  if (!tasKain) {
    console.error(
      "[move-kulit-sintetis-to-tas-kulit] No category with slug 'tas-kain' found — aborting."
    );
    process.exitCode = 1;
    return;
  }
  if (!tasKulit) {
    console.error(
      "[move-kulit-sintetis-to-tas-kulit] No category with slug 'tas-kulit' found — aborting. Run seed-fashion-subcategories.ts first to create it."
    );
    process.exitCode = 1;
    return;
  }

  const tasKainProducts = await prisma.product.findMany({
    where: { categoryId: tasKain.id },
    select: { id: true, slug: true, name: true },
  });

  const moved: string[] = [];
  const left: string[] = [];

  for (const product of tasKainProducts) {
    const targetSlug = classifyFashionSubcategorySlug(product.slug);

    if (targetSlug !== "tas-kulit") {
      left.push(product.slug);
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { categoryId: tasKulit.id },
    });

    moved.push(product.slug);
  }

  console.log("\n[move-kulit-sintetis-to-tas-kulit] Summary");
  console.log("=============================================");

  console.log(`\nProducts moved Tas Kain -> Tas Kulit (${moved.length}):`);
  for (const slug of moved) console.log(`  - ${slug}`);
  if (moved.length === 0) console.log("  none");

  console.log(`\nProducts left under Tas Kain (${left.length}):`);
  for (const slug of left) console.log(`  - ${slug}`);
  if (left.length === 0) console.log("  none");

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("[move-kulit-sintetis-to-tas-kulit] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
