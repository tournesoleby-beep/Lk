"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";

export default function CartPage() {
  const cart = useCart();
  const currency = cart.lines[0]?.currency ?? "IDR";

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-10 sm:py-16 md:py-24">
          <Container className="flex flex-col gap-8 sm:gap-10">
            <SectionHeading eyebrow="Belanja" title="Keranjang Anda" />

            {cart.lines.length === 0 ? (
              <div className="flex flex-col items-center gap-6">
                <EmptyState message="Keranjang Anda kosong. Produk yang Anda tambahkan akan muncul di sini." />
                <Link
                  href="/shop"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                  Lanjutkan Belanja
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
                {/* Line items */}
                <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line shadow-xs">
                  {cart.lines.map((line) => (
                    <li key={line.id} className="flex gap-3 p-4 sm:gap-6 sm:p-5">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cloud shadow-xs sm:h-32 sm:w-28">
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
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-medium leading-snug text-ink sm:text-base">
                            {line.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => cart.removeItem(line.id)}
                            aria-label={`Hapus ${line.name} dari keranjang`}
                            className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center text-slate transition-all duration-200 hover:scale-110 hover:text-signal active:scale-95 sm:-m-2 sm:h-9 sm:w-9"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>

                        <span className="font-mono text-sm text-slate">
                          {formatCurrency(line.price, line.currency)} / item
                        </span>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center rounded-full border border-line">
                            <button
                              type="button"
                              onClick={() =>
                                cart.updateQuantity(line.id, line.quantity - 1)
                              }
                              aria-label={`Kurangi jumlah ${line.name}`}
                              className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:bg-cloud active:scale-90 sm:h-8 sm:w-8"
                            >
                              <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                            <span className="w-7 text-center font-mono text-xs text-ink">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                cart.updateQuantity(line.id, line.quantity + 1)
                              }
                              aria-label={`Tambah jumlah ${line.name}`}
                              className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:bg-cloud active:scale-90 sm:h-8 sm:w-8"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          </div>

                          <span className="font-mono text-sm font-medium text-ink">
                            {formatCurrency(
                              line.price * line.quantity,
                              line.currency
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Summary */}
                <div className="flex flex-col gap-4 rounded-2xl border border-line bg-cloud/40 p-5 shadow-xs sm:p-6">
                  <h2 className="font-serif text-lg font-semibold text-ink">
                    Ringkasan Pesanan
                  </h2>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate">
                      Subtotal ({cart.count}{" "}
                      {cart.count === 1 ? "produk" : "produk"})
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
                    Ongkos kirim dan pajak dihitung saat checkout.
                  </p>

                  <Link
                    href="/checkout"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/shop"
                    className="flex min-h-11 items-center justify-center text-center text-sm font-medium text-ink underline underline-offset-4 transition-colors duration-200 hover:text-signal"
                  >
                    Lanjutkan Belanja
                  </Link>
                </div>
              </div>
            )}
          </Container>
        </section>
      </main>
    </div>
  );
}
