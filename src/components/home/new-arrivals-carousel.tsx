"use client";

import type { ProductCardData } from "@/lib/queries/home";
import { Container } from "@/components/home/container";
import { Reveal } from "@/components/home/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/home/product-card";
import { EmptyState } from "@/components/home/empty-state";
import { CarouselArrowButton } from "@/components/home/carousel-arrow-button";
import { useHorizontalCarousel } from "@/components/home/use-horizontal-carousel";

// This section's own motion signature: a brisk, flatter ease-out — no
// overshoot — distinct from the other three sections.
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 600;
const STAGGER = 70;

export function NewArrivalsCarousel({ products }: { products: ProductCardData[] }) {
  const { scrollerRef, atStart, atEnd, canScroll, scrollByPage, onWheel, onKeyDown, dragHandlers } =
    useHorizontalCarousel();
  const hasProducts = products.length > 0;

  return (
    <>
      <Container className="px-5 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <Reveal variant="fade-up" duration={DURATION} easing={EASING}>
            <SectionHeading
              eyebrow="Baru tiba"
              title="Produk Terbaru"
              description="Baru dari bengkel kerja kami — produk terbaru buatan tangan, siap menemukan rumah barunya."
              compact
            />
          </Reveal>

          {/* Desktop-only paging controls, parked outside the row itself
              (next to the heading) so they never sit on top of a card.
              Hidden entirely once every card already fits on screen. */}
          {hasProducts && canScroll ? (
            <div className="hidden shrink-0 items-center gap-2 pb-1 lg:flex">
              <CarouselArrowButton
                direction="prev"
                label="Produk sebelumnya"
                onClick={() => scrollByPage(-1)}
                disabled={atStart}
              />
              <CarouselArrowButton
                direction="next"
                label="Produk berikutnya"
                onClick={() => scrollByPage(1)}
                disabled={atEnd}
              />
            </div>
          ) : null}
        </div>
      </Container>

      {hasProducts ? (
        <Reveal
          as="div"
          elementRef={scrollerRef}
          role="region"
          aria-label="Produk terbaru"
          tabIndex={0}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          {...dragHandlers}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] cursor-grab active:cursor-grabbing sm:gap-6 sm:px-6 md:px-10 [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-2"
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
          <EmptyState message="Produk terbaru akan muncul di sini setelah dipublikasikan." />
        </Container>
      )}
    </>
  );
}
