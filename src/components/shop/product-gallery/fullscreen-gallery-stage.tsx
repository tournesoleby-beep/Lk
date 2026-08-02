"use client";

import { cn } from "@/lib/utils";
import { BlurUpImage } from "@/components/shop/product-gallery/blur-up-image";
import { useGalleryStage } from "@/components/shop/product-gallery/use-gallery-stage";
import type { GalleryImage } from "@/components/shop/product-gallery/types";

export function FullscreenGalleryStage({
  images,
  productName,
  index,
  onIndexChange,
  className,
}: {
  images: GalleryImage[];
  productName: string;
  index: number;
  onIndexChange: (index: number) => void;
  className?: string;
}) {
  const imageCount = images.length;

  const {
    containerRef,
    trackRef,
    setWrapRef,
    handleImageLoad,
    isZoomed,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  } = useGalleryStage({
    imageCount,
    activeIndex: index,
    onIndexChange,
    objectFit: "contain",
    enabled: imageCount > 0,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-1 select-none items-center justify-center overflow-hidden px-4 pb-4",
        isZoomed ? "touch-none" : "touch-pan-y",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {imageCount > 0 ? (
        <div ref={trackRef} className="flex h-full w-full">
          {images.map((img, i) => (
            <div key={img.url + i} className="flex h-full w-full shrink-0 basis-full items-center justify-center">
              <BlurUpImage
                wrapRef={setWrapRef(i)}
                onLoadImg={(el) => handleImageLoad(i, el)}
                src={img.url}
                alt={img.altText ?? productName}
                imgClassName="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
