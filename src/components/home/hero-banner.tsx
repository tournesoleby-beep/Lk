import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/home/container";
import { HeroGlow } from "@/components/home/hero-glow";

export function HeroBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-cloud">
      <HeroGlow />

      <Container className="relative grid min-h-[80svh] grid-cols-1 items-center gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
        <div className="animate-fade-up flex flex-col gap-7">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
            The Autumn Edit
          </span>
          <h1 className="max-w-xl text-balance font-serif text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl md:text-[4.25rem]">
            Considered style,
            <br />
            made to last.
          </h1>
          <p className="max-w-md text-balance text-base leading-relaxed text-slate sm:text-lg">
            Discover this season&apos;s edit of clothing, bags, and shoes —
            chosen for fabric, fit, and the kind of quality you notice on
            day one and day one thousand.
          </p>

          <div
            className="flex flex-wrap items-center gap-4 pt-2 [animation-delay:150ms]"
            style={{ animation: "var(--animate-fade-up)" }}
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
            >
              Shop the collection
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
            <a
              href="#new-arrivals"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-ink/35 hover:bg-paper"
            >
              See what&apos;s new
            </a>
          </div>

          <dl className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-6">
            <div className="flex flex-col">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                Free shipping
              </dt>
              <dd className="text-sm font-medium text-ink">Over $150</dd>
            </div>
            <div className="flex flex-col">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                Easy returns
              </dt>
              <dd className="text-sm font-medium text-ink">Within 60 days</dd>
            </div>
            <div className="flex flex-col">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                Authenticity
              </dt>
              <dd className="text-sm font-medium text-ink">100% guaranteed</dd>
            </div>
          </dl>
        </div>

        {/* Editorial visual: an offset tile arrangement standing in for a
            campaign photo grid, built from the shop's placeholder-gradient
            system so it never depends on external imagery. */}
        <div
          className="relative hidden aspect-[4/5] w-full lg:block"
          aria-hidden="true"
        >
          <div
            className="absolute left-0 top-6 h-[62%] w-[62%] rounded-3xl shadow-[0_30px_60px_-25px_rgba(23,21,26,0.35)]"
            style={{
              background:
                "linear-gradient(145deg, #efe3d8 0%, #d9c4ae 55%, #a9843f 100%)",
            }}
          />
          <div
            className="absolute bottom-4 right-2 h-[52%] w-[48%] rounded-3xl shadow-[0_30px_60px_-25px_rgba(23,21,26,0.35)]"
            style={{
              background:
                "linear-gradient(160deg, #2c232a 0%, #17151a 100%)",
            }}
          />
          <div
            className="absolute bottom-24 left-[8%] h-24 w-24 rounded-2xl bg-paper shadow-[0_20px_40px_-20px_rgba(23,21,26,0.3)]"
            style={{
              background:
                "linear-gradient(160deg, #fbebee 0%, #a8324f 100%)",
            }}
          />
        </div>
      </Container>
    </section>
  );
}
