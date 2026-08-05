import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Privacy policy — Lapiita Karya",
};

const SECTIONS = [
  {
    title: "Data yang kami kumpulkan",
    body: "Saat Anda membuat pesanan, kami mengumpulkan data yang diperlukan untuk memprosesnya: nama, nomor telepon, alamat email, dan alamat pengiriman Anda. Kami tidak mewajibkan akun, dan tidak mengumpulkan data di luar yang dibutuhkan saat checkout.",
  },
  {
    title: "Bagaimana data digunakan",
    body: "Data Anda digunakan untuk memproses dan mengirim pesanan, mengirim pembaruan status pesanan dan pembayaran, serta membalas jika Anda menghubungi kami. Kami tidak menjual informasi Anda ke pihak ketiga.",
  },
  {
    title: "Informasi pembayaran",
    body: "Pembayaran dilakukan melalui transfer bank manual. Kami meminta Anda mengunggah tangkapan layar atau foto konfirmasi pembayaran agar dapat kami verifikasi; bukti ini hanya digunakan untuk memastikan pembayaran Anda.",
  },
  {
    title: "Cookie & data lokal",
    body: "Keranjang belanja dan wishlist Anda disimpan di browser untuk sesi ini agar situs berjalan lancar saat Anda berbelanja — data ini tidak dibagikan atau digunakan untuk pelacakan.",
  },
  {
    title: "Menghubungi kami",
    body: "Jika Anda memiliki pertanyaan tentang data Anda atau ingin menghapusnya, hubungi kami melalui halaman kontak dan kami akan membalas secepatnya.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Perusahaan"
              title="Kebijakan privasi"
              description="Bagaimana Lapiita Karya mengumpulkan dan menggunakan informasi Anda."
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
