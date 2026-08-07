import { getNewArrivals } from "@/lib/queries/home";
import { NewArrivalsCarousel } from "@/components/home/new-arrivals-carousel";

// Continues the same warm taupe surface used by every section below the
// hero (CardsSection, CategoriesSection, ProcessTimeline,
// InstagramHighlights) — same base fill, same radial gradient values —
// so this section reads as one uninterrupted background rather than its
// own bg-cloud block.
const SECTION_BASE_COLOR = "#B09F90";
const SECTION_BACKGROUND =
  "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(208,196,184,0.95) 0%, rgba(196,182,168,0.85) 45%, rgba(176,159,144,0.95) 100%)";

export async function NewArrivals() {
  const products = await getNewArrivals(8);

  return (
    // `relative` + `overflow-hidden` makes this section the containing
    // block for the background layer below, so it stays a normal
    // document-flow box — no `fixed` positioning, no `vw`/`vh` sizing —
    // and rescales/repositions with the section at every browser zoom
    // level, same as the text and cards already do.
    <section id="new-arrivals" className="relative w-full overflow-hidden py-14 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: SECTION_BASE_COLOR, backgroundImage: SECTION_BACKGROUND }}
      />
      <div className="relative z-10 flex flex-col gap-6 sm:gap-12">
        <NewArrivalsCarousel products={products} />
      </div>
    </section>
  );
}
