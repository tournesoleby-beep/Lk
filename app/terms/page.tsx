import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Terms of service — Lapiita Karya",
};

const SECTIONS = [
  {
    title: "Pesanan",
    body: "Membuat pesanan berarti mengajukan penawaran pembelian, yang kami konfirmasi setelah pembayaran Anda terverifikasi. Kami berhak menolak atau membatalkan pesanan — misalnya jika produk sudah tidak tersedia — dan akan memberi tahu Anda jika hal itu terjadi.",
  },
  {
    title: "Harga & pembayaran",
    body: "Harga ditampilkan dalam mata uang yang tertera saat checkout dan dikenakan sesuai total yang ditampilkan. Pembayaran dilakukan melalui transfer bank manual atau QRIS; pesanan Anda dikonfirmasi setelah bukti pembayaran diverifikasi.",
  },
  {
    title: "Pengiriman & pengembalian",
    body: "Estimasi waktu pengiriman dan kebijakan pengembalian 60 hari kami dijelaskan pada halaman Pengiriman & Pengembalian, yang merupakan bagian dari syarat dan ketentuan ini.",
  },
  {
    title: "Informasi produk",
    body: "Kami berusaha sebaik mungkin untuk mendeskripsikan dan memotret setiap produk secara akurat. Variasi kecil pada warna atau hasil akhir dapat terjadi, terutama pada bahan alami.",
  },
  {
    title: "Perubahan syarat dan ketentuan",
    body: "Kami dapat memperbarui syarat dan ketentuan ini dari waktu ke waktu seiring perkembangan toko. Versi yang ditampilkan di sini selalu merupakan versi terbaru.",
  },
] as const;

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Perusahaan"
              title="Syarat dan ketentuan"
              description="Ketentuan yang berlaku saat Anda berbelanja di Lapiita Karya."
            />

            <div className="flex max-w-2xl flex-col gap-8">
              {SECTIONS.map((section) => (
                <div key={section.title} className="flex flex-col gap-2">
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {section.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
