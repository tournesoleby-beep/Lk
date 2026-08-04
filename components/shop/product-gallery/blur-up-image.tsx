"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The outer div is the element the gesture engine transforms (translate +
 * scale) — keeping that separate from the <img> lets the image handle its
 * own independent blur-up fade-in without fighting the zoom transform.
 */
export function BlurUpImage({
  src,
  alt,
  imgClassName,
  wrapRef,
  onLoadImg,
  draggable = false,
}: {
  src: string;
  alt: string;
  imgClassName?: string;
  wrapRef?: (el: HTMLDivElement | null) => void;
  onLoadImg?: (img: HTMLImageElement) => void;
  draggable?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={wrapRef} className="flex h-full w-full items-center justify-center will-change-transform">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={draggable}
        onLoad={(event) => {
          setLoaded(true);
          onLoadImg?.(event.currentTarget);
        }}
        className={cn(
          "transition-[opacity,filter,transform] duration-500 ease-out",
          loaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-md",
          imgClassName
        )}
      />
    </div>
  );
}
