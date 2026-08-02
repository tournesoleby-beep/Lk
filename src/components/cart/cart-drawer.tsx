"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";

export function CartDrawer() {
  const cart = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={cart.close}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          cart.isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-paper shadow-[-20px_0_60px_-30px_rgba(0,0,0,0.4)] transition-transform duration-300 ${
          cart.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            Your bag
            {cart.count > 0 ? (
              <span className="font-mono text-xs font-normal text-slate">
                ({cart.count})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={cart.close}
            aria-label="Close bag"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-cloud active:scale-95 sm:h-9 sm:w-9"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cloud">
              <ShoppingBag className="h-7 w-7 text-slate" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-medium text-ink">
                Your bag is empty
              </p>
              <p className="text-sm leading-relaxed text-slate">
                Save pieces you love here — they&apos;ll be ready when
                you&apos;re ready to check out.
              </p>
            </div>
            <button
              type="button"
              onClick={cart.close}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-4">
              {cart.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex gap-4 border-b border-line py-5 transition-colors first:pt-0"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cloud shadow-xs">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageUrl}
                        alt={line.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium leading-snug text-ink">
                        {line.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => cart.removeItem(line.id)}
                        aria-label={`Remove ${line.name} from bag`}
                        className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center text-slate transition-all duration-200 hover:scale-110 hover:text-signal active:scale-95 sm:-m-2 sm:h-9 sm:w-9"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>

                    <span className="font-mono text-sm text-ink">
                      {formatCurrency(line.price, line.currency)}
                    </span>

                    <div className="mt-auto flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() =>
                            cart.updateQuantity(line.id, line.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:bg-cloud active:scale-90 sm:h-9 sm:w-9"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                        <span className="w-6 text-center font-mono text-xs text-ink">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            cart.updateQuantity(line.id, line.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:bg-cloud active:scale-90 sm:h-9 sm:w-9"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-4 border-t border-line px-6 py-6 pb-safe">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">Subtotal</span>
                <span className="font-mono text-base font-medium text-ink">
                  {formatCurrency(
                    cart.subtotal,
                    cart.lines[0]?.currency ?? "IDR"
                  )}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate">
                Shipping and taxes calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={cart.close}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={cart.close}
                className="flex min-h-11 items-center justify-center text-center text-sm font-medium text-ink underline underline-offset-4 transition-colors duration-200 hover:text-signal"
              >
                View full bag
              </Link>
              <button
                type="button"
                onClick={cart.close}
                className="flex min-h-11 items-center justify-center text-center text-sm text-slate transition-colors duration-200 hover:text-ink"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
