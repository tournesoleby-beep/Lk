import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/home/container";

// TWO wallpapers, one composition-shape swap, still ONE hero: full-bleed
// photo as the section background, dark scrim, copy overlaid — nothing
// stacked, nothing split into two columns, at any width.
//
// Below `lg` this now uses a DIFFERENT source photo (`hero-mobile.png`)
// shot/composed with the four subjects pushed into the bottom-right
// corner, leaving a clean blank wall across the top-left — because the
// original landscape photo's subjects run the full right ~65% of the
// frame top-to-bottom, there was no way to crop *that* photo down to a
// tall mobile viewport without either covering the subjects with text or
// shrinking the text into a sliver. Swapping the source photo instead of
// fighting the crop:
//   - mobile/tablet (`<lg`): `hero-mobile.png`, subjects bottom-right,
//     copy pinned to the top-left where the wall is, `items-start`.
//   - `lg`+: exactly the original `backgroundd.png` + `object-bottom` +
//     vertically centered copy — untouched, byte-for-byte the same
//     classes as before this change.
// Both `<Image>`s live in the DOM at once (`hidden`/`lg:hidden` swap,
// not a conditional) so there's no layout-shift/hydration flash at the
// `lg` breakpoint.
export function HeroBanner() {
  return (
    // `h-[100dvh]` (dynamic viewport height, not `100svh`/`100vh`) keeps
    // the section exactly one viewport tall at every breakpoint,
    // including on mobile browsers whose chrome shows/hides as you
    // scroll — no min-height, so nothing can render taller than the
    // actual viewport and let the page's white background peek through
    // below the fold.
    // `items-start` (mobile/tablet) vs `lg:items-center` follows the
    // photo swap above: the mobile photo's blank space is a top-left
    // block, not a full-height column, so the copy anchors to the top
    // instead of the vertical middle. `lg:` reverts to the original
    // vertically-centered behavior.
    // The bottom `after:` fade hands off into <CardsSection>'s
    // background gradient: it starts fully transparent and ends at the
    // same translucent taupe (rgba(177,162,149,0.32)) that gradient
    // picks up at, so the seam between the two sections is invisible.
    // `after:z-[5]` keeps it below the content wrapper (`z-10` on
    // Container below), so it can only ever fade the image/scrims, never
    // the copy or CTAs.
    <section className="relative isolate flex h-[100dvh] w-full items-start overflow-hidden bg-ink after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-[5] after:h-28 after:content-[''] sm:after:h-36 lg:items-center lg:after:h-44 after:[background:linear-gradient(to_bottom,rgba(177,162,149,0)_0%,rgba(177,162,149,0.12)_55%,rgba(177,162,149,0.22)_82%,rgba(177,162,149,0.32)_100%)]">
      {/* MOBILE/TABLET background — hidden at `lg`+. Composed with the
          subjects bottom-right and blank wall top-left, so it's shown at
          its natural full height on true phone-shaped viewports (cover
          is width-constrained there, i.e. it crops left/right, not
          top/bottom — the whole vertical story from wall to subjects
          stays visible, `y` has no effect). On shorter/wider viewports
          (short browser windows, tablets in landscape) cover instead
          becomes height-constrained and crops top/bottom — that's what
          `object-[38%_top]` is for: anchoring to the TOP so the crop
          comes off the BOTTOM (the floor/base area below the subjects,
          which has room to spare) instead of off the top (the blank
          wall the copy needs). `_bottom` did the opposite — it kept the
          subjects' feet/base fully in frame at the cost of eating into
          the blank space above them, which is what was pushing the
          whole composition down and starving the copy of room.
          `object-[38%_top]` keeps the four dolls comfortably in frame
          either way — the crop margin only ever reaches the empty floor
          below them, well clear of their torsos/heads — while now also
          preserving the top blank space. `38%` (the x-bias, keeping the
          dolls in frame on true phones) is unchanged. */}
      <Image
        src="/hero/background-mobile.png"
        alt="Diorama warga binaan Lapas Perempuan Kelas IIA Jakarta membuat dan menyiapkan produk batik dan kerajinan tangan"
        fill
        priority
        draggable={false}
        sizes="100vw"
        className="pointer-events-none select-none object-cover object-[38%_top] lg:hidden"
      />
      {/* DESKTOP background — hidden below `lg`. Unchanged from before:
          same file, same `object-bottom`, no scale/zoom adjustment. */}
      <Image
        src="/hero/backgroundd.png"
        alt="Diorama warga binaan Lapas Perempuan Kelas IIA Jakarta membuat dan menyiapkan produk batik dan kerajinan tangan"
        fill
        priority
        draggable={false}
        sizes="100vw"
        className="pointer-events-none hidden select-none object-cover object-bottom lg:block"
      />

      {/* MOBILE/TABLET scrim — hidden at `lg`+. The new photo's blank
          space is a top-left block, not a full-height left column, so
          this darkens a matching top-left region (strongest at the
          corner, fading out before it reaches the subjects) instead of
          a left-to-right band running the full height. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background:
            "radial-gradient(ellipse 100% 65% at 0% 0%, rgba(10,8,6,0.8) 0%, rgba(10,8,6,0.55) 30%, rgba(10,8,6,0.22) 55%, rgba(10,8,6,0) 75%)",
        }}
      />
      {/* DESKTOP scrims — hidden below `lg`. Unchanged from before: the
          same left-to-right band plus the gentle bottom fade for the
          CTA row. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,8,6,0.78) 0%, rgba(10,8,6,0.55) 28%, rgba(10,8,6,0.22) 52%, rgba(10,8,6,0) 72%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-1/3 lg:block"
        style={{
          background: "linear-gradient(180deg, rgba(10,8,6,0) 0%, rgba(10,8,6,0.35) 100%)",
        }}
      />

      {/* Copy column: overlaid on the LEFT at every breakpoint — never
          stacked below the image, never split into its own half. `z-10`
          keeps it painting above the bottom fade (`after:z-[5]` on the
          section) so it stays legible no matter how that fade blends
          into the photo behind it.
          `pt-[4dvh] sm:pt-[6dvh] lg:pt-0` pulls the block up into the
          top of the blank space (was `9dvh`/`8dvh` — sitting too low)
          now that the section is `items-start` instead of vertically
          centered below `lg` — `lg:pt-0` combined with `lg:items-center`
          above reproduces the original centered placement exactly.
          Sizing/gap starts smaller on mobile (`text-3xl`, tighter gaps)
          and steps up through `sm:`/`md:`, arriving at the same
          `sm:text-6xl md:text-[4.25rem]` etc. values the desktop design
          already had — so `lg:` and up render identically to before. */}
      <Container className="relative z-10 w-full px-5 pt-[4dvh] sm:px-6 sm:pt-[6dvh] lg:pt-0">
        {/* `w-[62%] max-w-[220px]` (was `82%`/`300px`) is both the
            "smaller" and the "pushed toward the left" fix in one: a
            narrower hard cap on the column below `sm:` keeps every line
            — including the paragraph, previously the widest element —
            well clear of the bottom-right subjects instead of stretching
            toward the middle of the photo. At `sm:` and up this reverts
            to `w-full sm:max-w-xl`, i.e. exactly the original,
            unconstrained-by-percentage behavior, so `lg:` renders
            byte-for-byte as before. */}
        <div className="animate-fade-up flex w-[62%] max-w-[220px] flex-col gap-2 sm:w-full sm:max-w-xl sm:gap-3.5 lg:gap-7">
          <span className="font-mono text-[8px] font-medium uppercase leading-tight tracking-[0.1em] text-signal sm:text-[11px] sm:tracking-[0.2em]">
            Lapas Perempuan Kelas IIA Jakarta
          </span>
          <h1 className="max-w-xl text-balance font-serif text-2xl font-semibold leading-[1] tracking-tight text-paper sm:text-6xl sm:leading-[0.95] md:text-[4.25rem]">
            Mengenal,
            <br />
            Lapiita Karya
          </h1>
          <p className="max-w-[460px] text-balance text-[11px] leading-snug text-paper/75 sm:text-lg sm:leading-relaxed">
            Tempat Latihan Kerja bagi warga binaan di Lapas Perempuan Kelas
            IIA Jakarta yang menghasilkan berbagai kerajinan tangan, batik,
            dan produk hasil pertanian berkualitas sebagai wujud pembinaan,
            keterampilan, dan kemandirian.
          </p>

          <div
            className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:pt-3 md:pt-4 lg:pt-2 [animation-delay:150ms]"
            style={{ animation: "var(--animate-fade-up)" }}
          >
            <Link
              href="/shop"
              className="group inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full bg-paper px-4 py-2.5 text-[11px] font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.16),0_10px_24px_-8px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_2px_4px_rgba(0,0,0,0.18),0_18px_36px_-10px_rgba(0,0,0,0.5)] active:translate-y-0 active:scale-[0.98] sm:min-h-11 sm:w-auto sm:gap-2 sm:px-7 sm:py-3.5 sm:text-sm"
            >
              Jelajahi Produk
              <ArrowRight
                className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-4 sm:w-4"
                strokeWidth={2}
              />
            </Link>
            <a
              href="#new-arrivals"
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full border border-paper/30 bg-white/5 px-4 py-2 text-[11px] font-medium text-paper backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-paper/50 hover:bg-white/10 active:translate-y-0 active:scale-[0.98] sm:min-h-11 sm:w-auto sm:gap-2 sm:px-7 sm:py-3.5 sm:text-sm"
            >
              Tentang Kami
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
