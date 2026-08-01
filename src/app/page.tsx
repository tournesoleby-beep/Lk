import { HeroBanner } from "@/components/home/hero-banner";
import { NewArrivals } from "@/components/home/new-arrivals";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { NewsletterCta } from "@/components/home/newsletter-cta";
import { Footer } from "@/components/home/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <HeroBanner />
        <CategoriesSection />
        <NewArrivals />
        <FeaturedProducts />
        <WhyChooseUs />
        <NewsletterCta />
      </main>
      <Footer />
    </div>
  );
}
