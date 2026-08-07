import { getFashionHomeCategories } from "@/lib/shop/category";
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

// Continues the same warm taupe surface used by every section below the
// hero (CardsSection, ProcessTimeline, NewArrivals, InstagramHighlights)
// — same base fill, same radial gradient values — so this section reads
// as one uninterrupted background rather than its own white block. See
// the `<section>` below for why this is an `inset-0` layer rather than
// a plain `bg-paper` class.
const SECTION_BASE_COLOR = "#B09F90";
const SECTION_BACKGROUND =
  "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(208,196,184,0.95) 0%, rgba(196,182,168,0.85) 45%, rgba(176,159,144,0.95) 100%)";

export async function CategoriesSection() {
  const data = await getFashionHomeCategories();

  // Fashion's 5 subcategories, each linking into the Fashion shop page
  // pre-filtered to that subcategory, plus a synthetic "Tampilkan Semua"
  // tile (Fashion itself, unfiltered) as the 6th card.
  const cards = data
    ? [
        ...data.subcategories.map((subcategory) => ({
          category: subcategory,
          href: `/shop/${data.fashion.slug}?sub=${subcategory.slug}`,
        })),
        {
          category: { ...data.fashion, name: "Tampilkan Semua" },
          href: `/shop/${data.fashion.slug}`,
        },
      ]
    : [];

  return (
    // `relative` + `overflow-hidden` makes this section the containing
    // block for the background layer below, so it stays a normal
    // document-flow box — no `fixed` positioning, no `vw`/`vh` sizing —
    // and rescales/repositions with the section at every browser zoom
    // level, same as the text and cards already do.
    <section className="relative w-full overflow-hidden py-14 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: SECTION_BASE_COLOR, backgroundImage: SECTION_BACKGROUND }}
      />
      <Container className="relative z-10 flex flex-col gap-7 px-5 sm:gap-12 sm:px-6">
        <Reveal variant="fade-up" duration={DURATION} easing={EASING}>
          <SectionHeading
            eyebrow="Koleksi kami"
            title="Belanja per Kategori"
            description="Fashion dan makanan — setiap produk dibuat tangan oleh perempuan yang mengembangkan keterampilan baru melalui program pelatihan vokasi kami."
            compact
          />
        </Reveal>

        {cards.length > 0 ? (
          <Reveal
            as="div"
            className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3"
            variant="fade-up"
            stagger
            duration={DURATION}
            easing={EASING}
            staggerDelay={STAGGER}
          >
            {cards.map(({ category, href }) => (
              <CategoryCard key={href} category={category} href={href} />
            ))}
          </Reveal>
        ) : (
          <EmptyState message="Kategori akan muncul di sini setelah ditambahkan ke katalog." />
        )}
      </Container>
    </section>
  );
}
