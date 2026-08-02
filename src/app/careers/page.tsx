import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";

export const metadata: Metadata = {
  title: "Careers — Lapiita Karya",
};

export default function CareersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Company"
              title="Careers"
              description="We're a small team building Lapiita Karya carefully — here's how to reach us about working together."
            />

            <EmptyState message="We don't have any open roles listed right now. Check back later, or introduce yourself below." />

            <p className="max-w-2xl text-base leading-relaxed text-slate">
              Even without a specific opening, we&apos;re always glad to hear
              from people who care about considered, well-made products. Send
              us a note through our{" "}
              <a
                href="/contact"
                className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
              >
                contact page
              </a>{" "}
              telling us a bit about yourself, and we&apos;ll keep it on
              file.
            </p>
          </Container>
        </section>
      </main>
    </div>
  );
}
