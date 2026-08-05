import Link from "next/link";

import type { CategoryCardData } from "@/lib/queries/home";
import { cn } from "@/lib/utils";
import { PlaceholderTile } from "@/components/home/placeholder-tile";

export function CategoryCard({
  category,
  className,
}: {
  category: CategoryCardData;
  className?: string;
}) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className={cn(
        "group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-2xl shadow-xs transition-shadow duration-300 hover:shadow-lg",
        className
      )}
    >
      {category.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.imageUrl}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <PlaceholderTile
          seed={category.id}
          label={category.name}
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent transition-opacity duration-300 group-hover:from-black/75" />

      <div className="relative flex flex-col gap-1.5 p-4 sm:gap-2 sm:p-5">
        <span className="font-serif text-base font-semibold text-paper sm:text-lg">
          {category.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-white/70 sm:text-xs">
            {category.productCount}{" "}
            produk
          </span>
          {/* Visible by default on touch screens (no hover state to reveal
              it); fades in on hover for pointer devices instead. */}
          <span className="inline-flex items-center rounded-full bg-paper/90 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
            Belanja Sekarang
          </span>
        </div>
      </div>
    </Link>
  );
}
