import type { Metadata } from "next";

import { getAdminOrders } from "@/lib/admin/orders";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";
import { OrdersManager } from "@/components/admin/orders-manager";

export const metadata: Metadata = {
  title: "Orders — Admin — Lapiita Karya",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />
        <OrdersManager initialOrders={orders} />
      </Container>
    </div>
  );
}
