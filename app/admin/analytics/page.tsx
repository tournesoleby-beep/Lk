import type { Metadata } from "next";
import { Banknote, Clock, Package, Receipt } from "lucide-react";

import {
  getAdminAnalyticsOverview,
  getAdminRevenueByPeriod,
  getAdminRevenueDetails,
} from "@/lib/admin/analytics";
import { formatCurrency } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Analytics — Admin — Lapiita Karya",
};

export default async function AdminAnalyticsPage() {
  const [overview, revenueDetails, revenueByPeriod] = await Promise.all([
    getAdminAnalyticsOverview(),
    getAdminRevenueDetails(),
    getAdminRevenueByPeriod(),
  ]);

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
            Analitik
          </h1>
          <p className="text-sm text-slate">
            Ringkasan singkat performa toko.
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

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">
              Detail Pendapatan
            </h2>
            <p className="text-sm text-slate">
              Rincian pendapatan dari pesanan yang telah dikirim atau diterima.
            </p>
          </div>

          <div className="flex flex-col gap-1 border-b border-line pb-5">
            <span className="font-serif text-3xl font-semibold text-ink">
              {formatCurrency(revenueDetails.totalRevenue)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
              Total Pendapatan (Pesanan Selesai)
            </span>
          </div>

          <div className="flex flex-col divide-y divide-line">
            {revenueDetails.productsSold.length === 0 ? (
              <p className="py-3 text-sm text-slate">
                Belum ada produk terjual dari pesanan yang selesai.
              </p>
            ) : (
              revenueDetails.productsSold.map((product) => (
                <div
                  key={product.productName}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium text-ink">
                    {product.productName}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
                      {product.totalQuantitySold.toLocaleString("id-ID")}{" "}
                      terjual
                    </span>
                    <span className="font-serif text-sm font-semibold text-ink">
                      {formatCurrency(product.totalRevenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">
              Tren Pendapatan
            </h2>
            <p className="text-sm text-slate">
              Pendapatan bulanan dari pesanan yang telah dikirim atau diterima.
            </p>
          </div>

          {revenueByPeriod.length === 0 ? (
            <p className="py-3 text-sm text-slate">
              Belum ada data pendapatan bulanan.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {(() => {
                const maxRevenue = Math.max(
                  ...revenueByPeriod.map((item) => item.totalRevenue),
                  1
                );

                return revenueByPeriod.map((entry) => {
                  const widthPercent = Math.max(
                    (entry.totalRevenue / maxRevenue) * 100,
                    2
                  );

                  return (
                    <div key={entry.period} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
                          {entry.period}
                        </span>
                        <span className="font-serif text-sm font-semibold text-ink">
                          {formatCurrency(entry.totalRevenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-cloud">
                        <div
                          className="h-full rounded-full bg-signal"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
