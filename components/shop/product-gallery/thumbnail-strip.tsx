import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/components/shop/product-gallery/types";

export function ThumbnailStrip({
  images,
  activeIndex,
  onSelect,
  productName,
  size = "md",
  className,
}: {
  images: GalleryImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
  productName: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "h-12 w-12" : "h-16 w-16";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {images.map((img, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={img.url + index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Show image ${index + 1}`}
            aria-pressed={active}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-xl border transition-all duration-300 ease-out",
              sizeClass,
              active
                ? "scale-100 border-ink shadow-sm"
                : "scale-[0.92] border-line/70 opacity-70 hover:opacity-100"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.altText ?? productName}
              className="h-full w-full object-cover"
              draggable={false}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 rounded-xl ring-2 ring-ink transition-opacity duration-300",
                active ? "opacity-100" : "opacity-0"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
