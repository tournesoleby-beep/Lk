import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getAdminOrderById } from "@/lib/admin/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";
import { EmptyState } from "@/components/home/empty-state";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";
import { PaymentVerification } from "@/components/admin/payment-verification";

export const metadata: Metadata = {
  title: "Order details — Admin — Lapiita Karya",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    return (
      <div className="min-h-screen bg-cloud/40 py-10">
        <Container className="flex flex-col gap-6">
          <AdminNav />
          <EmptyState message="Pesanan ini tidak ada, atau mungkin sudah dihapus." />
          <Link
            href="/admin/orders"
            className="group inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-slate transition-colors duration-200 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            Kembali ke Pesanan
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />

        <Link
          href="/admin/orders"
          className="group inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-slate transition-colors duration-200 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Kembali ke Pesanan
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
              Pesanan
            </span>
            <h1 className="font-serif text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-3xl">
              {order.orderNumber}
            </h1>
            <span className="text-sm text-slate">{formatDate(order.createdAt)}</span>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="flex flex-col gap-6">
            {/* Items */}
            <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-xs">
              <div className="border-b border-line px-6 py-4">
                <h2 className="font-serif text-lg font-semibold text-ink">Produk</h2>
              </div>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-cloud/60">
                    <th className="px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                      Produk
                    </th>
                    <th className="px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                      Harga satuan
                    </th>
                    <th className="px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-b-0">
                      <td className="px-6 py-3 text-ink">{item.name}</td>
                      <td className="px-6 py-3 font-mono text-ink">
                        {formatCurrency(item.price, order.currency)}
                      </td>
                      <td className="px-6 py-3 font-mono text-ink">{item.quantity}</td>
                      <td className="px-6 py-3 text-right font-mono text-ink">
                        {formatCurrency(item.price * item.quantity, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex flex-col gap-2 border-t border-line px-6 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Subtotal</span>
                  <span className="font-mono text-ink">
                    {formatCurrency(order.subtotal, order.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Ongkos Kirim</span>
                  <span className="font-mono text-ink">
                    {formatCurrency(order.shippingTotal, order.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Pajak</span>
                  <span className="font-mono text-ink">
                    {formatCurrency(order.taxTotal, order.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2 text-sm">
                  <span className="font-medium text-ink">Total</span>
                  <span className="font-mono text-base font-semibold text-ink">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="rounded-2xl border border-line bg-paper p-6 shadow-xs">
              <h2 className="font-serif text-lg font-semibold text-ink">Alamat Pengiriman</h2>
              {order.shippingAddress ? (
                <div className="mt-3 flex flex-col gap-3 text-sm text-ink">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {order.shippingAddress.line1}
                  </p>
                  {order.shippingAddress.notes ? (
                    <div className="rounded-xl bg-cloud/60 p-3">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                        Catatan
                      </span>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                        {order.shippingAddress.notes}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate">Tidak ada alamat pengiriman yang tercatat.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Customer */}
            <div className="rounded-2xl border border-line bg-paper p-6 shadow-xs">
              <h2 className="font-serif text-lg font-semibold text-ink">Pelanggan</h2>
              <dl className="mt-3 flex flex-col gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Nama
                  </dt>
                  <dd className="text-ink">{order.customerName}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Email
                  </dt>
                  <dd className="text-ink">{order.email}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate">
                    Telepon
                  </dt>
                  <dd className="text-ink">{order.phone}</dd>
                </div>
              </dl>
            </div>

            {/* Payment proof */}
            <div className="rounded-2xl border border-line bg-paper p-6 shadow-xs">
              <h2 className="font-serif text-lg font-semibold text-ink">Bukti Pembayaran</h2>
              {order.paymentProofUrl ? (
                <div className="mt-3 flex flex-col gap-4">
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-line transition-shadow duration-200 hover:shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.paymentProofUrl}
                      alt="Bukti pembayaran yang diunggah"
                      className="max-h-72 w-full object-contain bg-cloud/40"
                    />
                  </a>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-fit text-xs font-medium uppercase tracking-[0.1em] text-ink underline underline-offset-4 transition-colors duration-200 hover:text-signal"
                  >
                    Buka Ukuran Penuh
                  </a>
                  {order.paymentProofUploadedAt ? (
                    <span className="text-xs text-slate">
                      Diunggah {formatDate(order.paymentProofUploadedAt)}
                    </span>
                  ) : null}

                  {order.status === "WAITING_VERIFICATION" ? (
                    <PaymentVerification orderId={order.id} />
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate">
                  Pelanggan belum mengunggah bukti pembayaran.
                </p>
              )}
            </div>

            {/* Status update */}
            <div className="rounded-2xl border border-line bg-cloud/40 p-6 shadow-xs">
              <h2 className="font-serif text-lg font-semibold text-ink">Perbarui Status</h2>
              <p className="mt-1 text-sm text-slate">
                Pelanggan akan menerima email otomatis saat status berubah.
              </p>
              <div className="mt-4">
                <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
