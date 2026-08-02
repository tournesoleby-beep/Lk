import { GraduationCap, Hammer, PackageCheck, ShieldCheck } from "lucide-react";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { cn, getPlaceholderGradient } from "@/lib/utils";

const steps = [
  {
    icon: GraduationCap,
    title: "Pelatihan",
    description:
      "Warga binaan dibekali pelatihan keterampilan secara bertahap, didampingi instruktur berpengalaman di bidangnya.",
  },
  {
    icon: Hammer,
    title: "Produksi",
    description:
      "Setiap karya dikerjakan dengan tangan, memadukan ketelitian dan kesabaran di setiap tahapnya.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Control",
    description:
      "Produk diperiksa satu per satu untuk memastikan kualitas dan kerapian sebelum lolos standar kami.",
  },
  {
    icon: PackageCheck,
    title: "Sampai ke Anda",
    description:
      "Dikemas dengan rapi dan dikirim langsung ke tangan Anda, membawa cerita di balik setiap karya.",
  },
];

export function ProcessTimeline() {
  return (
    <section className="bg-cloud py-24 sm:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Proses kami"
          title="Perjalanan Sebuah Karya"
          description="Setiap produk merupakan hasil proses pembinaan yang bertujuan membangun keterampilan, kreativitas, dan kemandirian warga binaan sebelum sampai ke tangan Anda."
        />

        {/* Mobile / tablet: vertical timeline. The connector is a flex-1
            filler inside each icon's own column, which stretches to match
            that step's (variable-height) content automatically — no
            absolute-position math needed. */}
        <ol className="flex flex-col lg:hidden">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="group flex gap-5">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-xs transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-signal/25 group-hover:shadow-sm">
                  <Icon className="h-6 w-6 text-signal" strokeWidth={1.75} />
                </div>
                {index < steps.length - 1 ? (
                  <div className="w-px flex-1 bg-line" aria-hidden="true" />
                ) : null}
              </div>

              <div
                className={cn(
                  "flex flex-1 flex-col gap-4",
                  index < steps.length - 1 && "pb-10"
                )}
              >
                <div
                  className="aspect-[4/3] w-full max-w-xs overflow-hidden rounded-2xl shadow-xs transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  style={{ background: getPlaceholderGradient(title) }}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-signal">
                    Langkah {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-medium text-ink">{title}</h3>
                  <p className="max-w-sm text-sm leading-relaxed text-slate">
                    {description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Desktop: horizontal timeline. A single connecting line sits at
            the icons' vertical center and spans between the first and
            last icon's horizontal center (12.5% in from each edge, since
            each of the 4 grid columns is 25% wide). Icons render above it
            with an opaque background, so the line reads as passing
            through connected nodes rather than under floating circles. */}
        <div className="relative hidden lg:grid lg:grid-cols-4 lg:gap-8">
          <div
            className="absolute left-[12.5%] right-[12.5%] top-7 h-px bg-line"
            aria-hidden="true"
          />

          {steps.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="group relative z-10 flex flex-col items-center gap-4 px-2 text-center"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-xs transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-signal/25 group-hover:shadow-sm">
                <Icon className="h-6 w-6 text-signal" strokeWidth={1.75} />
              </div>

              <div
                className="aspect-[4/3] w-full max-w-[220px] overflow-hidden rounded-2xl shadow-xs transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                style={{ background: getPlaceholderGradient(title) }}
                aria-hidden="true"
              />

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
        </div>
      </Container>
    </section>
  );
}
