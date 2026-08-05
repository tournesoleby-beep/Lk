import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Tentang Kami — Lapiita Karya",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Perusahaan"
              title="Tentang Lapiita Karya"
              description="Produk yang dipikirkan matang, dibuat untuk awet."
            />

            <div className="flex max-w-2xl flex-col gap-6 text-base leading-relaxed text-slate">
              <p>
                Lapiita Karya lahir dari sebuah keresahan sederhana: terlalu
                banyak produk yang dijual saat ini dirancang untuk cepat
                diganti, bukan untuk terus dipakai. Kami ingin membangun
                katalog kecil dan terfokus berisi pakaian, makanan, dan hasil
                produksi yang dipilih berdasarkan kualitas pembuatannya —
                bukan seberapa cepat bisa dikirim.
              </p>
              <p>
                Setiap produk yang kami jual dipilih berdasarkan bahan,
                kesesuaian, dan fungsinya terlebih dahulu. Kami bekerja sama
                dengan sejumlah kecil pengrajin yang kami percaya,
                mengutamakan bahan alami sebisa mungkin, dan lebih memilih
                menawarkan lebih sedikit produk yang benar-benar berkualitas
                daripada katalog yang dibuat penuh sekadar untuk terlihat
                ramai.
              </p>
              <p>
                Kami adalah tim kecil, dan kami membaca setiap pesan yang
                masuk melalui{" "}
                <a
                  href="/contact"
                  className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
                >
                  halaman kontak
                </a>
                . Jika Anda punya pertanyaan tentang produk, pesanan, atau
                sekadar ingin menyapa, kami senang mendengarnya.
              </p>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
