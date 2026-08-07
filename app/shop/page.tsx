import type { Metadata } from "next";

import { getShopProducts } from "@/lib/shop/products";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ShopBrowser } from "@/components/shop/shop-browser";

export const metadata: Metadata = {
  title: "Toko — Lapiita Karya",
};

type ShopPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { q, category } = await searchParams;
  const products = await getShopProducts();

  // `fashion` is the parent category — filter chips are its subcategories
  // (tas-rajut, aksesoris, etc.), so a product's `category.slug` never
  // equals "fashion" and the filter would otherwise match nothing.
  // Treat the parent slug as "show everything" instead.
  const normalizedCategory = category === "fashion" ? "ALL" : category;

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="Belanja"
              title="Semua Produk Kami"
              description="Cari, filter berdasarkan kategori, atau urutkan berdasarkan harga untuk menemukan yang Anda cari."
            />

            <ShopBrowser
              initialProducts={products}
              initialQuery={q ?? ""}
              initialCategory={normalizedCategory ?? "ALL"}
            />
          </Container>
        </section>
      </main>
    </div>
  );
}
