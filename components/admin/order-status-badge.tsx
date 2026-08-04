import type { OrderStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-cloud text-slate",
  WAITING_VERIFICATION: "bg-gold/10 text-gold",
  PAID: "bg-accent-soft text-signal",
  PROCESSING: "bg-gold/10 text-gold",
  SHIPPED: "bg-ink/10 text-ink",
  DELIVERED: "bg-ink text-paper",
  CANCELLED: "bg-signal/10 text-signal",
  REFUNDED: "bg-ink/5 text-ink/50",
  PAYMENT_REJECTED: "bg-signal/10 text-signal",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Menunggu Pembayaran",
  WAITING_VERIFICATION: "Menunggu Verifikasi",
  PAID: "Sudah Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dana Dikembalikan",
  PAYMENT_REJECTED: "Pembayaran Ditolak",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ring-1 ring-inset ring-current/10",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export const ORDER_STATUS_LABELS = STATUS_LABELS;
