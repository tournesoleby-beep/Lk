import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Keberlanjutan — Lapiita Karya",
};

const COMMITMENTS = [
  {
    title: "Dibuat Untuk Awet",
    body: "Kami memilih bahan, konstruksi, dan finishing dengan mengutamakan ketahanan, sehingga produk bisa digunakan bertahun-tahun, bukan hanya satu musim.",
  },
  {
    title: "Lebih Sedikit, Lebih Bermakna",
    body: "Kami lebih memilih katalog yang kecil dan terkurasi daripada yang terlalu luas — lebih sedikit produksi berlebih, lebih sedikit limbah, lebih sedikit kebisingan.",
  },
  {
    title: "Pengrajin Terpercaya",
    body: "Kami bekerja sama dengan sejumlah kecil mitra produksi yang kami kenal secara langsung, bukan pemasok anonim yang terus berganti.",
  },
] as const;

export default function SustainabilityPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="Perusahaan"
              title="Keberlanjutan"
              description="Produk yang dipikirkan matang dan dibuat untuk awet — bukan sekadar slogan. Berikut artinya dalam praktik."
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {COMMITMENTS.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-2xl border border-line p-6"
                >
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-slate">
              Kami adalah tim kecil dan pekerjaan ini terus berlanjut — jika Anda
              memiliki pertanyaan tentang produk atau bahan tertentu, hubungi kami melalui{" "}
              <a
                href="/contact"
                className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
              >
                halaman kontak
              </a>{" "}
              dan kami akan membalas langsung.
            </p>
          </Container>
        </section>
      </main>
    </div>
  );
}
