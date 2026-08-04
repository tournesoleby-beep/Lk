import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Terms of service — Lapiita Karya",
};

const SECTIONS = [
  {
    title: "Orders",
    body: "Placing an order is an offer to purchase, which we confirm once your payment is verified. We reserve the right to decline or cancel an order — for example if an item is no longer in stock — and will let you know if that happens.",
  },
  {
    title: "Pricing & payment",
    body: "Prices are shown in the currency listed at checkout and are charged at the exact total shown. Payment is made by manual bank transfer or QRIS; your order is confirmed once we've verified your payment proof.",
  },
  {
    title: "Shipping & returns",
    body: "Shipping timelines and our 60-day return policy are described on our Shipping & returns page, which forms part of these terms.",
  },
  {
    title: "Product information",
    body: "We do our best to describe and photograph every product accurately. Minor variations in color or finish can occur, especially with natural materials.",
  },
  {
    title: "Changes to these terms",
    body: "We may update these terms from time to time as the store evolves. The version shown here is always the current one.",
  },
] as const;

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Company"
              title="Terms of service"
              description="The terms that apply when you shop with Lapiita Karya."
            />

            <div className="flex max-w-2xl flex-col gap-8">
              {SECTIONS.map((section) => (
                <div key={section.title} className="flex flex-col gap-2">
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {section.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
