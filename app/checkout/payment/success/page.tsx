import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getOrderForPayment } from "@/lib/checkout/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { CopyOrderNumberButton } from "@/components/checkout/copy-order-number-button";
import { WhatsAppButton } from "@/components/checkout/whatsapp-button";
import { SaveRecentOrder } from "@/components/checkout/save-recent-order";

export const metadata: Metadata = {
  title: "Payment proof received — Lapiita Karya",
};

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";

export default async function CheckoutPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await getOrderForPayment(orderNumber) : null;

  if (!order) {
    return (
      <div className="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col">
          <section className="bg-paper py-10 sm:py-16 md:py-24">
            <Container className="flex flex-col items-center gap-6">
              <SectionHeading eyebrow="Shop" title="Payment" align="center" />
              <EmptyState message="We couldn't find that order. Check the link, or start a new order from the shop." />
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Continue shopping
              </Link>
            </Container>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col items-center gap-8 text-center">
            <SaveRecentOrder
              orderNumber={order.orderNumber}
              status={order.status}
              total={order.total}
              currency={order.currency}
              createdAt={
                typeof order.createdAt === "string"
                  ? order.createdAt
                  : new Date(order.createdAt).toISOString()
              }
            />

            <span className="flex h-14 w-14 animate-in items-center justify-center rounded-full bg-accent-soft text-signal shadow-sm zoom-in-75 duration-500">
              <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
            </span>

            <SectionHeading
              eyebrow="Shop"
              title="Payment proof received"
              description="Thanks — we're verifying your payment now and will confirm your order shortly."
              align="center"
            />

            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line p-6 text-left shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className={LABEL_CLASS}>Order number</span>
                  <span className="font-mono text-sm text-ink">{order.orderNumber}</span>
                </div>
                <CopyOrderNumberButton orderNumber={order.orderNumber} />
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <span className={LABEL_CLASS}>Payment status</span>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <span className={LABEL_CLASS}>Total paid</span>
                <span className="font-mono text-base font-semibold text-ink">
                  {formatCurrency(order.total, order.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4 text-xs text-slate">
                <span>Placed</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/orders/lookup?order=${encodeURIComponent(order.orderNumber)}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Track order
              </Link>
              <WhatsAppButton
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-cloud/60 px-6 py-3 text-sm font-medium text-ink shadow-xs transition-all duration-200 hover:bg-cloud active:scale-[0.98]"
                message={`Hi, I'd like to ask about my order ${order.orderNumber}.`}
              />
            </div>

            <Link
              href="/shop"
              className="text-sm font-medium text-slate underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
            >
              Continue shopping
            </Link>
          </Container>
        </section>
      </main>
    </div>
  );
}
