import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/home/container";
import { HeroGlow } from "@/components/home/hero-glow";
import { HeroCollageDeck } from "@/components/home/hero-collage-deck";

export function HeroBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-cloud">
      <HeroGlow />

      <Container className="relative grid grid-cols-1 items-center gap-5 px-5 py-8 sm:gap-12 sm:px-6 sm:py-14 md:py-16 lg:min-h-[80svh] lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div className="animate-fade-up flex flex-col gap-3.5 sm:gap-7">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal sm:text-[11px] sm:tracking-[0.2em]">
            Lapas Perempuan Kelas II A Jakarta
          </span>
          <h1 className="max-w-xl text-balance font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl sm:leading-[1.1] md:max-w-2xl md:text-[4.25rem] lg:max-w-xl">
            Mengenal,
            <br />
            Lapiita Karya
          </h1>
          <p className="max-w-md text-balance text-base leading-relaxed text-slate sm:text-lg sm:leading-relaxed md:max-w-lg lg:max-w-md">
            Balai Latihan Kerja bagi warga binaan di Lapas Perempuan Kelas
            IIA Jakarta yang menghasilkan berbagai kerajinan tangan, batik,
            dan produk hasil pertanian berkualitas sebagai wujud pembinaan,
            keterampilan, dan kemandirian.
          </p>

          <div
            className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:pt-3 md:pt-4 lg:pt-2 [animation-delay:150ms]"
            style={{ animation: "var(--animate-fade-up)" }}
          >
            <Link
              href="/shop"
              className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] sm:w-auto"
            >
              Jelajahi Produk
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
            <a
              href="#new-arrivals"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-7 py-3 text-sm font-medium text-ink transition-all duration-200 hover:border-ink/35 hover:bg-paper hover:shadow-sm active:scale-[0.98] sm:w-auto sm:py-3.5"
            >
              Tentang Kami
            </a>
          </div>

          <div className="max-w-[220px] pt-3 sm:max-w-[260px] sm:pt-4 md:max-w-[300px] md:pt-6 lg:hidden">
            <HeroCollageDeck />
          </div>

          <dl className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-line pt-4 sm:mt-4 sm:gap-x-8 sm:gap-y-3 sm:pt-6">
            <div className="flex flex-col">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                Free shipping
              </dt>
              <dd className="text-sm font-medium text-ink">Over Rp2.350.000</dd>
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

        {/* Desktop only (lg+): editorial offset tile arrangement standing in
            for a campaign photo grid, built from the shop's
            placeholder-gradient system so it never depends on external
            imagery. Mobile/tablet get their own interactive stacked photo
            deck (HeroCollageDeck) above, right below the CTA buttons. */}
        <div
          className="relative hidden aspect-[4/5] w-full lg:block"
          aria-hidden="true"
        >
          <div
            className="absolute left-0 top-6 h-[62%] w-[62%] rounded-3xl shadow-lg transition-transform duration-700 ease-out hover:-translate-y-1"
            style={{
              background:
                "linear-gradient(145deg, #efe3d8 0%, #d9c4ae 55%, #a9843f 100%)",
            }}
          />
          <div
            className="absolute bottom-4 right-2 h-[52%] w-[48%] rounded-3xl shadow-lg transition-transform duration-700 ease-out hover:-translate-y-1"
            style={{
              background:
                "linear-gradient(160deg, #2c232a 0%, #17151a 100%)",
            }}
          />
          <div
            className="absolute bottom-24 left-[8%] h-24 w-24 rounded-2xl bg-paper shadow-lg transition-transform duration-700 ease-out hover:-translate-y-1"
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
