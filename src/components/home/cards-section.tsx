"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, FlipHorizontal } from "lucide-react";
import { motion, type PanInfo } from "framer-motion";

import { Container } from "@/components/home/container";

// ---------------------------------------------------------------------------
// Layered Showcase Carousel: all three cards are always visible at once.
// The active card is centered, full size, fully opaque, sharp, and sits
// at the highest z-index with the strongest shadow. The previous/next
// cards sit partially behind it — offset outside its left/right edge,
// scaled down, faded, and softly blurred — so ~30-40% of each side card
// always stays visible. No card is ever rotated or tilted. Uses
// `framer-motion` for the spring-based transform/scale/opacity animation
// between the three slots, so it reads as rotating a display stand
// rather than swiping a slider.
// ---------------------------------------------------------------------------

type GridCard = {
  id: number;
  label: string;
  gradient: string;
  ring: string;
  textTone: "dark" | "light";
  front: ReactNode;
  back: ReactNode;
};

// Solid fallback (paints instantly, before the gradient layers below are
// parsed/painted, and backs up any pixel the radial ellipse doesn't
// reach) — the palette's own mid taupe.
const CARDS_SECTION_BASE_COLOR = "#B09F90";

// Two stacked layers:
//  1. A short top-only fade starting at rgba(177,162,149,0.32) — exactly
//     the color HeroBanner's own bottom fade ends at — dissolving to
//     fully transparent by 24% of the section's height, so the seam
//     where HeroBanner hands off into this section stays invisible
//     before the section's own radial atmosphere takes over.
//  2. The section's actual background: an ellipse radial gradient
//     anchored top-left (20%, 0%), sweeping through the palette's three
//     warm neutrals (light beige -> warm beige -> taupe).
// This whole value is applied on an absolutely-positioned `inset-0`
// child of the section (see the JSX below) rather than as a `fixed`
// layer or with viewport (`vw`/`vh`) units — that's the root-cause fix
// for the browser-zoom bug: an `inset: 0` layer's size is entirely
// derived from its parent's box, so it resizes/repositions in lockstep
// with the section at every zoom level, exactly like the text and cards
// already do.
const CARDS_SECTION_BACKGROUND =
  "linear-gradient(to bottom, rgba(177,162,149,0.32) 0%, rgba(177,162,149,0.08) 14%, rgba(177,162,149,0) 24%), radial-gradient(ellipse 80% 60% at 20% 0%, rgba(208,196,184,0.95) 0%, rgba(196,182,168,0.85) 45%, rgba(176,159,144,0.95) 100%)";

function CardShell({
  eyebrow,
  footer,
  tone,
  children,
}: {
  eyebrow: string;
  footer: ReactNode;
  tone: "dark" | "light";
  children: ReactNode;
}) {
  const eyebrowTone = tone === "light" ? "text-paper/55" : "text-ink/55";
  const dividerTone = tone === "light" ? "bg-paper/25" : "bg-ink/20";
  const footerTone = tone === "light" ? "text-paper/50" : "text-ink/45";
  const hintTone = tone === "light" ? "text-paper" : "text-ink";

  return (
    <div className="flex h-full w-full flex-col p-5 sm:p-7 lg:p-8">
      <span
        className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] ${eyebrowTone}`}
      >
        {eyebrow}
      </span>

      <div className="flex flex-1 flex-col justify-center gap-4 py-2">
        {children}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className={`h-px w-8 shrink-0 ${dividerTone}`} />
          <span
            className={`truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${footerTone}`}
          >
            {footer}
          </span>
        </div>

        <div
          aria-hidden="true"
          className={`flex shrink-0 items-center gap-1.5 text-[11px] font-medium opacity-50 transition-opacity duration-300 group-hover:opacity-100 ${hintTone}`}
        >
          <FlipHorizontal className="h-3 w-3" strokeWidth={1.75} />
          <span className="hidden sm:inline">Click to flip</span>
          <span className="sm:hidden">Tap to flip</span>
        </div>
      </div>
    </div>
  );
}

// Warm translucent glass surface, shared by every card face. Painted as
// the TOP background layer with each card's own `gradient` underneath it
// (see FlipCard) — the glass layer's opacity (0.78/0.72/0.68) lets that
// underlying color family show through, tinted warm, so card 2's dark
// espresso face stays legibly dark under the glass instead of flattening
// to the same tone as cards 1 and 3.
const GLASS_CARD_BACKGROUND =
  "linear-gradient(135deg, rgba(196,182,168,0.78) 0%, rgba(176,159,144,0.72) 55%, rgba(132,115,97,0.68) 100%)";
const GLASS_CARD_BORDER = "1px solid rgba(255,248,240,0.28)";
const GLASS_CARD_SHADOW =
  "0 12px 40px rgba(31,23,14,0.14), inset 0 1px 0 rgba(255,248,240,0.12)";
const GLASS_CARD_BLUR = "blur(14px)";

const FLIP_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const CARDS: GridCard[] = [
  {
    id: 1,
    label: "Tugas dan Fungsi",
    gradient: "linear-gradient(145deg, #efe3d8 0%, #d9c4ae 55%, #a9843f 100%)",
    ring: "ring-ink/5",
    textTone: "dark",
    front: (
      <CardShell eyebrow="Tugas dan Fungsi" footer="01 — Seksi Kegiatan Kerja" tone="dark">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink/50">
          Seksi
        </span>
        <h2 className="max-w-[14ch] text-balance font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.75rem] lg:text-5xl">
          Kegiatan Kerja
        </h2>
        <p className="max-w-[26ch] text-balance text-sm leading-relaxed text-ink/60 sm:text-base">
          Unit pelaksana pembinaan kerja bagi warga binaan.
        </p>
      </CardShell>
    ),
    back: (
      <CardShell eyebrow="Landasan Hukum" footer="Seksi Kegiatan Kerja" tone="dark">
        <p className="max-w-[22ch] text-balance font-serif text-xl font-medium leading-snug text-ink sm:text-2xl">
          Undang-Undang Nomor 22 Tahun 2022 tentang Pemasyarakatan
        </p>
        <p className="max-w-[26ch] text-balance text-sm leading-relaxed text-ink/60">
          Dasar hukum pembentukan dan tugas unit.
        </p>
      </CardShell>
    ),
  },
  {
    id: 2,
    label: "Pasal 38",
    gradient: "linear-gradient(160deg, #2c232a 0%, #17151a 100%)",
    ring: "ring-paper/10",
    textTone: "light",
    front: (
      <CardShell eyebrow="Pasal" footer="02 — Pasal 38 Huruf b" tone="light">
        <div className="flex flex-col gap-5">
          <span className="font-serif text-[80px] font-semibold leading-none text-paper sm:text-[106px]">
            38
          </span>
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-paper/60">
              Huruf b
            </span>
            <p className="text-[15px] font-medium leading-snug text-paper/80">
              UU No. 22 Tahun 2022
              <br />
              Tentang Pemasyarakatan
            </p>
          </div>
        </div>
      </CardShell>
    ),
    back: (
      <CardShell eyebrow="Pembinaan Kemandirian" footer="Pasal 38 Huruf b" tone="light">
        <p className="max-w-[32ch] text-balance font-serif text-lg leading-relaxed text-paper/90 sm:text-xl">
          Bentuk pembinaan kemandirian antara lain pelatihan keterampilan untuk
          mendukung usaha mandiri dan industri, pelatihan kerja, serta
          pengembangan minat dan bakat.
        </p>
      </CardShell>
    ),
  },
  {
    id: 3,
    label: "Pembinaan Kemandirian",
    gradient: "linear-gradient(145deg, #edf3e6 0%, #9db18d 50%, #4f6b46 100%)",
    ring: "ring-ink/5",
    textTone: "dark",
    front: (
      <CardShell eyebrow="Pembinaan Kemandirian" footer="03 — Pasal 38 Huruf b" tone="dark">
        <p className="max-w-[30ch] text-balance font-serif text-xl font-medium leading-relaxed text-ink sm:text-2xl">
          Pembinaan kemandirian sebagaimana dimaksud dalam Pasal 38 huruf b
          dapat ditingkatkan menjadi kegiatan menghasilkan barang dan jasa
          yang memiliki manfaat dan nilai tambah.
        </p>
      </CardShell>
    ),
    back: (
      <CardShell eyebrow="Lapas Perempuan" footer="Kemandirian Warga Binaan" tone="dark">
        <div className="flex flex-col gap-1">
          <span className="font-serif text-3xl font-semibold leading-[1.05] text-ink sm:text-4xl">
            Lapas Perempuan
          </span>
          <span className="font-serif text-3xl font-semibold italic leading-[1.05] text-ink/80 sm:text-4xl">
            Kelas IIA Jakarta
          </span>
        </div>
      </CardShell>
    ),
  },
];

function FlipCard({ card }: { card: GridCard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-label={`Tampilkan detail ${card.label}`}
      className="group relative aspect-[6/7] w-full text-left [perspective:1600px] [transform-style:preserve-3d] transition-transform duration-300 ease-out will-change-transform hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-none"
    >
      <div
        className="relative h-full w-full [transform-style:preserve-3d] will-change-transform"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: `transform 620ms ${FLIP_EASE}`,
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[32px] [backface-visibility:hidden]"
          style={{
            background: `${GLASS_CARD_BACKGROUND}, ${card.gradient}`,
            border: GLASS_CARD_BORDER,
            boxShadow: GLASS_CARD_SHADOW,
            backdropFilter: GLASS_CARD_BLUR,
            WebkitBackdropFilter: GLASS_CARD_BLUR,
          }}
        >
          {card.front}
        </div>
        {/* Back face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[32px] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            background: `${GLASS_CARD_BACKGROUND}, ${card.gradient}`,
            border: GLASS_CARD_BORDER,
            boxShadow: GLASS_CARD_SHADOW,
            backdropFilter: GLASS_CARD_BLUR,
            WebkitBackdropFilter: GLASS_CARD_BLUR,
          }}
        >
          {card.back}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Layered showcase carousel
// ---------------------------------------------------------------------------

type Breakpoint = "mobile" | "tablet" | "desktop";

// Per-breakpoint tuning for the two side slots. `offsetPercent` is
// resolved against each card's OWN (unscaled) box — standard CSS %
// semantics for translateX — so it scales naturally with the stage's
// responsive width, no pixel math needed. There are always exactly
// three cards, so a card is only ever in one of three slots: active
// (centered, full size) or one of the two side slots.
//
// The offset is deliberately larger than the side card's own "missing"
// width from scaling down, so a real slice of it — never fully covered
// by the active card — stays visible on every breakpoint. Roughly:
//   visible slice ≈ offsetPercent - (1 - scale) / 2
// Tuned so that slice lands around 30-40% at every breakpoint.
const LAYERED_CONFIG: Record<
  Breakpoint,
  {
    offsetPercent: number;
    scale: number;
    opacity: number;
    blur: number; // px
    liftY: number; // px — a whisper of vertical settle, cards stay upright
  }
> = {
  mobile: { offsetPercent: 34, scale: 0.82, opacity: 0.68, blur: 1.5, liftY: 4 },
  tablet: { offsetPercent: 36, scale: 0.85, opacity: 0.72, blur: 1.5, liftY: 6 },
  desktop: { offsetPercent: 38, scale: 0.86, opacity: 0.75, blur: 1.5, liftY: 8 },
};

// Matches the sm/lg breakpoints already used elsewhere in this file's
// Tailwind classes, so the JS-computed transforms line up with the CSS.
function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    const compute = () => {
      const width = window.innerWidth;
      setBreakpoint(width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop");
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return breakpoint;
}

// Drag distance / velocity needed to commit to a card change. Below this,
// the stage just springs back to center — a deliberate flick, not an
// accidental nudge, is what turns the showcase.
const DRAG_OFFSET_THRESHOLD = 80; // px
const DRAG_VELOCITY_THRESHOLD = 350; // px/s

// Spring tuned to settle in roughly the 500-700ms window the brief asks
// for. Worth noting honestly: a real spring doesn't have a fixed duration
// the way a tween does — this is the settle time this stiffness/damping
// pair produces for a typical slot-to-slot distance, not a hard
// guarantee. Every card's transform/opacity animates through this same
// spring, so previous->active, active->next, and next->previous all move
// in lockstep — no abrupt sliding, just a smooth, weighted rotation
// through the three layered positions.
const LAYERED_SPRING = { type: "spring" as const, stiffness: 240, damping: 30, mass: 0.9 };

export function CardsSection() {
  const total = CARDS.length;
  const breakpoint = useBreakpoint();
  const cfg = LAYERED_CONFIG[breakpoint];

  const [selectedIndex, setSelectedIndex] = useState(0);

  const goNext = useCallback(() => setSelectedIndex((i) => (i + 1) % total), [total]);
  const goPrev = useCallback(() => setSelectedIndex((i) => (i - 1 + total) % total), [total]);
  const goTo = useCallback((index: number) => setSelectedIndex(index % total), [total]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev],
  );

  // Framer Motion's drag gesture already disambiguates a real pan from a
  // tap, so a genuine swipe here doesn't accidentally trigger a card's own
  // click-to-flip — only a real (mostly-stationary) click does. And since
  // this only listens to pointer/touch drag (never `onWheel`), a normal
  // mouse wheel keeps scrolling the page vertically instead of getting
  // hijacked sideways.
  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      if (offset.x <= -DRAG_OFFSET_THRESHOLD || velocity.x <= -DRAG_VELOCITY_THRESHOLD) {
        goNext();
      } else if (offset.x >= DRAG_OFFSET_THRESHOLD || velocity.x >= DRAG_VELOCITY_THRESHOLD) {
        goPrev();
      }
    },
    [goNext, goPrev],
  );

  return (
    // `relative` + `overflow-hidden` makes this section the containing
    // block for the background layer below, so that layer's `inset-0`
    // resolves against THIS box — not the viewport — at every zoom
    // level. `backgroundColor` here is a plain, non-positioned fallback
    // fill (paints immediately, and backs up any pixel the ellipse
    // gradient doesn't reach); it carries no size/position info of its
    // own, so there's nothing about it that can drift out of sync when
    // the page is zoomed.
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: CARDS_SECTION_BASE_COLOR }}
    >
      {/* The actual atmosphere layer. `absolute inset-0` — NOT `fixed`,
          NOT sized with `vw`/`vh`, NOT a fixed pixel width/height — so
          its box is derived purely from the section's own rendered
          dimensions above. Browser zoom rescales the section (like any
          other block box) and this layer rescales/repositions with it
          in the same reflow, instead of staying pinned to the old
          viewport-relative frame. `pointer-events-none` + `aria-hidden`
          since it's purely decorative and must never intercept the
          carousel's drag/click handling underneath it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: CARDS_SECTION_BACKGROUND }}
      />

      {/* Compact, editorial rhythm — a showcase moment inside the page,
          not a second hero. Horizontal padding matches the rest of the
          page; vertical padding is generous but noticeably lighter than a
          hero section's. `relative z-10` keeps all real content painting
          above the background layer. */}
      <Container className="relative z-10 px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="relative">
          {/* Width-scoped wrapper: sized to the ACTIVE card only. The
              previous/next cards are absolutely positioned siblings that
              deliberately spill outside this box on either side — that
              overflow is the whole point of a layered showcase (they
              must stay visible, not get clipped into a hidden "next"
              slide). The hover arrows still hug this box's edges, i.e.
              the active card's edges, since that's the one they act on. */}
          <div className="group/showcase relative mx-auto w-[86%] max-w-[300px] sm:w-[52%] sm:max-w-[380px] lg:w-[46%] lg:max-w-[480px]">
            {/* The stage: fixed responsive width/aspect so the three
                absolutely-positioned card layers all share one exact box
                (inset-0) as their shared reference frame, and their
                apparent position/size/depth comes entirely from each
                layer's own transform. Deliberately NOT overflow-hidden —
                a layered showcase needs the side cards to actually
                extend past the active card's box and stay visible,
                rather than being clipped into a hidden "viewport". */}
            <div
              role="region"
              aria-roledescription="carousel"
              aria-label="Tugas, dasar hukum, dan pembinaan kemandirian"
              tabIndex={0}
              onKeyDown={onKeyDown}
              className="relative w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
            >
              <motion.div
                className="relative aspect-[6/7] w-full cursor-grab touch-pan-y active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.55}
                onDragEnd={onDragEnd}
              >
                {CARDS.map((card, i) => {
                  // Signed shortest-path distance from the active card:
                  // 0 = active/center, -1 = previous/left slot, +1 =
                  // next/right slot. With exactly three cards this always
                  // resolves to one of those three values — every card is
                  // always in one of the three slots, always visible,
                  // never fully hidden off-stage.
                  let rel = (i - selectedIndex + total) % total;
                  if (rel > total / 2) rel -= total;

                  const isActive = rel === 0;

                  // Active: centered, full scale, fully opaque, crisp,
                  // strongest shadow, highest z-index, sitting slightly
                  // "closer" to the viewer (a small negative y lift).
                  // Previous/next: pushed to their side by offsetPercent
                  // (enough that a real slice — never the whole side
                  // card — stays uncovered by the active card), scaled
                  // and faded down, gently blurred, and settled a touch
                  // lower/back. Nothing is ever rotated or tilted; every
                  // card stays perfectly upright in all three slots. On
                  // navigation, each card just animates from its current
                  // slot's values to its new slot's values through the
                  // same spring — previous becomes active, active becomes
                  // next (or previous), next becomes active — reading as
                  // one continuous rotation rather than a slide.
                  const x = `${rel * cfg.offsetPercent}%`;
                  const y = isActive ? -6 : cfg.liftY;
                  const scale = isActive ? 1 : cfg.scale;
                  const opacity = isActive ? 1 : cfg.opacity;
                  const zIndex = isActive ? 30 : 20 - Math.abs(rel);

                  // Depth reads through scale + opacity + blur + shadow
                  // together — strong soft shadow up front, only a
                  // minimal one on the side cards — never through
                  // rotation or perspective tricks, keeping it subtle
                  // rather than an exaggerated 3D effect.
                  // Mobile-only guard: animating `filter: blur()` on a side
                  // card here shares a compositing pass with the active
                  // card (both live inside FlipCard's own
                  // [transform-style:preserve-3d] / [backface-visibility:
                  // hidden] stack), and mobile WebKit merges that pass —
                  // leaving the ACTIVE card permanently soft after a swipe,
                  // even though the active card itself never has a blur
                  // value. Same issue as hero-card-carousel.tsx (see its
                  // TRANSITION comment). Desktop/tablet keep the blur()
                  // depth cue; on mobile it's omitted from the filter
                  // string (scale + opacity + the smaller drop-shadow
                  // still carry the depth cue there).
                  const filter = isActive
                    ? "drop-shadow(0 18px 36px rgba(23,17,10,0.32))"
                    : breakpoint === "mobile"
                      ? "drop-shadow(0 8px 18px rgba(23,17,10,0.14))"
                      : `blur(${cfg.blur}px) drop-shadow(0 8px 18px rgba(23,17,10,0.14))`;

                  return (
                    <motion.div
                      key={card.id}
                      className="absolute inset-0"
                      style={{ zIndex, pointerEvents: isActive ? "auto" : "none" }}
                      animate={{ x, y, scale, opacity, filter }}
                      transition={LAYERED_SPRING}
                    >
                      <FlipCard card={card} />
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Small, subtle hover-reveal arrows — desktop only. Positioned
                at left-2/right-2 by default (mobile/tablet; irrelevant
                since `hidden` applies there), but overridden at `lg` to sit
                further outward (-left-14/-right-14), clearing the active
                card's own edge/padding entirely so they never sit over its
                text. Hidden entirely on touch/tablet, where drag/swipe is
                primary. */}
            <button
              type="button"
              onClick={goPrev}
              aria-label="Kartu sebelumnya"
              className="absolute left-2 top-1/2 z-40 hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-paper/70 p-2 text-ink opacity-0 shadow-[0_6px_18px_-6px_rgba(23,17,10,0.25)] backdrop-blur-sm transition-all duration-300 ease-out hover:bg-paper/90 lg:-left-14 lg:flex lg:group-hover/showcase:opacity-100"
            >
              <ChevronLeft className="h-3 w-3" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Kartu berikutnya"
              className="absolute right-2 top-1/2 z-40 hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-paper/70 p-2 text-ink opacity-0 shadow-[0_6px_18px_-6px_rgba(23,17,10,0.25)] backdrop-blur-sm transition-all duration-300 ease-out hover:bg-paper/90 lg:-right-14 lg:flex lg:group-hover/showcase:opacity-100"
            >
              <ChevronRight className="h-3 w-3" strokeWidth={2} />
            </button>
          </div>

          {/* Screen-reader announcement of the active card, since the
              visual showcase alone doesn't convey position/count the way a
              row of slides would. */}
          <span className="sr-only" aria-live="polite">
            {`Kartu ${selectedIndex + 1} dari ${total}: ${CARDS[selectedIndex].label}`}
          </span>

          {/* Pagination — thin pill indicators: wide + filled = active,
              slim + dim = inactive. Spacing tightened to match the more
              compact stage. */}
          <div className="mt-6 flex items-center justify-center gap-2 sm:mt-7 lg:mt-8">
            {CARDS.map((card, index) => {
              const isActive = index === selectedIndex;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ke kartu ${index + 1}`}
                  aria-current={isActive}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                    isActive ? "w-8 bg-ink" : "w-1.5 bg-ink/25 hover:bg-ink/45"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
