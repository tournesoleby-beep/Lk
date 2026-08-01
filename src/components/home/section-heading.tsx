import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      <span
        className={cn(
          "font-mono text-[11px] font-medium uppercase tracking-[0.2em]",
          tone === "dark" ? "text-signal" : "text-signal"
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "font-serif text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem]",
          tone === "dark" ? "text-paper" : "text-ink"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-balance text-base leading-relaxed sm:text-lg",
            tone === "dark" ? "text-white/60" : "text-slate"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
