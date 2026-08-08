import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Pengiriman & Pengembalian — Lapiita Karya",
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
              eyebrow="Bantuan"
              title="Pengiriman & Pengembalian"
              description="Apa yang bisa Anda harapkan setelah membuat pesanan."
            />

            <div className="flex flex-col gap-3 rounded-2xl border border-line p-6">
              <span className={LABEL_CLASS}>Pengiriman</span>
              <p className="text-sm leading-relaxed text-slate">
                Pesanan disiapkan setelah pembayaran diverifikasi, dan kami
                akan mengirimkan pesan WhatsApp dan Email saat pesanan Anda
                diproses dan dikirim.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-cloud/40 p-6">
              <span className={LABEL_CLASS}>Ada pertanyaan tentang pesanan tertentu?</span>
              <p className="max-w-2xl text-sm leading-relaxed text-slate">
                Anda dapat memeriksa status pesanan kapan saja di{" "}
                <a
                  href="/orders/lookup"
                  className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
                >
                  halaman lacak pesanan
                </a>
                , atau hubungi kami melalui{" "}
                <a
                  href="/contact"
                  className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
                >
                  halaman kontak
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
