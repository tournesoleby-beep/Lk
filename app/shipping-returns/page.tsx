import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Shipping & returns — Lapiita Karya",
};

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";

export default function ShippingReturnsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="Support"
              title="Shipping & returns"
              description="What to expect once you place an order."
            />

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-2xl border border-line p-6">
                <span className={LABEL_CLASS}>Shipping</span>
                <p className="text-sm leading-relaxed text-slate">
                  Free shipping on orders over Rp2.350.000. Orders are
                  prepared once payment is verified, and we&apos;ll email you
                  updates as your order moves through processing and
                  shipping.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-line p-6">
                <span className={LABEL_CLASS}>Returns</span>
                <p className="text-sm leading-relaxed text-slate">
                  We offer easy returns within 60 days of delivery. Items
                  should be unworn, unwashed, and in their original
                  condition. Get in touch through our contact page with your
                  order number to start a return.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-cloud/40 p-6">
              <span className={LABEL_CLASS}>Questions about a specific order?</span>
              <p className="max-w-2xl text-sm leading-relaxed text-slate">
                You can check the status of any order at any time on our{" "}
                <a
                  href="/orders/lookup"
                  className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
                >
                  order tracking page
                </a>
                , or reach out through our{" "}
                <a
                  href="/contact"
                  className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
                >
                  contact page
                </a>
                .
              </p>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
