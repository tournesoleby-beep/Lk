import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "FAQ — Lapiita Karya",
};

const FAQS = [
  {
    question: "Apakah saya perlu akun untuk memesan?",
    answer:
      "Tidak. Lapiita Karya tidak menggunakan akun pelanggan — menjelajah, keranjang, wishlist, dan checkout semuanya bisa dilakukan sebagai tamu. Anda hanya perlu nama, nomor telepon, dan email untuk membuat pesanan.",
  },
  {
    question: "Bagaimana cara membayar?",
    answer:
      "Pembayaran dilakukan melalui transfer bank manual (atau QRIS, jika tersedia). Setelah membuat pesanan, Anda akan diarahkan ke halaman pembayaran dengan detail rekening dan formulir unggah bukti pembayaran.",
  },
  {
    question: "Berapa lama proses verifikasi?",
    answer:
      "Setelah Anda mengunggah bukti pembayaran, tim kami akan memeriksanya dan memperbarui status pesanan Anda — biasanya dalam waktu singkat. Anda dapat melihat status terkini kapan saja di halaman pembayaran menggunakan nomor pesanan Anda.",
  },
  {
    question: "Bagaimana cara melacak pesanan?",
    answer:
      "Gunakan tautan \"Lacak Pesanan\" di menu atau footer, lalu masukkan nomor pesanan Anda. Nomor ini bisa ditemukan di email konfirmasi atau di halaman pembayaran yang muncul setelah checkout.",
  },
  {
    question: "Bagaimana kebijakan pengembalian barang?",
    answer:
      "Kami menyediakan retur mudah dalam 60 hari setelah barang diterima. Lihat halaman Pengiriman & Pengembalian kami untuk detail lengkapnya.",
  },
  {
    question: "Bagaimana cara menghubungi Anda?",
    answer:
      "Kirim pesan melalui halaman Hubungi Kami dan kami akan membalas secepat mungkin.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Bantuan"
              title="Pertanyaan yang sering diajukan"
              description="Semua yang perlu Anda ketahui tentang memesan, membayar, dan melacak pesanan di Lapiita Karya."
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
