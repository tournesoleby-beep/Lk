import { getNewArrivals } from "@/lib/queries/home";
import { NewArrivalsCarousel } from "@/components/home/new-arrivals-carousel";

export async function NewArrivals() {
  const products = await getNewArrivals(8);

  return (
    <section id="new-arrivals" className="bg-cloud py-14 sm:py-32">
      <div className="flex flex-col gap-6 sm:gap-12">
        <NewArrivalsCarousel products={products} />
      </div>
    </section>
  );
}
