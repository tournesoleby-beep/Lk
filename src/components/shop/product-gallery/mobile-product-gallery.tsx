"use client";

import { Maximize2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { BlurUpImage } from "@/components/shop/product-gallery/blur-up-image";
import { GalleryCounter } from "@/components/shop/product-gallery/gallery-counter";
import { ThumbnailStrip } from "@/components/shop/product-gallery/thumbnail-strip";
import { useGalleryStage } from "@/components/shop/product-gallery/use-gallery-stage";
import type { GalleryImage } from "@/components/shop/product-gallery/types";

/**
 * Mobile/tablet product gallery — the first thing the page shows.
 * Rendered full-bleed by its parent (which cancels the page container's
 * side/top padding), so this owns its own internal spacing rather than
 * relying on an ancestor's padding box.
 */
export function MobileProductGallery({
  images,
  productId,
  productName,
  activeIndex,
  onIndexChange,
  onOpenFullscreen,
  className,
}: {
  images: GalleryImage[];
  productId: string;
  productName: string;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onOpenFullscreen: () => void;
  className?: string;
}) {
  const imageCount = images.length;
  const hasImage = imageCount > 0;

  const {
    containerRef,
    trackRef,
    setWrapRef,
    handleImageLoad,
    isZoomed,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  } = useGalleryStage({
    imageCount,
    activeIndex,
    onIndexChange,
    objectFit: "cover",
    onSingleTap: hasImage ? onOpenFullscreen : undefined,
    enabled: hasImage,
  });

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Hero stage — full-bleed edge to edge. Rounded only along the
          bottom so it reads as a deliberate photographic sheet easing
          into the product info below, instead of a plain rectangle. */}
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-[4/5] max-h-[640px] w-full select-none overflow-hidden rounded-b-[28px] bg-cloud",
          isZoomed ? "touch-none" : "touch-pan-y"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {hasImage ? (
          <div ref={trackRef} className="flex h-full w-full">
            {images.map((img, index) => (
              <div key={img.url + index} className="h-full w-full shrink-0 basis-full">
                <BlurUpImage
                  wrapRef={setWrapRef(index)}
                  onLoadImg={(el) => handleImageLoad(index, el)}
                  src={img.url}
                  alt={img.altText ?? productName}
                  imgClassName="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <PlaceholderTile seed={productId} label={productName} className="h-full w-full" />
        )}

        {/* Quiet top scrim keeps the counter/expand controls legible over
            bright photography without needing solid chips underneath. */}
        {hasImage ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/25 to-transparent"
            aria-hidden="true"
          />
        ) : null}

        {hasImage ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenFullscreen();
            }}
            aria-label="View fullscreen"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-ink/40 text-paper backdrop-blur-sm transition-transform duration-200 active:scale-90"
          >
            <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}

        <GalleryCounter index={activeIndex} count={imageCount} className="left-4 top-4" />

        {imageCount > 1 ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/30 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-center gap-1.5"
              aria-hidden="true"
            >
              {images.map((img, index) => (
                <span
                  key={img.url + index}
                  className={cn(
                    "h-1.5 rounded-full bg-paper/70 shadow-sm transition-all duration-300",
                    index === activeIndex ? "w-6 bg-paper" : "w-1.5"
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Thumbnail rail — its own padding now that the stage above is
          full-bleed; aligned to the same left edge as the info copy
          beneath it. */}
      {imageCount > 1 ? (
        <ThumbnailStrip
          images={images}
          activeIndex={activeIndex}
          onSelect={onIndexChange}
          productName={productName}
          className="px-6 pt-4 md:px-10"
        />
      ) : null}
    </div>
  );
}
