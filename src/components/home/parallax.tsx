"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

// Requested range is 10–20px of max travel — clamp whatever a caller passes
// so nothing ever drifts further than that.
const MIN_STRENGTH = 10;
const MAX_STRENGTH = 20;
const DEFAULT_STRENGTH = 14;

type ParallaxProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Max vertical travel in px, clamped to 10–20px. */
  strength?: number;
};

/**
 * Subtle scroll-linked parallax — for decorative imagery only, never for
 * content the user reads or interacts with. Translates the element up to
 * `strength`px vertically as it crosses the viewport.
 *
 * - transform-only (translate3d), so it never affects layout.
 * - Only listens to scroll while the element is actually on screen
 *   (toggled via IntersectionObserver), and the scroll handler itself is
 *   rAF-throttled.
 * - No-op for prefers-reduced-motion: stays at rest, no listeners attached.
 * - Wraps its child rather than styling it directly, so a decorative
 *   image's own hover/scale transforms (set via classes) keep working
 *   unmodified — the two transforms live on different elements and
 *   compose visually instead of colliding.
 */
export function Parallax({
  children,
  as: Tag = "div",
  className,
  strength = DEFAULT_STRENGTH,
}: ParallaxProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState(0);
  const isActive = useRef(false);
  const max = Math.min(MAX_STRENGTH, Math.max(MIN_STRENGTH, strength));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // No motion preference: stay put, never attach scroll/observer work.
    if (prefersReducedMotion) return;

    let ticking = false;

    function update() {
      ticking = false;
      const el = ref.current;
      if (!isActive.current || !el) return;
      const rect = el.getBoundingClientRect();
      const viewportMid = window.innerHeight / 2;
      const elementMid = rect.top + rect.height / 2;
      // -1 (element's center above viewport's center) .. 1 (below)
      const progress = (elementMid - viewportMid) / (viewportMid || 1);
      const clamped = Math.max(-1, Math.min(1, progress));
      setOffset(clamped * max);
    }

    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isActive.current = entry.isIntersecting;
          if (entry.isIntersecting) update();
        }
      },
      { threshold: 0 }
    );

    observer.observe(node);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [max]);

  const Comp = Tag as ElementType;
  const style: CSSProperties = {
    transform: `translate3d(0, ${offset}px, 0)`,
    willChange: "transform",
  };

  return (
    <Comp ref={ref} className={className} style={style}>
      {children}
    </Comp>
  );
}
