"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

import { updateOrderStatus } from "@/lib/admin/order-actions";
import { ORDER_STATUS_LABELS } from "@/components/admin/order-status-badge";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "WAITING_VERIFICATION",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "PAYMENT_REJECTED",
];

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<OrderStatus>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    const result = await updateOrderStatus(orderId, selected);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  const hasChanged = selected !== currentStatus;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
          Status Pesanan
        </span>
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value as OrderStatus)}
          className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasChanged || isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        ) : null}
        {isSubmitting ? "Memperbarui…" : "Perbarui Status"}
      </button>
    </div>
  );
}
