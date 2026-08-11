import Image from "next/image";
import { GraduationCap, Hammer, PackageCheck, ShieldCheck } from "lucide-react";

import { Container } from "@/components/home/container";
import { Parallax } from "@/components/home/parallax";
import { Reveal } from "@/components/home/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

// This section's own motion signature: a slightly overshooting ease-out,
// on the slower end of the range, distinct from the other three sections.
const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION = 650;
const STAGGER = 90;

// Continues the same warm taupe surface used by every section below the
// hero (CardsSection, CategoriesSection, NewArrivals, InstagramHighlights)
// — same base fill, same radial gradient values — so this section reads
// as one uninterrupted background rather than its own bg-cloud block.
const SECTION_BASE_COLOR = "#B09F90";
const SECTION_BACKGROUND =
  "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(208,196,184,0.95) 0%, rgba(196,182,168,0.85) 45%, rgba(176,159,144,0.95) 100%)";

const steps = [
  {
    icon: GraduationCap,
    title: "Pelatihan",
    description:
      "Warga binaan dibekali pelatihan keterampilan secara bertahap, didampingi instruktur berpengalaman di bidangnya.",
    image: "/image/proses/pelatihan.jpg",
  },
  {
    icon: Hammer,
    title: "Produksi",
    description:
      "Setiap karya dikerjakan langsung oleh tangan-tangan terampil warga binaan yang memadukan ketelitian dan kesabaran di setiap tahapnya.",
    image: "/image/proses/produksi.jpg",
  },
  {
    icon: ShieldCheck,
    title: "Kontrol Kualitas",
    description:
      "Produk diperiksa satu per satu untuk memastikan kualitas dan kerapian sebelum lolos standar kami.",
    image: "/image/proses/kontrol-kualitas.jpg",
  },
  {
    icon: PackageCheck,
    title: "Sampai ke Anda",
    description:
      "Dikemas dengan rapi dan dikirim langsung ke tangan Anda, membawa cerita di balik setiap karya.",
    image: "/image/proses/sampai-ke-anda.jpg",
  },
];

export function ProcessTimeline() {
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
      <Container className="relative z-10 flex flex-col gap-8 px-5 sm:gap-14 sm:px-6">
        <Reveal variant="fade-up" duration={DURATION} easing={EASING}>
          <SectionHeading
            eyebrow="Proses kami"
            title="Proses Kami"
            description="Setiap produk dibuat dengan tangan oleh warga binaan."
            compact
          />
        </Reveal>

        {/* Mobile / tablet: vertical timeline. The connector is a flex-1
            filler inside each icon's own column, which stretches to match
            that step's (variable-height) content automatically — no
            absolute-position math needed. */}
        <Reveal
          as="ol"
          className="flex flex-col lg:hidden"
          variant="fade-up"
          stagger
          duration={DURATION}
          easing={EASING}
          staggerDelay={STAGGER}
        >
          {steps.map(({ icon: Icon, title, description, image }, index) => (
            <li key={title} className="group flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-xs transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-signal/25 group-hover:shadow-sm">
                  <Icon className="h-5 w-5 text-signal" strokeWidth={1.75} />
                </div>
                {index < steps.length - 1 ? (
                  <div className="w-px flex-1 bg-line" aria-hidden="true" />
                ) : null}
              </div>

              <div
                className={cn(
                  "flex flex-1 flex-col gap-3",
                  index < steps.length - 1 && "pb-7"
                )}
              >
                <Parallax
                  as="div"
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl"
                  strength={12}
                >
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="100vw"
                    className="rounded-2xl object-cover shadow-xs transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                </Parallax>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal">
                    Langkah {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[0.9375rem] font-medium leading-snug text-ink">{title}</h3>
                  <p className="text-[0.8125rem] leading-relaxed text-slate">
                    {description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </Reveal>

        {/* Desktop: horizontal timeline. A single connecting line sits at
            the icons' vertical center and spans between the first and
            last icon's horizontal center (12.5% in from each edge, since
            each of the 4 grid columns is 25% wide). Icons render above it
            with an opaque background, so the line reads as passing
            through connected nodes rather than under floating circles. */}
        <Reveal
          as="div"
          className="relative hidden lg:grid lg:grid-cols-4 lg:gap-8"
          variant="fade-up"
          stagger
          duration={DURATION}
          easing={EASING}
          staggerDelay={STAGGER}
        >
          <div
            className="absolute left-[12.5%] right-[12.5%] top-7 h-px bg-line"
            aria-hidden="true"
          />

          {steps.map(({ icon: Icon, title, description, image }, index) => (
            <div
              key={title}
              className="group relative z-10 flex flex-col items-center gap-4 px-2 text-center"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-xs transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-signal/25 group-hover:shadow-sm">
                <Icon className="h-6 w-6 text-signal" strokeWidth={1.75} />
              </div>

              <Parallax
                as="div"
                className="relative aspect-[4/3] w-full max-w-[220px] overflow-hidden rounded-2xl"
                strength={12}
              >
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="220px"
                  className="rounded-2xl object-cover shadow-xs transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </Parallax>

              <div className="flex flex-col items-center gap-1.5">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-signal">
                  Langkah {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-medium text-ink">{title}</h3>
                <p className="max-w-[220px] text-sm leading-relaxed text-slate">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
