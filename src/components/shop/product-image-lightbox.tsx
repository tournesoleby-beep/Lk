"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { FullscreenGalleryStage } from "@/components/shop/product-gallery/fullscreen-gallery-stage";

export type LightboxImage = { url: string; altText: string | null };

export function ProductImageLightbox({
  images,
  productName,
  initialIndex,
  onClose,
}: {
  images: LightboxImage[];
  productName: string;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const touchStartX = useRef<number | null>(null);
  const imageCount = images.length;
  const image = images[index] ?? null;

  function showImage(next: number) {
    setZoomed(false);
    setIndex(((next % imageCount) + imageCount) % imageCount);
  }

  // Keyboard navigation + escape to close.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") showImage(index + 1);
      if (event.key === "ArrowLeft") showImage(index - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, onClose]);

  // Lock background scroll while the lightbox is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  function handlePointerMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    if (zoomed || imageCount <= 1 || touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      showImage(index + (delta < 0 ? 1 : -1));
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} — image ${index + 1} of ${imageCount}`}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/95 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <span className="font-mono text-xs text-paper/70">
          {imageCount > 1 ? `${index + 1} / ${imageCount}` : productName}
        </span>
        <div className="flex items-center gap-2">
          {image ? (
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? "Zoom out" : "Zoom in"}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-paper transition-colors duration-200 hover:bg-paper/10 active:scale-90 lg:flex"
            >
              {zoomed ? (
                <ZoomOut className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <ZoomIn className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-paper transition-colors duration-200 hover:bg-paper/10 active:scale-90"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Image — mobile/tablet: swipe, pinch-zoom, double-tap, drag. */}
      <FullscreenGalleryStage
        images={images}
        productName={productName}
        index={index}
        onIndexChange={showImage}
        className="lg:hidden"
      />

      {/* Image — desktop: unchanged click-to-zoom experience. */}
      <div
        className={cn(
          "relative hidden flex-1 select-none items-center justify-center overflow-hidden px-4 pb-4 sm:px-16 sm:pb-10 lg:flex",
          zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        )}
        onMouseMove={handlePointerMove}
        onClick={() => setZoomed((z) => !z)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText ?? productName}
            className={cn(
              "max-h-full max-w-full object-contain transition-transform duration-200 ease-out",
              zoomed ? "scale-[2.2]" : "scale-100"
            )}
            style={zoomed ? { transformOrigin: `${origin.x}% ${origin.y}%` } : undefined}
            draggable={false}
          />
        ) : null}

        {imageCount > 1 ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showImage(index - 1);
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-paper transition-colors duration-200 hover:bg-ink/60 active:scale-90 sm:left-4"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showImage(index + 1);
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-paper transition-colors duration-200 hover:bg-ink/60 active:scale-90 sm:right-4"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </>
        ) : null}
      </div>

      {/* Thumbnail strip */}
      {imageCount > 1 ? (
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showImage(i);
              }}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === index}
              className={cn(
                "h-12 w-12 shrink-0 overflow-hidden rounded-lg border transition-all duration-200",
                i === index
                  ? "border-paper opacity-100"
                  : "border-paper/20 opacity-60 hover:opacity-90"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText ?? productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
