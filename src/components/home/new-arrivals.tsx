import { getNewArrivals } from "@/lib/queries/home";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/home/product-card";
import { EmptyState } from "@/components/home/empty-state";

export async function NewArrivals() {
  const products = await getNewArrivals(8);

  return (
    <section id="new-arrivals" className="bg-cloud py-24 sm:py-32">
      <div className="flex flex-col gap-12">
        <Container>
          <SectionHeading
            eyebrow="Just landed"
            title="New arrivals"
            description="Fresh into the shop, in the order they came off the line."
          />
        </Container>

        {products.length > 0 ? (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:gap-6 md:px-10 [&::-webkit-scrollbar]:hidden">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className="w-[220px] snap-start sm:w-[260px]"
              />
            ))}
            {/* Trailing spacer so the last card can reach the container's edge padding. */}
            <div className="w-2 shrink-0 md:w-6" aria-hidden="true" />
          </div>
        ) : (
          <Container>
            <EmptyState message="New arrivals will appear here as soon as they're published." />
          </Container>
        )}
      </div>
    </section>
  );
}
