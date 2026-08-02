import type { Metadata } from "next";

import { Container } from "@/components/home/container";
import { ProductsManager } from "@/components/admin/products-manager";

export const metadata: Metadata = {
  title: "Products — Admin — Lapiita Karya",
};

export default function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container>
        <ProductsManager />
      </Container>
    </div>
  );
}
