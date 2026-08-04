import type { Metadata } from "next";
import { Banknote, Clock, Package, Receipt } from "lucide-react";

import { getAdminAnalyticsOverview } from "@/lib/admin/analytics";
import { formatCurrency } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Analytics — Admin — Lapiita Karya",
};

export default async function AdminAnalyticsPage() {
  const overview = await getAdminAnalyticsOverview();

  const cards = [
    {
      label: "Total Pesanan",
      icon: Receipt,
      value: overview.totalOrders.toLocaleString("id-ID"),
    },
    {
      label: "Total Pendapatan",
      icon: Banknote,
      value: formatCurrency(overview.totalRevenue),
    },
    {
      label: "Menunggu Pembayaran",
      icon: Clock,
      value: overview.pendingOrders.toLocaleString("id-ID"),
    },
    {
      label: "Total Produk",
      icon: Package,
      value: overview.totalProducts.toLocaleString("id-ID"),
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
            Analytics
          </h1>
          <p className="text-sm text-slate">
            A quick overview of store performance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, icon: Icon, value }) => (
            <div
              key={label}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 shadow-xs"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud text-ink">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-3xl font-semibold text-ink">
                  {value}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
