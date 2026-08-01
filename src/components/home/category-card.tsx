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
        "group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-2xl",
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

      <div className="relative flex flex-col gap-2 p-5">
        <span className="font-serif text-lg font-semibold text-paper">
          {category.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/70">
            {category.productCount}{" "}
            {category.productCount === 1 ? "piece" : "pieces"}
          </span>
          <span className="inline-flex items-center rounded-full bg-paper/90 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Shop now
          </span>
        </div>
      </div>
    </Link>
  );
}
