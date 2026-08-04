import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "FAQ — Lapiita Karya",
};

const FAQS = [
  {
    question: "Do I need an account to order?",
    answer:
      "No. Lapiita Karya doesn't use customer accounts — browsing, your bag, wishlist, and checkout all work as a guest. You'll just need a name, phone number, and email to place an order.",
  },
  {
    question: "How do I pay?",
    answer:
      "Payment is by manual bank transfer (or QRIS, where available). After you place an order, you'll land on a payment page with the account details and an upload form for your payment proof.",
  },
  {
    question: "How long does verification take?",
    answer:
      "Once you upload your payment proof, our team reviews it and updates your order status — usually within a short while. You'll be able to see the current status on the payment page at any time using your order number.",
  },
  {
    question: "How do I track an order?",
    answer:
      "Use the \"Track an order\" link in the menu or footer and enter your order number. You can find it in your confirmation email or on the payment page you saw right after checkout.",
  },
  {
    question: "What's your return policy?",
    answer:
      "We offer easy returns within 60 days of delivery. See our Shipping & returns page for the full details.",
  },
  {
    question: "How can I reach you?",
    answer:
      "Send us a message through the Contact us page and we'll get back to you as soon as we can.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Support"
              title="Frequently asked questions"
              description="Everything you need to know about ordering, paying, and tracking with Lapiita Karya."
            />

            <div className="flex max-w-2xl flex-col divide-y divide-line rounded-2xl border border-line shadow-xs">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group px-6 py-5 transition-colors duration-200 open:bg-cloud/30">
                  <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:content-none">
                    <span className="flex items-center justify-between gap-4 transition-colors duration-200 group-hover:text-signal">
                      {faq.question}
                      <span className="font-mono text-slate transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
