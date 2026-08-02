import { HeroBanner } from "@/components/home/hero-banner";
import { NewArrivals } from "@/components/home/new-arrivals";
import { CategoriesSection } from "@/components/home/categories-section";
import { InstagramHighlights } from "@/components/home/instagram-highlights";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { Footer } from "@/components/home/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <HeroBanner />
        <CategoriesSection />
        <NewArrivals />
        <InstagramHighlights />
        <ProcessTimeline />
      </main>
      <Footer />
    </div>
  );
}
