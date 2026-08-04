"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";

import { Container } from "@/components/home/container";
import { Parallax } from "@/components/home/parallax";
import { Reveal } from "@/components/home/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { getPlaceholderGradient } from "@/lib/utils";

// This section's own motion signature: a snappier, shorter ease-out —
// distinct from the other three sections.
const EASING = "cubic-bezier(0.33, 1, 0.68, 1)";
const DURATION = 550;
const STAGGER = 60;

const INSTAGRAM_HANDLE = "@lapiitakarya";
const INSTAGRAM_URL = "https://www.instagram.com/lapiitakarya";
const VISIBLE_COUNT = 8;

/**
 * A pool larger than what's displayed so the carousel can be reshuffled
 * into a different 8-image spread on every load. These are local seeds fed
 * into the shop's existing placeholder-gradient system (see
 * src/lib/utils.ts) — swap this out for real Instagram post images once
 * the API integration is wired up.
 */
const IMAGE_POOL = Array.from(
  { length: 12 },
  (_, index) => `instagram-post-${index + 1}`
);

function shuffled<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function InstagramHighlights() {
  // Deterministic on first render so server and client markup match (no
  // hydration mismatch), then reshuffled client-side once mounted so the
  // set shown is randomized on every page load.
  const [seeds, setSeeds] = useState<string[]>(() =>
    IMAGE_POOL.slice(0, VISIBLE_COUNT)
  );

  useEffect(() => {
    // One-time reshuffle after mount, client-only. Doing this in the
    // initializer instead would run during SSR too, and a server-picked
    // random order would mismatch the client's on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeeds(shuffled(IMAGE_POOL).slice(0, VISIBLE_COUNT));
  }, []);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, startScroll: 0 });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    // Touch devices already get native swipe/snap scrolling on this
    // overflow-x-auto container — only take over for mouse/pen drag so we
    // don't fight the browser's own touch scrolling with manual
    // scrollLeft writes (which caused jittery, half-working swipes).
    if (event.pointerType === "touch") return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    dragState.current = {
      active: true,
      startX: event.clientX,
      startScroll: scroller.scrollLeft,
    };
    scroller.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    if (!scroller || !dragState.current.active) return;
    scroller.scrollLeft =
      dragState.current.startScroll - (event.clientX - dragState.current.startX);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    dragState.current.active = false;
    if (scroller?.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section className="bg-paper py-14 sm:py-32">
      <div className="flex flex-col gap-6 sm:gap-12">
        <Container className="px-5 sm:px-6">
          <Reveal variant="fade-up" duration={DURATION} easing={EASING}>
            <SectionHeading
              eyebrow="Follow along"
              title="Instagram Highlights"
              description="Lihat karya terbaru dan aktivitas Lapiita Karya."
              compact
            />
          </Reveal>
        </Container>

        {/* Horizontally scrollable carousel: native swipe on touch devices,
            plus pointer-drag support so a mouse can drag it on desktop too.
            Reveal renders this element directly (via elementRef, merged
            with the drag-scroll ref) so each tile can stagger in on its
            own instead of the whole row moving as one block. */}
        <Reveal
          as="div"
          elementRef={scrollerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:gap-6 sm:px-6 md:px-10 [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
          variant="fade-left"
          stagger
          duration={DURATION}
          easing={EASING}
          staggerDelay={STAGGER}
        >
          {seeds.map((seed) => (
            <div
              key={seed}
              className="group relative aspect-square w-[140px] shrink-0 select-none snap-start overflow-hidden rounded-2xl border border-line shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink/15 hover:shadow-lg active:scale-95 sm:w-[190px] md:w-[220px]"
              aria-hidden="true"
            >
              <Parallax as="div" className="h-full w-full" strength={10}>
                <div
                  className="h-full w-full"
                  style={{ background: getPlaceholderGradient(seed) }}
                  aria-hidden="true"
                />
              </Parallax>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-[1.06]">
                <Camera className="h-6 w-6 text-white/70" strokeWidth={1.5} />
              </div>
            </div>
          ))}
          {/* Trailing spacer so the last card can reach the container's edge padding. */}
          <div className="w-2 shrink-0 md:w-6" aria-hidden="true" />
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
            View Instagram
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
