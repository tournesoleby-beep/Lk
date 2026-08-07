"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import Image from "next/image";
import { FlipHorizontal } from "lucide-react";

// This project has no src/assets folder — hero images live in
// public/hero/ (see the existing public/hero/lapiita-mascot.png).
// Following that convention: place this PNG at
//   public/hero/animated-imi.png
// and reference it below as the string path "/hero/animated-imi.png"
// (the leading "/" maps to the public/ root at runtime — no import
// needed, and no build-time check that the file exists, so double
// check the filename matches exactly once you add it).

// A single large featured card that auto-rotates through three slides.
// One shared component used on mobile and desktop — no positioning/
// z-index/transform bookkeeping, just React state + CSS transitions.
// Easy to extend: add another entry to SLIDES and it's picked up
// everywhere (autoplay, dots, arrows, swipe).
//
// Each slide face is built from <CardShell>, an editorial three-zone
// layout (eyebrow / centered content / footer) so every card reads as
// a composed poster instead of text dropped in a colored rectangle.

type Slide = {
  id: number;
  label: string;
  gradient: string;
  ring: string;
  // Optional override for CARD_SURFACE_SHADOW below — every other
  // slide shares that one constant, but the diorama card (id 0) needs
  // its own softer, warmer-tinted shadow spec to match its stone-toned
  // background, so it opts out here rather than changing the shared
  // default for all four cards.
  shadow?: string;
  textTone: "dark" | "light";
  front: ReactNode;
  back: ReactNode;
};

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
        className={`font-mono text-[10px] font-medium uppercase tracking-[0.16em] ${eyebrowTone}`}
      >
        {eyebrow}
      </span>

      <div className="flex flex-1 flex-col justify-center gap-3.5 py-2">
        {children}
      </div>

      {/* Footer row: card metadata on the left, a quiet "this card
          flips" hint on the right. Sharing one row (rather than an
          absolutely-positioned overlay) guarantees the hint can never
          drift over the heading/paragraph above it, however long the
          footer label runs. */}
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

// Shared hairline-ring tokens so all four cards read as one system
// instead of four separately-tuned borders: a warm umber tint for the
// three light (ivory/sand/olive) cards, and a soft warm-paper tint for
// the one dark (espresso) card — same family, just inverted for
// contrast, rather than the old "generic ink/paper opacity" rings that
// didn't relate to the palette at all.
const CARD_RING_LIGHT = "ring-[rgba(148,122,87,0.12)]";
const CARD_RING_DARK = "ring-[rgba(214,187,145,0.14)]";

const SLIDES: Slide[] = [
  {
    id: 0,
    label: "Selamat Datang",
    // Layered "museum card" background — two soft radial highlights
    // (a white lift top-left, a warm tint top-right) sit over a
    // three-stop ivory -> sand -> beige vertical gradient, in the same
    // warm-stone family as the photo's own studio background, so the
    // letterboxed space around it (photo is landscape, card is
    // portrait) still reads as one continuous surface rather than a
    // picture dropped onto a differently-toned card.
    gradient:
      "radial-gradient(circle at 25% 18%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 32%), radial-gradient(circle at 82% 12%, rgba(214,190,150,0.18) 0%, rgba(214,190,150,0) 42%), linear-gradient(180deg, #F6F1E8 0%, #F2EBE0 48%, #EEE4D6 100%)",
    // Hairline border — same warm-umber ring token the other three
    // cards use (this one just got there first, before the shared
    // constant existed).
    ring: CARD_RING_LIGHT,
    // Softer, warmer-tinted shadow than the shared CARD_SURFACE_SHADOW
    // below — same three-part structure (near/far/inner-highlight) but
    // tuned to this card's stone tones instead of the near-black tint
    // used everywhere else, per the "museum display" brief.
    shadow:
      "shadow-[0_30px_70px_rgba(98,77,46,0.10),0_10px_24px_rgba(98,77,46,0.05),inset_0_1px_0_rgba(255,255,255,0.55)]",
    textTone: "dark",
    front: (
      <>
        {/* Card-level ambient lighting, sitting behind everything else
            on the face (z-0, painted below the z-10 content wrapper):
            a warm glow bleeding in from the top-right corner... */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[90px] -top-20 z-0 h-[420px] w-[420px] rounded-full blur-[36px]"
          style={{
            background:
              "radial-gradient(circle, rgba(214,187,145,0.22) 0%, rgba(214,187,145,0.08) 45%, transparent 72%)",
          }}
        />
        {/* ...and a softer white ambient glow lifting the bottom-left
            corner, so the card reads as gallery-lit rather than flat. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[120px] -left-[120px] z-0 h-[340px] w-[340px] rounded-full blur-[50px]"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 h-full w-full">
          <CardShell eyebrow="Selamat Datang" footer="Lapas Perempuan Kelas IIA Jakarta" tone="dark">
            {/* Photographed diorama. Source is a plain rectangular photo
                with its own warm stone background already baked in —
                nothing to key out or crop, shown at its full, uncropped
                1535:1024 aspect ratio. The negative margins below pull it
                past CardShell's own p-5/p-7/p-8 padding so the photo reads
                as close to full-bleed (the card itself "displaying" the
                miniature) rather than a picture sitting inside a frame,
                while still leaving a small margin — full edge-to-edge would
                fight the corner radius and the flip-hint footer row. */}
            <div className="relative -mx-3 flex h-full w-[calc(100%+1.5rem)] flex-col items-center justify-center gap-2 sm:-mx-4 sm:w-[calc(100%+2rem)] lg:-mx-5 lg:w-[calc(100%+2.5rem)]">
              <div className="relative w-full">
                {/* Warm spotlight directly behind the image, larger and
                    softer than the vignette below — this is what makes
                    the diorama feel set into the card rather than a
                    rectangle floating on top of it. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-7 z-0 blur-xl"
                  style={{
                    background:
                      "radial-gradient(ellipse, rgba(214,187,145,0.26) 0%, rgba(214,187,145,0.10) 45%, transparent 78%)",
                  }}
                />
                <Image
                  src="/hero/diorama.png"
                  alt="Diorama warga binaan Lapas Perempuan Kelas IIA Jakarta membuat dan menyiapkan produk batik dan kerajinan tangan"
                  width={1535}
                  height={1024}
                  sizes="(min-width: 1024px) 32rem, (min-width: 640px) 27rem, 22rem"
                  className="relative z-10 h-auto w-full rounded-[16px]"
                  priority
                />
                {/* Edge vignette, tuned to the card's own background
                    (230,217,199 = #E6D9C7) rather than a generic tone, at
                    the 3-5% opacity the brief calls for — enough to melt
                    the photo's rectangular edges into the surface, not
                    enough to be consciously visible. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-20 rounded-[16px]"
                  style={{
                    boxShadow:
                      "inset 0 0 2px rgba(65,45,25,0.03), inset 0 0 48px 10px rgba(230,217,199,0.05)",
                  }}
                />
              </div>
              {/* Grounding shadow: pinned under the photographed platform
                  only (not the full image width), sitting in the card's
                  own background just below the photo rather than on top of
                  it — this is what visually anchors the diorama to the
                  card instead of letting it read as a picture resting on
                  top of a separate surface. */}
              <div
                aria-hidden="true"
                className="pointer-events-none relative -mt-3 h-7 w-[70%]"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.05) 35%, transparent 70%)",
                  filter: "blur(7px)",
                }}
              />
            </div>
          </CardShell>
        </div>
      </>
    ),
    back: (
      <>
        {/* Same card-level ambient lighting as the front face, so the
            background reads consistently through the flip. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[90px] -top-20 z-0 h-[420px] w-[420px] rounded-full blur-[36px]"
          style={{
            background:
              "radial-gradient(circle, rgba(214,187,145,0.22) 0%, rgba(214,187,145,0.08) 45%, transparent 72%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[120px] -left-[120px] z-0 h-[340px] w-[340px] rounded-full blur-[50px]"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 72%)",
          }}
        />
        <div className="relative z-10 h-full w-full">
          <CardShell eyebrow="Tentang Kami" footer="Selamat Datang" tone="dark">
            <p className="max-w-[24ch] text-balance font-serif text-xl font-medium leading-snug text-ink sm:text-2xl">
              Lapiita Karya
            </p>
            <p className="max-w-[26ch] text-balance text-[13px] leading-relaxed text-ink/60 sm:text-sm">
              Wujud pembinaan, keterampilan, dan kemandirian warga binaan.
            </p>
          </CardShell>
        </div>
      </>
    ),
  },
  {
    id: 1,
    label: "Tugas dan Fungsi",
    // Same construction as card 0's ivory base — a warm three-stop
    // ivory->sand vertical gradient with one soft corner accent — using
    // the hero section's own taupe (rgba(177,162,149,...), the tone
    // its bottom fade settles into) as the accent color instead of a
    // separate sand/gold palette. The card is still ~90% the same
    // ivory as its neighbors; only the top-right corner carries this
    // slide's identifying warmth, so it reads as "the same material,
    // lightly tinted" rather than a distinct colored panel.
    gradient:
      "radial-gradient(circle at 84% 14%, rgba(177,162,149,0.26) 0%, rgba(177,162,149,0) 46%), linear-gradient(180deg, #F6F1E8 0%, #F1E9DC 55%, #E4D8C4 100%)",
    ring: CARD_RING_LIGHT,
    textTone: "dark",
    front: (
      <CardShell eyebrow="Tugas dan Fungsi" footer="01 — Seksi Kegiatan Kerja" tone="dark">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink/50">
          Seksi
        </span>
        <h2 className="max-w-[14ch] text-balance font-serif text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
          Kegiatan Kerja
        </h2>
        <p className="max-w-[26ch] text-balance text-[13px] leading-relaxed text-ink/60 sm:text-sm">
          Unit pelaksana pembinaan kerja bagi warga binaan.
        </p>
      </CardShell>
    ),
    back: (
      <CardShell eyebrow="Landasan Hukum" footer="Seksi Kegiatan Kerja" tone="dark">
        <p className="max-w-[22ch] text-balance font-serif text-lg font-medium leading-snug text-ink sm:text-xl">
          Undang-Undang Nomor 22 Tahun 2022 tentang Pemasyarakatan
        </p>
        <p className="max-w-[26ch] text-balance text-[13px] leading-relaxed text-ink/60">
          Dasar hukum pembentukan dan tugas unit.
        </p>
      </CardShell>
    ),
  },
  {
    id: 2,
    label: "Pasal 38",
    // Warm espresso/brown (was a purple-tinted near-black, #2c232a —
    // off-family next to the ivory/sand/olive cards around it). Same
    // dark-roast tone the shared CARD_SURFACE_SHADOW is already tinted
    // toward, so this card's shadow and the others' don't feel like two
    // different palettes.
    gradient: "linear-gradient(160deg, #3B2A20 0%, #241811 100%)",
    ring: CARD_RING_DARK,
    textTone: "light",
    front: (
      <>
        {/* One quiet warm spotlight behind "38" — the museum-panel cue
            that ties this card back to card 0's gallery lighting,
            without stacking on the extra ambient glows a flat dark
            surface doesn't need. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-24 z-0 h-[320px] w-[320px] rounded-full blur-[60px]"
          style={{
            background: "radial-gradient(circle, rgba(214,187,145,0.16) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 h-full w-full">
          <CardShell eyebrow="Pasal" footer="02 — Pasal 38 Huruf b" tone="light">
            {/* Hierarchy: the eye travels 38 -> Huruf b -> the legal
                citation -> the flip hint, instead of stopping dead at
                one giant number with a copyright-sized line at the very
                bottom. The citation moved out of the footer (which now
                just carries the short "02 — Pasal 38 Huruf b" label,
                matching the numbering pattern the other three cards
                use) and into the body — legible as real content, not
                footer-sized fine print. */}
            <div className="flex flex-col gap-4">
              <span className="font-serif text-[64px] font-semibold leading-none text-paper sm:text-[84px]">
                38
              </span>
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-paper/60">
                  Huruf b
                </span>
                <p className="text-[14px] font-medium leading-snug text-paper/80">
                  UU No. 22 Tahun 2022
                  <br />
                  Tentang Pemasyarakatan
                </p>
              </div>
            </div>
          </CardShell>
        </div>
      </>
    ),
    back: (
      <CardShell eyebrow="Pembinaan Kemandirian" footer="Pasal 38 Huruf b" tone="light">
        <p className="max-w-[32ch] text-balance font-serif text-base leading-relaxed text-paper/90 sm:text-lg">
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
    // Same construction again — ivory base, one corner accent — this
    // time in a quiet olive rather than taupe, so it's identifiable as
    // "the olive card" without ever being a solid green panel. The
    // olive only shows up as a soft wash in the bottom-right corner;
    // everything else is the same warm cream the other light cards
    // share.
    gradient:
      "radial-gradient(circle at 82% 88%, rgba(138,135,96,0.30) 0%, rgba(138,135,96,0) 48%), linear-gradient(180deg, #F6F1E8 0%, #F0ECDC 55%, #DDD9BE 100%)",
    ring: CARD_RING_LIGHT,
    textTone: "dark",
    front: (
      <CardShell eyebrow="Pembinaan Kemandirian" footer="03 — Pasal 38 Huruf b" tone="dark">
        <p className="max-w-[30ch] text-balance font-serif text-lg font-medium leading-relaxed text-ink sm:text-xl">
          Pembinaan kemandirian sebagaimana dimaksud dalam Pasal 38 huruf b
          dapat ditingkatkan menjadi kegiatan menghasilkan barang dan jasa
          yang memiliki manfaat dan nilai tambah.
        </p>
      </CardShell>
    ),
    back: (
      <CardShell eyebrow="Lapas Perempuan" footer="Kemandirian Warga Binaan" tone="dark">
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-2xl font-semibold leading-[1.05] text-ink sm:text-3xl">
            Lapas Perempuan
          </span>
          <span className="font-serif text-2xl font-semibold italic leading-[1.05] text-ink/80 sm:text-3xl">
            Kelas IIA Jakarta
          </span>
        </div>
      </CardShell>
    ),
  },
];

const AUTOPLAY_MS = 4500;
// Below this much horizontal drag, a pointer-down/up pair is treated as a
// tap (flip the card) rather than a swipe. Above SWIPE_THRESHOLD it's a
// deliberate swipe (change slide); in between, the drag just snaps back.
const TAP_THRESHOLD = 6;
const SWIPE_THRESHOLD = 50;

// Resting offset for a slide waiting off to the side (not the active
// one). Kept small and premium-feeling rather than a full-card swing.
const REST_OFFSET = 28;
// While actively dragging, the active card follows the pointer with a
// rubber-band curve so it never travels further than this, however far
// the finger moves — keeps the whole system, drag included, inside the
// same "small, calm" motion budget instead of a raw 1:1 throw.
const DRAG_MAX = 56;

// A soft, decelerating curve (similar to what Apple uses for sheet/card
// transitions) instead of linear/ease — gives the settle its "weight"
// without ever feeling bouncy or slow.
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const DURATION_MS = 640;
// No `filter` in this transition (there used to be one, driving a
// `blur()` depth cue on the resting/off-stage card) — `filter` on an
// element inside a 3D-transformed, `backface-visibility: hidden` stack
// is what was making the ACTIVE card render soft on iOS Safari: the
// browser puts the blurred and unblurred layers in the same compositing
// pass, and the active card's text picks up the neighbor's blur radius
// instead of staying crisp. Depth between the active and resting cards
// is now carried by scale + opacity alone (see `scale` in the render
// loop below), which is enough for the "cross-fade" feel without ever
// touching a compositing property that iOS mishandles.
const TRANSITION = `transform ${DURATION_MS}ms ${EASE}, opacity ${DURATION_MS}ms ${EASE}`;
const FLIP_TRANSITION = `transform 620ms ${EASE}`;

// Layered "product photography" shadow for the card faces themselves —
// a tight contact shadow, a mid-distance shadow for lift, and a soft
// far shadow for ambient depth — plus a hairline inset highlight along
// the top edge so the card reads as a lightly beveled, premium surface
// rather than a flat rectangle with a single drop shadow.
const CARD_SURFACE_SHADOW =
  "shadow-[0_1px_1px_rgba(23,17,10,0.04),0_10px_20px_-8px_rgba(23,17,10,0.16),0_32px_64px_-24px_rgba(23,17,10,0.24),inset_0_1px_0_rgba(255,255,255,0.35)]";

// Rubber-band easing for live drag: follows the finger closely at first,
// then eases off asymptotically toward DRAG_MAX so a long drag never
// yanks the card far past its neighbor's resting position.
function dampen(delta: number, max: number) {
  const sign = Math.sign(delta);
  const magnitude = max * (1 - Math.exp(-Math.abs(delta) / max));
  return sign * magnitude;
}

// Tilt stays deliberately small — this is a "premium product settles
// under your cursor" cue, not a gimbal. Degrees, not "flashy" swing.
const TILT_MAX_DEG = 5;

export function HeroCardCarousel() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const dragStartX = useRef(0);
  const activePointer = useRef<number | null>(null);

  // Parallax tilt lives entirely outside React state — direct style
  // writes on a ref, throttled to one update per animation frame — so
  // moving the mouse never triggers a re-render of the whole carousel
  // (drag/swipe state above stays untouched by this).
  const tiltRef = useRef<HTMLDivElement>(null);
  const tiltRaf = useRef<number | null>(null);
  const tiltEnabled = useRef(false);

  useEffect(() => {
    // Only enable on devices with a precise pointer (mouse/trackpad) and
    // when the user hasn't asked for reduced motion. Touch devices don't
    // get a hover cursor to tilt toward, so this would just be noise.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tiltEnabled.current = fine && !reduced;
  }, []);

  function handleCardMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    if (!tiltEnabled.current) return;
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (tiltRaf.current) cancelAnimationFrame(tiltRaf.current);
    tiltRaf.current = requestAnimationFrame(() => {
      const node = tiltRef.current;
      if (!node) return;
      const rotateY = px * TILT_MAX_DEG * 2;
      const rotateX = -py * TILT_MAX_DEG * 2;
      node.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
  }

  function resetTilt() {
    if (tiltRaf.current) cancelAnimationFrame(tiltRaf.current);
    const node = tiltRef.current;
    if (node) node.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  const goTo = useCallback((next: number) => {
    const total = SLIDES.length;
    setIndex(((next % total) + total) % total);
    setFlipped(false);
  }, []);

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay — resets whenever the slide changes (manually or otherwise),
  // and pauses on hover or while the user is actively dragging.
  useEffect(() => {
    if (paused || dragging) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
      setFlipped(false);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, dragging, index]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragStartX.current = e.clientX;
    activePointer.current = e.pointerId;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointer.current !== e.pointerId) return;
    setDragDelta(e.clientX - dragStartX.current);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    setDragging(false);
    const delta = dragDelta;
    setDragDelta(0);
    if (Math.abs(delta) < TAP_THRESHOLD) {
      setFlipped((f) => !f);
    } else if (delta <= -SWIPE_THRESHOLD) {
      goNext();
    } else if (delta >= SWIPE_THRESHOLD) {
      goPrev();
    }
    // Otherwise: drag wasn't far enough to count as a swipe — it eases
    // back to center via the transition below, same curve as everything
    // else, so a cancelled swipe feels like part of the same system.
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 sm:gap-6">
      <div
        ref={tiltRef}
        // Outer card only, ~8-9% smaller at every breakpoint than
        // before (24.5/30/34rem -> 22.5/27.5/31rem) — aspect-[6/7] is
        // untouched so the card's own proportions don't shift, just
        // its overall footprint. Interior sizing (image, type,
        // padding) is deliberately NOT scaled down with it — see the
        // image container below, which now sizes itself back up
        // relative to this smaller box.
        className="group relative aspect-[6/7] w-full max-w-[22.5rem] touch-pan-y select-none [perspective:1600px] [transform-style:preserve-3d] will-change-transform sm:max-w-[27.5rem] lg:max-w-[31rem]"
        style={{ transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          resetTilt();
        }}
        onMouseMove={handleCardMouseMove}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {SLIDES.map((slide, i) => {
          const isActive = i === index;
          const restOffset = isActive ? 0 : i > index ? REST_OFFSET : -REST_OFFSET;
          const liveOffset = isActive && dragging ? dampen(dragDelta, DRAG_MAX) : 0;
          const offset = restOffset + liveOffset;

          // Subtle depth cue: the active card stays full scale, only
          // easing very slightly under an active drag; a resting
          // (off-stage) card sits a touch smaller — scale and opacity
          // alone carry the "cross-fade" feel now, with nothing in
          // `filter`/blur for iOS to mis-composite onto the active card.
          const dragProgress = isActive && dragging ? Math.min(Math.abs(dragDelta) / SWIPE_THRESHOLD, 1) : 0;
          const scale = isActive ? 1 - dragProgress * 0.015 : 0.96;
          const skipTransition = isActive && dragging;

          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 ${isActive ? "cursor-grab active:cursor-grabbing" : ""}`}
              style={{
                opacity: isActive ? 1 : 0,
                transform: `translateX(${offset}px) scale(${scale})`,
                pointerEvents: isActive ? "auto" : "none",
                transition: skipTransition ? "none" : TRANSITION,
                willChange: "transform, opacity",
                zIndex: isActive ? 2 : 1,
              }}
            >
              <div
                className="relative h-full w-full [transform-style:preserve-3d] will-change-transform"
                style={{
                  transform: isActive && flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: FLIP_TRANSITION,
                }}
              >
                {/* Front face */}
                <div
                  className={`absolute inset-0 overflow-hidden rounded-[32px] ring-1 ring-inset [backface-visibility:hidden] ${slide.shadow ?? CARD_SURFACE_SHADOW} ${slide.ring}`}
                  style={{ background: slide.gradient }}
                >
                  {slide.front}
                </div>
                {/* Back face */}
                <div
                  className={`absolute inset-0 overflow-hidden rounded-[32px] ring-1 ring-inset [backface-visibility:hidden] [transform:rotateY(180deg)] ${slide.shadow ?? CARD_SURFACE_SHADOW} ${slide.ring}`}
                  style={{ background: slide.gradient }}
                >
                  {slide.back}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination dots — small and quiet, they support the card rather
          than compete with it. */}
      <div className="flex items-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Tampilkan ${slide.label}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-ink" : "w-1.5 bg-ink/25 hover:bg-ink/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
