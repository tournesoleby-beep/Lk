import { getTopCategories } from "@/lib/queries/home";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { CategoryCard } from "@/components/home/category-card";
import { EmptyState } from "@/components/home/empty-state";

export async function CategoriesSection() {
  const categories = await getTopCategories(6);

  return (
    <section className="bg-paper py-14 sm:py-32">
      <Container className="flex flex-col gap-7 px-5 sm:gap-12 sm:px-6">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="From everyday essentials to statement pieces — organized the way you'd actually go looking for it."
          compact
        />

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState message="Categories will show up here once they're added in the catalog." />
        )}
      </Container>
    </section>
  );
}
