import type { Metadata } from "next";

import { getAdminProducts } from "@/lib/admin/products";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProductsManager } from "@/components/admin/products-manager";

export const metadata: Metadata = {
  title: "Products — Admin — Lapiita Karya",
};

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />
        <ProductsManager initialProducts={products} />
      </Container>
    </div>
  );
}
