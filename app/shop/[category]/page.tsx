import type { Metadata } from "next";
import Link from "next/link";

import { getCategoryBySlug } from "@/lib/shop/category";
import { getProductBySlug } from "@/lib/shop/product";
import { cn } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/home/product-card";
import { ProductDetail } from "@/components/shop/product-detail";
import { EmptyState } from "@/components/home/empty-state";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sub?: string }>;
};

// This route resolves the same `/shop/:slug` URL two ways: first as a
// category slug (the existing listing below), and — if that doesn't match —
// as a product slug (`ProductCard` already links to `/shop/${product.slug}`).
// That keeps both existing links working without adding a second route.
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (category) {
    return { title: `${category.name} — Lapiita Karya` };
  }

  const product = await getProductBySlug(slug);
  if (product) {
    return { title: `${product.name} — Lapiita Karya` };
  }

  return { title: "Tidak ditemukan — Lapiita Karya" };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: slug } = await params;
  const { sub } = await searchParams;
  const category = await getCategoryBySlug(slug);
  const product = category ? null : await getProductBySlug(slug);

  // Only honor `sub` if it's actually one of this category's
  // subcategories — anything else falls back to showing everything.
  const activeSub =
    category && sub && category.subcategories.some((s) => s.slug === sub)
      ? sub
      : null;

  const displayedProducts = category
    ? activeSub
      ? category.products.filter((p) => p.categorySlug === activeSub)
      : category.products
    : [];

  const filterButtonClass = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200",
      active
        ? "bg-ink text-paper shadow-sm"
        : "border border-line text-slate hover:border-ink/25 hover:bg-cloud/60 hover:text-ink"
    );

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            {category ? (
              <>
                <SectionHeading
                  eyebrow="Belanja"
                  title={category.name}
                  description={category.description}
                />

                {category.subcategories.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/shop/${category.slug}`}
                      aria-pressed={!activeSub}
                      className={filterButtonClass(!activeSub)}
                    >
                      Semua
                    </Link>
                    {category.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.slug}
                        href={`/shop/${category.slug}?sub=${subcategory.slug}`}
                        aria-pressed={activeSub === subcategory.slug}
                        className={filterButtonClass(activeSub === subcategory.slug)}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-slate">
                  <span>{displayedProducts.length} produk</span>
                </div>

                {displayedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {displayedProducts.map((item) => (
                      <ProductCard key={item.id} product={item} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Belum ada produk di kategori ini — silakan cek kembali nanti." />
                )}
              </>
            ) : product ? (
              <ProductDetail product={product} />
            ) : (
              <>
                <SectionHeading
                  eyebrow="Belanja"
                  title="Halaman tidak ditemukan"
                  description="Halaman ini mungkin sudah dipindahkan atau belum ada. Coba lihat toko kami secara lengkap."
                />
                <EmptyState message="Coba pilih Fashion, Makanan, atau Produksi dari menu di atas — atau kembali ke beranda untuk menjelajahi semua produk kami." />
              </>
            )}
          </Container>
        </section>
      </main>
    </div>
  );
}
