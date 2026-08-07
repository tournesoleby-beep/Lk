import Image from "next/image";

import { HeroBanner } from "@/components/home/hero-banner";
import { CardsSection } from "@/components/home/cards-section";

// Use this in place of rendering <HeroBanner /> and <CardsSection />
// separately:
//
//   <HeroCardsBackdrop />
//   <BelanjaPerKategori />   <-- must itself be bg-[#B1A295], see note
//                                at the bottom of this file
//
// ── WHY THE PREVIOUS VERSION WENT BLACK ──────────────────────────────
// The previous version put a Next.js <Image fill> inside a plain
// `position: relative` div whose OWN height was "auto" (derived from
// Hero + Cards content). `fill` makes the image `position: absolute;
// height: 100%`. A percentage height on an absolutely positioned
// element is only well-defined when its containing block has a
// DEFINITE height. A containing block whose height itself comes from
// auto-sized in-flow content is, by spec, ambiguous for this case —
// different engines resolve it differently, and in the failing case
// the image was sized against 0 / an indeterminate value, so it
// rendered only as tall as its own intrinsic fallback (effectively
// stopping around the Hero) — everything below that showed the
// wrapper's plain background color instead of the photo. That's the
// "black area below the Hero."
//
// ── THE FIX ───────────────────────────────────────────────────────
// The image is no longer sized against an ambiguous auto-height
// parent at all. It's `position: fixed; inset: 0`, sized directly
// against the VIEWPORT (a value that's always definite, never
// ambiguous) — the same technique as a CSS `background-attachment:
// fixed` hero. It keeps Hero's exact original box size and crop
// (`object-cover object-bottom`, unchanged), stays pinned in place as
// the page scrolls through Hero and Cards (so there is nothing to
// misalign — it's literally one unmoving image, not two images being
// lined up), and is only ever covered once solid, opaque content
// (the gradient's tail, then the next section) scrolls over it.
//
// IMPORTANT DEPENDENCY: `position: fixed` is positioned relative to
// the nearest ancestor with a `transform`, `filter`, `perspective`,
// or `will-change: transform` — or the viewport if there is none. If
// this component is ever rendered inside a layout wrapper that sets
// one of those properties (common with page-transition libraries),
// the image will stop being viewport-pinned and this bug can
// resurface. Check `app/layout.tsx` and any page-transition wrapper
// for those properties if you still see a gap after this fix.
export function HeroCardsBackdrop() {
  return (
    <div className="relative">
      {/* Fixed, viewport-pinned background photo. Same crop as the
          original Hero-only implementation — object-cover +
          object-bottom, unchanged — so Hero's composition is
          untouched. pointer-events-none so it can never intercept
          clicks/scroll anywhere on the page. -z-10 keeps it behind
          all normal document content regardless of DOM order. */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src="/hero/backgroundd.png"
          alt="Diorama warga binaan Lapas Perempuan Kelas IIA Jakarta membuat dan menyiapkan produk batik dan kerajinan tangan"
          fill
          priority
          draggable={false}
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      {/* Hero: unchanged, transparent, sits on top of the fixed
          image. See hero-banner.tsx — its scrims are absolutely
          positioned INSIDE its own h-[100dvh] section, so they only
          ever affect the Hero's own box, never Cards or the
          transition zone below. */}
      <HeroBanner />

      {/* Cards: unchanged, transparent, scrolls up over the same
          fixed image — this is what makes Hero and Cards read as one
          continuous surface: there's only ever one photo, and it
          never moves or restarts. */}
      <CardsSection />

      {/* ── Image -> #B1A295 transition ──────────────────────────
          This div has an EXPLICIT height (not a percentage, not a
          viewport-relative guess about how tall Cards happens to be)
          so its gradient's 0%-100% stops map exactly onto its own
          rendered box — the 100% stop is guaranteed to be the literal
          bottom pixel of this element, not an approximation.
          The negative top margin pulls it upward so it overlaps the
          tail end of the Cards grid (this is what makes the fade
          "begin near the bottom of the Cards section" — it's a real
          layout overlap, not a z-index guess), while it stays in
          normal document flow, so its own bottom edge is exactly
          where the next section (Belanja per Kategori) begins — no
          gap, no ambiguity about when it "finishes."
          pointer-events-none so it never blocks the flip-card
          buttons in the area it overlaps. */}
      <div
        aria-hidden="true"
        className="pointer-events-none -mt-28 h-56 w-full sm:-mt-36 sm:h-72 lg:-mt-44 lg:h-96"
        style={{
          // Every stop is either fully transparent taupe (so the
          // photo shows through unchanged) or FULLY OPAQUE #B1A295
          // (alpha 1, or the bare hex — never a partial alpha at the
          // stops meant to read as "solid"). By 78% the color is
          // already fully opaque, so there's a real solid band at
          // the bottom, not just a single mathematically-perfect
          // point at exactly 100% that a resize/rounding error could
          // undercut.
          background:
            "linear-gradient(to bottom, rgba(177,162,149,0) 0%, rgba(177,162,149,0.45) 35%, rgba(177,162,149,0.85) 60%, #B1A295 78%, #B1A295 100%)",
        }}
      />
    </div>
  );
}

// ── ABOUT THE "STILL LOOKS WHITE/CREAM" REPORT ─────────────────────
// The gradient above ends in a solid, fully-opaque #B1A295 band, not
// an approximation — there is no white, no reduced opacity, no
// leftover transparency at its tail. I don't have the "Belanja per
// Kategori" file, but this is the most likely explanation for what
// you're seeing: that section (and this codebase's original
// cards-section.tsx used bg-[#F8F5F1], a cream/off-white, in the same
// spot) is very likely still on its OWN previous background — e.g.
// bg-cloud or bg-[#F8F5F1] — rather than bg-[#B1A295]. My gradient
// correctly hands off to solid taupe, but the very next section then
// immediately overrides it with its own (still light) background,
// which reads exactly as "the fade looks like it ends in white/cream."
// Please check that section's root element for its background class
// and set it explicitly to `bg-[#B1A295]` — if you share that file I
// can make the edit directly and confirm the boundary matches exactly.
