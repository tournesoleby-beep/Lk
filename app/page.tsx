import { HeroBanner } from "@/components/home/hero-banner";
import { CardsSection } from "@/components/home/cards-section";
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
        {/* CHANGED: new grid section (the three non-diorama cards
            from the old hero carousel) inserted directly below the
            hero and above CategoriesSection ("Belanja per
            Kategori"), per the brief. */}
        <CardsSection />
        <CategoriesSection />
        <NewArrivals />
        <InstagramHighlights />
        <ProcessTimeline />
      </main>
      <Footer />
    </div>
  );
}
