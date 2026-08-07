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
// The background photo uses `position: fixed; inset: 0`, sized against
// the viewport rather than an auto-height parent (a `fill` image inside
// a `position: relative` div with auto height has an ambiguous
// percentage-height containing block and can render 0-height in some
// engines). It stays pinned as the page scrolls through Hero and Cards,
// so there is only ever one unmoving photo.
//
// DEPENDENCY: `position: fixed` resolves against the nearest ancestor
// with a `transform`, `filter`, `perspective`, or `will-change:
// transform` — or the viewport if there is none. If this component is
// ever rendered inside a layout wrapper that sets one of those
// properties (common with page-transition libraries), the image stops
// being viewport-pinned.
export function HeroCardsBackdrop() {
  return (
    <div className="relative">
      {/* Fixed, viewport-pinned background photo (object-cover +
          object-bottom). pointer-events-none so it can never intercept
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

      {/* Hero: transparent, sits on top of the fixed image. See
          hero-banner.tsx — its scrims are absolutely positioned INSIDE
          its own h-[100dvh] section, so they only ever affect the
          Hero's own box, never Cards or the transition zone below. */}
      <HeroBanner />

      {/* Cards: transparent, scrolls up over the same fixed image —
          this is what makes Hero and Cards read as one continuous
          surface. */}
      <CardsSection />

      {/* Image -> #B1A295 transition. This div has an EXPLICIT height
          (not a percentage or viewport-relative guess) so the
          gradient's 0%-100% stops map exactly onto its own rendered
          box. The negative top margin pulls it upward to overlap the
          tail end of the Cards grid, while it stays in normal
          document flow so its bottom edge lines up with the next
          section. pointer-events-none so it never blocks the
          flip-card buttons in the area it overlaps. */}
      <div
        aria-hidden="true"
        className="pointer-events-none -mt-28 h-56 w-full sm:-mt-36 sm:h-72 lg:-mt-44 lg:h-96"
        style={{
          // Stops are either fully transparent or fully opaque
          // #B1A295 — no partial alpha at the "solid" stops. By 78%
          // the color is already fully opaque, giving a real solid
          // band at the bottom rather than a single exact point at
          // 100% that a rounding error could undercut.
          background:
            "linear-gradient(to bottom, rgba(177,162,149,0) 0%, rgba(177,162,149,0.45) 35%, rgba(177,162,149,0.85) 60%, #B1A295 78%, #B1A295 100%)",
        }}
      />
    </div>
  );
}

// NOTE: the gradient above ends in a solid, fully-opaque #B1A295 band.
// If the section immediately after this component (Belanja per
// Kategori) still uses a light background like bg-cloud or
// bg-[#F8F5F1], the transition will read as ending in white/cream —
// its root element needs bg-[#B1A295] to match.
