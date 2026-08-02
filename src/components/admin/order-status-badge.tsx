import type { OrderStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-cloud text-slate",
  PAID: "bg-accent-soft text-signal",
  PROCESSING: "bg-gold/10 text-gold",
  SHIPPED: "bg-ink/10 text-ink",
  DELIVERED: "bg-ink text-paper",
  CANCELLED: "bg-signal/10 text-signal",
  REFUNDED: "bg-ink/5 text-ink/50",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export const ORDER_STATUS_LABELS = STATUS_LABELS;
