"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { updateOrderStatus } from "@/lib/admin/order-actions";

/**
 * Approve/Reject buttons for a manual bank-transfer payment proof.
 *
 * Deliberately thin: both actions just call the existing `updateOrderStatus`
 * (see src/lib/admin/order-actions.ts) — approving sets the order to PAID,
 * rejecting sets it to PAYMENT_REJECTED. That function already emails the
 * customer on every status change, so no new email logic is needed here.
 */
export function PaymentVerification({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision(decision: "approve" | "reject") {
    setError(null);
    setPending(decision);

    const result = await updateOrderStatus(
      orderId,
      decision === "approve" ? "PAID" : "PAYMENT_REJECTED"
    );

    setPending(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate">
        Pelanggan akan menerima email otomatis setelah Anda memutuskan.
      </p>

      {error ? (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleDecision("approve")}
          disabled={pending !== null}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {pending === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
          ) : null}
          {pending === "approve" ? "Menyetujui…" : "Setujui Pembayaran"}
        </button>

        <button
          type="button"
          onClick={() => handleDecision("reject")}
          disabled={pending !== null}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-signal transition-all duration-200 hover:bg-accent-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {pending === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
          ) : null}
          {pending === "reject" ? "Menolak…" : "Tolak Pembayaran"}
        </button>
      </div>
    </div>
  );
}
