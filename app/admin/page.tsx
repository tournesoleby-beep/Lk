import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Package, Receipt } from "lucide-react";

import { getAdminOrders } from "@/lib/admin/orders";
import { getAdminProducts } from "@/lib/admin/products";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Dashboard — Admin — Lapiita Karya",
};

export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([
    getAdminOrders(),
    getAdminProducts(),
  ]);

  const pendingOrders = orders.filter((order) =>
    ["PENDING", "WAITING_VERIFICATION"].includes(order.status)
  ).length;

  const cards = [
    {
      label: "Products",
      icon: Package,
      value: products.length,
      caption: products.length === 1 ? "product in catalog" : "products in catalog",
      href: "/admin/products",
    },
    {
      label: "Orders",
      icon: Receipt,
      value: orders.length,
      caption:
        pendingOrders > 0
          ? `${pendingOrders} awaiting action`
          : "all caught up",
      href: "/admin/orders",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
            Admin
          </span>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="text-sm text-slate">
            A quick overview of the store. Jump into products or orders below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(({ label, icon: Icon, value, caption, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-slate transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal"
                  strokeWidth={1.75}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-3xl font-semibold text-ink">
                  {value}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
                  {label} — {caption}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
