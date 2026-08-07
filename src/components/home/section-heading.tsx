import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
  // Opt-in; defaults to false so existing callers (about, faq, checkout,
  // cart, etc.) are unaffected. Homepage sections pass compact=true for
  // tighter mobile spacing; tablet/desktop styling stays the same either way.
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        compact && "gap-2.5 sm:gap-4",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      <span
        className={cn(
          "font-mono text-[11px] font-medium uppercase tracking-[0.2em]",
          compact && "text-[10px] tracking-[0.15em] sm:text-[11px] sm:tracking-[0.2em]",
          tone === "dark" ? "text-signal" : "text-signal"
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "font-serif text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem]",
          compact && "text-[1.625rem] leading-[1.18] sm:text-[2.75rem] sm:leading-[1.1]",
          tone === "dark" ? "text-paper" : "text-ink"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-balance text-base leading-relaxed sm:text-lg",
            compact && "text-[0.9375rem] leading-[1.5] sm:text-lg sm:leading-relaxed",
            tone === "dark" ? "text-white/60" : "text-slate"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
