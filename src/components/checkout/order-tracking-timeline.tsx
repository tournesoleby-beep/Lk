import type { OrderStatus } from "@prisma/client";
import {
  Check,
  Handshake,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  ShieldCheck,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type TimelineStep = {
  label: string;
  icon: LucideIcon;
};

// The 7 customer-facing milestones for the happy-path order journey. This
// store sells ready-stock (finished) products, not made-to-order — so the
// journey is "verify payment → process/pick the order → pack → ship",
// never a production step. Presentational only — this list (and the
// mapping below) exists purely to describe what's already reflected in
// `order.status`; it doesn't read or write anything itself and has no
// bearing on order logic.
const STEPS: TimelineStep[] = [
  { label: "Menunggu Pembayaran", icon: Wallet },
  { label: "Pembayaran Diverifikasi", icon: ShieldCheck },
  { label: "Pesanan Diproses", icon: PackageSearch },
  { label: "Sedang Dikemas", icon: PackageOpen },
  { label: "Diserahkan ke Kurir", icon: Handshake },
  { label: "Dalam Pengiriman", icon: Truck },
  { label: "Pesanan Selesai", icon: PackageCheck },
];

// Maps the database's OrderStatus to a 1-indexed position in STEPS. Some
// statuses (e.g. PROCESSING covers both "order processing/picking" and
// "packing") don't have a dedicated status of their own, so the mapping
// makes a best-effort, display-only judgment call about how far along that
// stage typically is — it never reads from or writes back to the order
// itself.
function getCurrentStepIndex(status: OrderStatus): number | null {
  switch (status) {
    case "PENDING":
      return 1;
    case "WAITING_VERIFICATION":
      return 2;
    case "PAID":
      return 3; // payment verified, order moves into processing/picking
    case "PROCESSING":
      return 4; // assumes picking is done and it's now being packed
    case "SHIPPED":
      return 6;
    case "DELIVERED":
      return 7;
    // Cancelled / refunded / payment-rejected orders have stepped off the
    // normal fulfillment path — a forward-moving timeline doesn't apply,
    // so the caller falls back to the existing status badge for those.
    case "CANCELLED":
    case "REFUNDED":
    case "PAYMENT_REJECTED":
      return null;
  }
}

// Lets callers decide whether it's worth rendering a wrapper (heading,
// border, spacing) around this component at all, since it renders nothing
// for cancelled / refunded / payment-rejected orders.
export function hasTrackingTimeline(status: OrderStatus): boolean {
  return getCurrentStepIndex(status) !== null;
}

export function OrderTrackingTimeline({ status }: { status: OrderStatus }) {
  const currentStep = getCurrentStepIndex(status);

  if (currentStep === null) return null;

  return (
    <ol className="flex flex-col">
      {STEPS.map(({ label, icon: Icon }, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <li key={label} className="flex gap-3.5 sm:gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 sm:h-9 sm:w-9",
                  isCompleted && "border-ink bg-ink text-paper",
                  isCurrent &&
                    "border-signal bg-accent-soft text-signal ring-4 ring-signal/10",
                  !isCompleted && !isCurrent && "border-line bg-cloud text-slate/50"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                )}
              </div>
              {!isLast ? (
                <div
                  className={cn(
                    "w-px flex-1 transition-colors duration-300",
                    isCompleted ? "bg-ink" : "bg-line"
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </div>

            <div className={cn("flex flex-col gap-0.5", !isLast && "pb-5 sm:pb-6")}>
              {isCurrent ? (
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-signal">
                  Status saat ini
                </span>
              ) : null}
              <span
                className={cn(
                  "text-sm font-medium leading-snug sm:text-[0.9375rem]",
                  isCompleted && "text-ink",
                  isCurrent && "text-ink",
                  !isCompleted && !isCurrent && "text-slate/60"
                )}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
