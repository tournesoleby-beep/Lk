import { cn } from "@/lib/utils";
import type { MockProductStatus } from "@/lib/mock/products";

const STATUS_STYLES: Record<MockProductStatus, string> = {
  ACTIVE: "bg-signal/10 text-signal",
  DRAFT: "bg-cloud text-slate",
  ARCHIVED: "bg-ink/5 text-ink/50",
};

const STATUS_LABELS: Record<MockProductStatus, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: MockProductStatus }) {
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
