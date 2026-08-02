import { cn } from "@/lib/utils";

export function GalleryCounter({
  index,
  count,
  className,
}: {
  index: number;
  count: number;
  className?: string;
}) {
  if (count <= 1) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-10 rounded-full bg-ink/55 px-2.5 py-1 font-mono text-[11px] font-medium tabular-nums text-paper shadow-sm backdrop-blur-sm transition-opacity duration-300",
        className
      )}
    >
      {index + 1} / {count}
    </div>
  );
}
