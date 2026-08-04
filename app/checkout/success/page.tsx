import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col items-center gap-6 text-center">
            <span className="flex h-14 w-14 animate-in items-center justify-center rounded-full bg-accent-soft text-signal shadow-sm zoom-in-75 duration-500">
              <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
            </span>

            <SectionHeading
              eyebrow="Shop"
              title="Order received"
              description="Thank you — we've received your order and will be in touch shortly to confirm the details."
              align="center"
            />

            {order ? (
              <p className="font-mono text-sm text-slate">
                Order number <span className="font-medium text-ink">{order}</span>
              </p>
            ) : null}

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
            >
              Continue shopping
            </Link>
          </Container>
        </section>
      </main>
    </div>
  );
}
