import { cn } from "@/lib/utils";
import type { MockProductStatus } from "@/lib/mock/products";

const STATUS_STYLES: Record<MockProductStatus, string> = {
  ACTIVE: "bg-signal/10 text-signal",
  DRAFT: "bg-cloud text-slate",
  ARCHIVED: "bg-ink/5 text-ink/50",
};

const STATUS_LABELS: Record<MockProductStatus, string> = {
  ACTIVE: "Aktif",
  DRAFT: "Draf",
  ARCHIVED: "Diarsipkan",
};

export function StatusBadge({ status }: { status: MockProductStatus }) {
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
