import { getFeaturedProducts } from "@/lib/queries/home";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/home/product-card";
import { EmptyState } from "@/components/home/empty-state";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(8);

  return (
    <section id="featured" className="bg-paper py-24 sm:py-32">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Recommended for you"
          title="Picked to match your style"
          description="A curated edit based on what's trending in the pieces our team keeps coming back to — for material, fit, and lasting quality."
        />

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState message="Featured picks are being curated right now — check back shortly." />
        )}
      </Container>
    </section>
  );
}
