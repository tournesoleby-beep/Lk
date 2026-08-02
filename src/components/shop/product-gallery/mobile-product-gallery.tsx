"use client";

import { Maximize2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { PlaceholderTile } from "@/components/home/placeholder-tile";
import { BlurUpImage } from "@/components/shop/product-gallery/blur-up-image";
import { GalleryCounter } from "@/components/shop/product-gallery/gallery-counter";
import { ThumbnailStrip } from "@/components/shop/product-gallery/thumbnail-strip";
import { useGalleryStage } from "@/components/shop/product-gallery/use-gallery-stage";
import type { GalleryImage } from "@/components/shop/product-gallery/types";

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
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-[4/5] w-full select-none overflow-hidden rounded-2xl bg-cloud shadow-sm",
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

        {hasImage ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenFullscreen();
            }}
            aria-label="View fullscreen"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/50 text-paper transition-transform duration-200 active:scale-90"
          >
            <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}

        <GalleryCounter index={activeIndex} count={imageCount} className="left-3 top-3" />

        {imageCount > 1 ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5"
            aria-hidden="true"
          >
            {images.map((img, index) => (
              <span
                key={img.url + index}
                className={cn(
                  "h-1.5 rounded-full bg-paper/70 shadow-sm transition-all duration-300",
                  index === activeIndex ? "w-5 bg-paper" : "w-1.5"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {imageCount > 1 ? (
        <ThumbnailStrip
          images={images}
          activeIndex={activeIndex}
          onSelect={onIndexChange}
          productName={productName}
          className="-mx-4 px-4"
        />
      ) : null}
    </div>
  );
}
