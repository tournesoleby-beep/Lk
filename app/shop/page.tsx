import type { Metadata } from "next";

import { getShopProducts } from "@/lib/shop/products";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ShopBrowser } from "@/components/shop/shop-browser";

export const metadata: Metadata = {
  title: "Shop — Lapiita Karya",
};

type ShopPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { q, category } = await searchParams;
  const products = await getShopProducts();

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="Shop"
              title="Everything we carry"
              description="Search, filter by category, or sort by price to find what you're after."
            />

            <ShopBrowser
              initialProducts={products}
              initialQuery={q ?? ""}
              initialCategory={category ?? "ALL"}
            />
          </Container>
        </section>
      </main>
    </div>
  );
}
