import { getNewArrivals } from "@/lib/queries/home";
import { Container } from "@/components/home/container";
import { Reveal } from "@/components/home/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/home/product-card";
import { EmptyState } from "@/components/home/empty-state";

// This section's own motion signature: a brisk, flatter ease-out — no
// overshoot — distinct from the other three sections.
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 600;
const STAGGER = 70;

export async function NewArrivals() {
  const products = await getNewArrivals(8);

  return (
    <section id="new-arrivals" className="bg-cloud py-14 sm:py-32">
      <div className="flex flex-col gap-6 sm:gap-12">
        <Container className="px-5 sm:px-6">
          <Reveal variant="fade-up" duration={DURATION} easing={EASING}>
            <SectionHeading
              eyebrow="Just landed"
              title="New arrivals"
              description="Fresh from the workshop — the newest pieces made by hand, ready for their next home."
              compact
            />
          </Reveal>
        </Container>

        {products.length > 0 ? (
          <Reveal
            as="div"
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:gap-6 sm:px-6 md:px-10 [&::-webkit-scrollbar]:hidden"
            variant="fade-right"
            stagger
            duration={DURATION}
            easing={EASING}
            staggerDelay={STAGGER}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className="w-[200px] snap-start sm:w-[260px]"
              />
            ))}
            {/* Trailing spacer so the last card can reach the container's edge padding. */}
            <div className="w-2 shrink-0 md:w-6" aria-hidden="true" />
          </Reveal>
        ) : (
          <Container>
            <EmptyState message="New arrivals will appear here as soon as they're published." />
          </Container>
        )}
      </div>
    </section>
  );
}
