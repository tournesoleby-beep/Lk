import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Sustainability — Lapiita Karya",
};

const COMMITMENTS = [
  {
    title: "Made to last",
    body: "We choose fabrics, construction, and finishes for durability first, so pieces stay in use for years rather than a season.",
  },
  {
    title: "Fewer, better things",
    body: "We'd rather carry a small, considered catalog than a sprawling one — less overproduction, less waste, less noise.",
  },
  {
    title: "Trusted makers",
    body: "We work with a small number of production partners we know directly, rather than anonymous, ever-changing suppliers.",
  },
] as const;

export default function SustainabilityPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="Company"
              title="Sustainability"
              description="Considered pieces, made to last — not just a tagline. Here's what that means in practice."
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {COMMITMENTS.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-2xl border border-line p-6"
                >
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-slate">
              We&apos;re a small team and this work is ongoing — if you have
              questions about a specific piece or material, reach out on our{" "}
              <a
                href="/contact"
                className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
              >
                contact page
              </a>{" "}
              and we&apos;ll get back to you directly.
            </p>
          </Container>
        </section>
      </main>
    </div>
  );
}
