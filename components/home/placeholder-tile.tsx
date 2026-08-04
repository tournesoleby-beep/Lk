import { getInitials, getPlaceholderGradient } from "@/lib/utils";

export function PlaceholderTile({
  seed,
  label,
  className,
}: {
  seed: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ background: getPlaceholderGradient(seed) }}
      aria-hidden="true"
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="font-mono text-sm font-medium tracking-[0.15em] text-white/70">
          {getInitials(label)}
        </span>
      </div>
    </div>
  );
}
