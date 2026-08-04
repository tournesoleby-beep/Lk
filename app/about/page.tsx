import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "About us — Lapiita Karya",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Company"
              title="About Lapiita Karya"
              description="Considered pieces, made to last."
            />

            <div className="flex max-w-2xl flex-col gap-6 text-base leading-relaxed text-slate">
              <p>
                Lapiita Karya started from a simple frustration: too much of
                what&apos;s sold today is designed to be replaced, not kept.
                We set out to build a small, focused catalog of clothing,
                food, and production goods chosen for how well they&apos;re
                made — not how quickly they can be shipped.
              </p>
              <p>
                Every piece we carry is selected for fabric, fit, and
                function first. We work with a small number of makers we
                trust, favor natural materials where we can, and would rather
                offer fewer things done well than a catalog padded out for
                its own sake.
              </p>
              <p>
                We&apos;re a small team, and we read every message that comes
                through our{" "}
                <a
                  href="/contact"
                  className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
                >
                  contact page
                </a>
                . If you have a question about a piece, an order, or just
                want to say hello, we&apos;d like to hear from you.
              </p>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
