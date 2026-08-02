import type { Metadata } from "next";

import { getCategoryBySlug } from "@/lib/shop/category";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/home/product-card";
import { EmptyState } from "@/components/home/empty-state";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);

  return {
    title: category
      ? `${category.name} — Lapiita Karya`
      : "Category not found — Lapiita Karya",
  };
}

export default async function ShopCategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            {category ? (
              <>
                <SectionHeading
                  eyebrow="Shop"
                  title={category.name}
                  description={category.description}
                />

                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-slate">
                  <span>
                    {category.products.length}{" "}
                    {category.products.length === 1 ? "piece" : "pieces"}
                  </span>
                </div>

                {category.products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {category.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No pieces are live in this category just yet — check back shortly." />
                )}
              </>
            ) : (
              <>
                <SectionHeading
                  eyebrow="Shop"
                  title="We couldn't find that category"
                  description="It may have moved, or it might not exist yet. Take a look at our full shop instead."
                />
                <EmptyState message="Try Fashion, Food, or Production from the menu above — or head back to the homepage to browse everything we carry." />
              </>
            )}
          </Container>
        </section>
      </main>
    </div>
  );
}
