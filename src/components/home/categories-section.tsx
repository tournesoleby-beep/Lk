import { getTopCategories } from "@/lib/queries/home";
import { Container } from "@/components/home/container";
import { Reveal } from "@/components/home/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { CategoryCard } from "@/components/home/category-card";
import { EmptyState } from "@/components/home/empty-state";

// This section's own motion signature — a clean, quiet ease-out with no
// overshoot, distinct from the other homepage sections' curves.
const EASING = "cubic-bezier(0.19, 1, 0.22, 1)";
const DURATION = 620;
const STAGGER = 65;

export async function CategoriesSection() {
  const categories = await getTopCategories(6);

  return (
    <section className="bg-paper py-14 sm:py-32">
      <Container className="flex flex-col gap-7 px-5 sm:gap-12 sm:px-6">
        <Reveal variant="fade-up" duration={DURATION} easing={EASING}>
          <SectionHeading
            eyebrow="Koleksi kami"
            title="Belanja per Kategori"
            description="Fashion, makanan, dan produksi — setiap produk dibuat tangan oleh perempuan yang mengembangkan keterampilan baru melalui program pelatihan vokasi kami."
            compact
          />
        </Reveal>

        {categories.length > 0 ? (
          <Reveal
            as="div"
            className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3"
            variant="fade-up"
            stagger
            duration={DURATION}
            easing={EASING}
            staggerDelay={STAGGER}
          >
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </Reveal>
        ) : (
          <EmptyState message="Kategori akan muncul di sini setelah ditambahkan ke katalog." />
        )}
      </Container>
    </section>
  );
}
