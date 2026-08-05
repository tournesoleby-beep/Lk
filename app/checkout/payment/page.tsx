import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { getOrderForPayment } from "@/lib/checkout/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BANK_NAME,
  BANK_ACCOUNT_NUMBER,
  BANK_ACCOUNT_HOLDER,
  QRIS_IMAGE_URL,
  PAYMENT_DEADLINE_HOURS,
} from "@/lib/payment/config";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";
import { PaymentProofUpload } from "@/components/checkout/payment-proof-upload";

export const metadata: Metadata = {
  title: "Selesaikan Pembayaran — Lapiita Karya",
};

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";

// Statuses where payment is already settled one way or another — the
// upload form no longer applies.
const CONFIRMED_STATUSES = new Set(["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]);
const CLOSED_STATUSES = new Set(["CANCELLED", "REFUNDED"]);

export default async function CheckoutPaymentPage({
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
              <SectionHeading eyebrow="Belanja" title="Pembayaran" align="center" />
              <EmptyState message="Pesanan tidak ditemukan. Periksa kembali tautannya, atau buat pesanan baru dari toko." />
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Lanjutkan Belanja
              </Link>
            </Container>
          </section>
        </main>
      </div>
    );
  }

  const deadline = new Date(
    new Date(order.createdAt).getTime() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000
  );

  const isConfirmed = CONFIRMED_STATUSES.has(order.status);
  const isClosed = CLOSED_STATUSES.has(order.status);
  const isWaitingVerification = order.status === "WAITING_VERIFICATION";
  const wasRejected = order.status === "PAYMENT_REJECTED";
  const canUploadProof = !isConfirmed && !isClosed && !isWaitingVerification;

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-10 sm:py-16 md:py-24">
          <Container className="flex flex-col gap-8 sm:gap-10">
            <SectionHeading
              eyebrow="Belanja"
              title="Selesaikan Pembayaran"
              description={`Pesanan ${order.orderNumber}`}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
              {/* Main panel — status-dependent */}
              <div className="flex flex-col gap-6 rounded-2xl border border-line p-5 shadow-xs sm:p-6">
                {isConfirmed ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-signal">
                      <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h2 className="font-serif text-lg font-semibold text-ink">
                        Pembayaran dikonfirmasi
                      </h2>
                      <p className="mt-1 text-sm text-slate">
                        Kami telah memverifikasi pembayaran Anda. Kami akan menghubungi Anda saat
                        pesanan sedang disiapkan.
                      </p>
                    </div>
                  </div>
                ) : isClosed ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cloud text-slate">
                      <XCircle className="h-7 w-7" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h2 className="font-serif text-lg font-semibold text-ink">
                        Pesanan ini sudah tidak aktif
                      </h2>
                      <p className="mt-1 text-sm text-slate">
                        Hubungi kami jika Anda merasa ini adalah kesalahan.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {isWaitingVerification ? (
                      <div className="flex items-start gap-3 rounded-xl bg-cloud/60 px-4 py-3.5">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate" strokeWidth={1.75} />
                        <p className="text-sm text-ink">
                          Kami telah menerima bukti pembayaran Anda dan sedang memverifikasinya.
                          Proses ini biasanya hanya butuh waktu singkat — kami akan mengirim email
                          setelah dikonfirmasi.
                        </p>
                      </div>
                    ) : null}

                    {wasRejected ? (
                      <div className="flex items-start gap-3 rounded-xl bg-accent-soft px-4 py-3.5">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-signal" strokeWidth={1.75} />
                        <p className="text-sm text-signal">
                          Kami tidak dapat memverifikasi bukti pembayaran terakhir Anda. Silakan periksa
                          kembali transfer Anda dan unggah bukti baru di bawah ini.
                        </p>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-4">
                      <h2 className="font-serif text-lg font-semibold text-ink">
                        Detail Transfer Bank
                      </h2>

                      <dl className="grid grid-cols-1 gap-3 rounded-xl bg-cloud/40 p-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-0.5">
                          <dt className={LABEL_CLASS}>Bank</dt>
                          <dd className="text-sm text-ink">{BANK_NAME || "—"}</dd>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <dt className={LABEL_CLASS}>Nomor rekening</dt>
                          <dd className="font-mono text-sm text-ink">
                            {BANK_ACCOUNT_NUMBER || "—"}
                          </dd>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:col-span-2">
                          <dt className={LABEL_CLASS}>Atas nama</dt>
                          <dd className="text-sm text-ink">{BANK_ACCOUNT_HOLDER || "—"}</dd>
                        </div>
                      </dl>

                      {QRIS_IMAGE_URL ? (
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-line p-4">
                          <span className={LABEL_CLASS}>Atau pindai QRIS</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={QRIS_IMAGE_URL}
                            alt="Kode QRIS untuk pembayaran"
                            className="h-44 w-44 rounded-lg object-contain shadow-xs sm:h-56 sm:w-56"
                          />
                        </div>
                      ) : null}

                      <div className="rounded-xl bg-cloud/40 p-4 text-sm leading-relaxed text-slate">
                        <p className="font-medium text-ink">Instruksi pembayaran</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-4">
                          <li>
                            Transfer sesuai total tepat sebesar{" "}
                            <span className="font-mono text-ink">
                              {formatCurrency(order.total, order.currency)}
                            </span>{" "}
                            ke rekening di atas, atau pindai kode QRIS.
                          </li>
                          <li>Ambil tangkapan layar atau foto konfirmasi pembayaran Anda.</li>
                          <li>Unggah di bawah ini agar kami dapat memverifikasi pembayaran Anda.</li>
                        </ol>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-signal">
                        <Clock className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span>
                          Harap bayar sebelum{" "}
                          <span className="font-medium">{formatDate(deadline, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}</span>
                          .
                        </span>
                      </div>
                    </div>

                    {canUploadProof ? (
                      <PaymentProofUpload orderId={order.id} orderNumber={order.orderNumber} />
                    ) : null}
                  </>
                )}
              </div>

              {/* Order summary */}
              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-cloud/40 p-5 shadow-xs sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-ink">Ringkasan Pesanan</h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Nomor pesanan</span>
                  <span className="font-mono text-ink">{order.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="font-medium text-ink">Total tagihan</span>
                  <span className="font-mono text-base font-semibold text-ink">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
