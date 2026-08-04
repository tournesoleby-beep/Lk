import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Privacy policy — Lapiita Karya",
};

const SECTIONS = [
  {
    title: "What we collect",
    body: "When you place an order, we collect the details needed to fulfil it: your name, phone number, email address, and shipping address. We don't require an account, and we don't collect anything beyond what checkout needs.",
  },
  {
    title: "How we use it",
    body: "Your details are used to process and ship your order, send order and payment status updates, and respond if you contact us. We don't sell your information to third parties.",
  },
  {
    title: "Payment information",
    body: "Payments are made by manual bank transfer. We ask you to upload a screenshot or photo of your payment confirmation so we can verify it; this proof is only used to confirm your payment.",
  },
  {
    title: "Cookies & local data",
    body: "Your shopping bag and wishlist are stored in your browser for this session so the site works smoothly as you shop — they are not shared or used for tracking.",
  },
  {
    title: "Contacting us",
    body: "If you have questions about your data or want it removed, reach out through our contact page and we'll get back to you.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Company"
              title="Privacy policy"
              description="How Lapiita Karya collects and uses your information."
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
