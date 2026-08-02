"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrder } from "@/lib/checkout/actions";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";
const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate focus:border-signal/50 focus:bg-paper";

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const EMPTY_VALUES: FormValues = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const currency = cart.lines[0]?.currency ?? "USD";

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};

    if (!values.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!values.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!values.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!values.address.trim()) nextErrors.address = "Shipping address is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (cart.lines.length === 0) {
      setSubmitError("Your bag is empty.");
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await placeOrder(
      values,
      cart.lines.map((line) => ({ id: line.id, quantity: line.quantity }))
    );

    if (!result.success) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    cart.clear();
    router.push(`/checkout/payment?order=${encodeURIComponent(result.orderNumber)}`);
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col">
          <section className="bg-paper py-16 sm:py-24">
            <Container className="flex flex-col items-center gap-6">
              <SectionHeading eyebrow="Shop" title="Checkout" align="center" />
              <EmptyState message="Your bag is empty. Add something before checking out." />
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
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
          <Container className="flex flex-col gap-10">
            <SectionHeading eyebrow="Shop" title="Checkout" />

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px] lg:items-start"
            >
              {/* Contact + shipping details */}
              <div className="flex flex-col gap-5 rounded-2xl border border-line p-6">
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Delivery details
                </h2>

                <label className="flex flex-col gap-1.5">
                  <span className={LABEL_CLASS}>Full name</span>
                  <input
                    value={values.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className={INPUT_CLASS}
                  />
                  {errors.fullName ? (
                    <span className="text-xs text-signal">{errors.fullName}</span>
                  ) : null}
                </label>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Phone number</span>
                    <input
                      type="tel"
                      value={values.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+1 555 123 4567"
                      autoComplete="tel"
                      className={INPUT_CLASS}
                    />
                    {errors.phone ? (
                      <span className="text-xs text-signal">{errors.phone}</span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Email</span>
                    <input
                      type="email"
                      value={values.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={INPUT_CLASS}
                    />
                    {errors.email ? (
                      <span className="text-xs text-signal">{errors.email}</span>
                    ) : null}
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className={LABEL_CLASS}>Shipping address</span>
                  <textarea
                    value={values.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Street, city, postal code, country"
                    rows={3}
                    className={INPUT_CLASS}
                  />
                  {errors.address ? (
                    <span className="text-xs text-signal">{errors.address}</span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={LABEL_CLASS}>Notes (optional)</span>
                  <textarea
                    value={values.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Delivery instructions, gift note, etc."
                    rows={3}
                    className={INPUT_CLASS}
                  />
                </label>

                {submitError ? (
                  <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
                    {submitError}
                  </p>
                ) : null}
              </div>

              {/* Order summary */}
              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-cloud/40 p-6">
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Order summary
                </h2>

                <ul className="flex flex-col gap-3 border-b border-line pb-4">
                  {cart.lines.map((line) => (
                    <li
                      key={line.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-ink">
                        {line.name}{" "}
                        <span className="text-slate">× {line.quantity}</span>
                      </span>
                      <span className="font-mono text-ink">
                        {formatCurrency(line.price * line.quantity, line.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">
                    Subtotal ({cart.count} {cart.count === 1 ? "item" : "items"})
                  </span>
                  <span className="font-mono text-base font-medium text-ink">
                    {formatCurrency(cart.subtotal, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="font-medium text-ink">Total</span>
                  <span className="font-mono text-base font-semibold text-ink">
                    {formatCurrency(cart.subtotal, currency)}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate">
                  You&apos;ll pay by bank transfer on the next page and upload
                  your payment proof there.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                  ) : null}
                  {isSubmitting ? "Placing order…" : "Place order"}
                </button>
              </div>
            </form>
          </Container>
        </section>
      </main>
    </div>
  );
}
