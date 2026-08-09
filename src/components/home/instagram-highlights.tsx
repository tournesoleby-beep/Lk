"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/home/container";
import { Parallax } from "@/components/home/parallax";
import { Reveal } from "@/components/home/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { CarouselArrowButton } from "@/components/home/carousel-arrow-button";
import { useHorizontalCarousel } from "@/components/home/use-horizontal-carousel";

// This section's own motion signature: a snappier, shorter ease-out —
// distinct from the other three sections.
const EASING = "cubic-bezier(0.33, 1, 0.68, 1)";
const DURATION = 550;
const STAGGER = 60;

const INSTAGRAM_HANDLE = "@lapiitakarya";
const INSTAGRAM_URL = "https://www.instagram.com/lapiitakarya";

// Continues the same warm taupe surface used by every section below the
// hero (CardsSection, CategoriesSection, ProcessTimeline, NewArrivals) —
// same base fill, same radial gradient values — so this section reads as
// one uninterrupted background rather than its own bg-paper block.
const SECTION_BASE_COLOR = "#B09F90";
const SECTION_BACKGROUND =
  "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(208,196,184,0.95) 0%, rgba(196,182,168,0.85) 45%, rgba(176,159,144,0.95) 100%)";

/**
 * Fixed set of real Instagram posts/reels to feature in the carousel.
 * Each tile links out to its own post and shows that post's real thumbnail,
 * stored locally under /public/instagram/.
 */
const INSTAGRAM_POSTS = [
  { url: "https://www.instagram.com/reel/DbkIGVBKSuE/?igsh=MThrb3VmMGt3OWdodA==", thumb: "/instagram/post-1.jpg" },
  { url: "https://www.instagram.com/p/DbSVZuzEbre/?igsh=MXJnZTVteW5iNnlzZA==", thumb: "/instagram/post-2.jpg" },
  { url: "https://www.instagram.com/p/DbFIeBRk-vc/?igsh=MXpiMm4wMGZjY2Fq", thumb: "/instagram/post-3.jpg" },
  { url: "https://www.instagram.com/reel/Da7r0_jT1Eu/?igsh=N294MXd2Njg2ajBn", thumb: "/instagram/post-4.jpg" },
  { url: "https://www.instagram.com/reel/DTjbEM-k4uZ/?igsh=MTBvazFyaHBjcGx5bw==", thumb: "/instagram/post-5.jpg" },
  { url: "https://www.instagram.com/reel/DajmDk9zOAj/?igsh=amtoN2ZzY3k0cHVj", thumb: "/instagram/post-6.jpg" },
  { url: "https://www.instagram.com/p/DF1KYCmzFUf/?igsh=bWtwbjNlMW56ZTUw", thumb: "/instagram/post-7.jpg" },
] as const;

export function InstagramHighlights() {
  const { scrollerRef, atStart, atEnd, canScroll, scrollByPage, onWheel, onKeyDown, dragHandlers } =
    useHorizontalCarousel();

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
      <div className="relative z-10 flex flex-col gap-6 sm:gap-12">
        <Container className="px-5 sm:px-6">
          <div className="flex items-end justify-between gap-6">
            <Reveal variant="fade-up" duration={DURATION} easing={EASING}>
              <SectionHeading
                eyebrow="Ikuti kami"
                title="Sorotan Instagram"
                description="Lihat karya terbaru dan aktivitas Lapiita Karya."
                compact
              />
            </Reveal>

            {/* Desktop-only paging controls, parked outside the row itself
                (next to the heading) so they never sit on top of a post. */}
            {canScroll ? (
              <div className="hidden shrink-0 items-center gap-2 pb-1 lg:flex">
                <CarouselArrowButton
                  direction="prev"
                  label="Sorotan sebelumnya"
                  onClick={() => scrollByPage(-1)}
                  disabled={atStart}
                />
                <CarouselArrowButton
                  direction="next"
                  label="Sorotan berikutnya"
                  onClick={() => scrollByPage(1)}
                  disabled={atEnd}
                />
              </div>
            ) : null}
          </div>
        </Container>

        {/* Horizontally scrollable carousel: native swipe on touch devices,
            plus mouse drag, wheel, and arrow-key paging on desktop. Reveal
            renders this element directly (via elementRef, merged with the
            carousel hook's ref) so each tile can stagger in on its own
            instead of the whole row moving as one block. */}
        <Reveal
          as="div"
          elementRef={scrollerRef}
          role="region"
          aria-label="Sorotan Instagram"
          tabIndex={0}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          {...dragHandlers}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:gap-6 sm:px-6 md:px-10 [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-2"
          variant="fade-left"
          stagger
          duration={DURATION}
          easing={EASING}
          staggerDelay={STAGGER}
        >
          {INSTAGRAM_POSTS.map((post, index) => (
            <Link
              key={post.url}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Lihat postingan di Instagram"
              className="group relative aspect-square w-[140px] shrink-0 select-none snap-start overflow-hidden rounded-2xl border border-line shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink/15 hover:shadow-lg active:scale-95 sm:w-[190px] md:w-[220px]"
            >
              <Parallax as="div" className="h-full w-full" strength={10}>
                <Image
                  src={post.thumb}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 220px, (min-width: 640px) 190px, 140px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  // First couple of tiles are likely above the fold on load.
                  priority={index < 2}
                />
              </Parallax>
            </Link>
          ))}
        </Reveal>

        <Container className="flex flex-col items-center gap-4 px-5 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span className="font-mono text-sm font-medium tracking-[0.05em] text-ink">
            {INSTAGRAM_HANDLE}
          </span>
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 px-7 py-3.5 text-sm font-medium text-ink transition-all duration-200 hover:border-ink/35 hover:bg-paper hover:shadow-sm active:scale-[0.98]"
          >
            Lihat Instagram
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2}
            />
          </Link>
        </Container>
      </div>
    </section>
  );
}
