"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "@/lib/utils";

export type RevealVariant = "fade-up" | "fade-left" | "fade-right";

const OFFSETS: Record<RevealVariant, string> = {
  "fade-up": "translateY(28px)",
  "fade-left": "translateX(28px)",
  "fade-right": "translateX(-28px)",
};

// Default easing — a gentle expo-out with a touch of overshoot. Sections
// override this to give each one its own feel while staying cubic-bezier.
const DEFAULT_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const DEFAULT_DURATION_MS = 650;
const DEFAULT_STAGGER_STEP_MS = 80;
// Generous ceiling for nth-child delay rules — comfortably covers every
// section this is used on (product grids, carousels, step lists).
const MAX_STAGGER_CHILDREN = 24;

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as { current: T | null }).current = node;
    }
  };
}

type RevealProps = {
  children: ReactNode;
  /** Tag to render — lets Reveal stand in for the element it wraps
   *  (e.g. "ol", "ul") instead of adding an extra DOM layer. */
  as?: ElementType;
  variant?: RevealVariant;
  className?: string;
  /** Transition duration in ms. Keep within ~500–700ms. */
  duration?: number;
  /** Extra delay in ms before the (first) reveal starts. */
  delay?: number;
  /** Cubic-bezier timing function. Vary this per section for a distinct feel. */
  easing?: string;
  /** IntersectionObserver threshold. */
  threshold?: number;
  /** IntersectionObserver rootMargin. */
  rootMargin?: string;
  /** When true, animates direct children in sequence instead of the
   *  wrapper as a whole. Children are left untouched (no cloning, no
   *  extra nodes) — staggering is done with a small scoped <style>
   *  block targeting `> *`, so existing grid/flex layouts are
   *  unaffected. */
  stagger?: boolean;
  /** Delay step between each staggered child, in ms. Keep within ~50–100ms. */
  staggerDelay?: number;
  /** For elements that already own a ref (e.g. a drag-scroll container) —
   *  merged with Reveal's own observer ref so Reveal can render the
   *  element directly instead of adding a wrapper. */
  elementRef?: Ref<HTMLElement>;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children">;

/**
 * Reveal — fades + slides content in once, the first time it scrolls into
 * view.
 *
 * - IntersectionObserver-driven, disconnects after the first reveal so it
 *   never re-triggers.
 * - Animates opacity + transform only (no layout-affecting properties).
 * - Skips animating entirely for prefers-reduced-motion: content is shown
 *   immediately and the observer is never attached.
 * - `stagger` animates direct children in sequence via CSS nth-child
 *   delays rather than touching child props, so it's safe to use on
 *   grids/flex rows/lists without disturbing their layout.
 * - `duration`, `easing`, `staggerDelay` are per-instance so each section
 *   can have its own distinct motion signature.
 */
export function Reveal({
  children,
  as: Tag = "div",
  variant = "fade-up",
  className,
  duration = DEFAULT_DURATION_MS,
  delay = 0,
  easing = DEFAULT_EASING,
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  stagger = false,
  staggerDelay = DEFAULT_STAGGER_STEP_MS,
  elementRef,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  // Lazy initializer runs once during render (not in an effect), so
  // deciding prefers-reduced-motion here never calls setState from an
  // effect body (react-hooks/set-state-in-effect) — and, unlike an
  // earlier version of this fix, it doesn't write to a ref during
  // render either (react-hooks/refs). isVisible itself is what the
  // observer effect below checks to decide whether it's still needed.
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const scopeId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const scopeClass = `reveal-${scopeId}`;

  useEffect(() => {
    const node = ref.current;
    // Reduced motion already made this visible at initial state above —
    // content is shown as-is, no animation, no observer needed.
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Animate only once — stop watching after the first reveal.
            observer.unobserve(node);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, isVisible]);

  const offset = OFFSETS[variant];
  const Comp = Tag as ElementType;
  const mergedRef = mergeRefs(ref, elementRef);

  if (!stagger) {
    const style: CSSProperties = {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translate3d(0,0,0)" : offset,
      transitionProperty: "opacity, transform",
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: easing,
      transitionDelay: `${delay}ms`,
    };

    return (
      <Comp ref={mergedRef} className={className} style={style} {...rest}>
        {children}
      </Comp>
    );
  }

  const staggerRules = Array.from(
    { length: MAX_STAGGER_CHILDREN },
    (_, index) =>
      `.${scopeClass} > *:nth-child(${index + 1}) { transition-delay: ${
        delay + index * staggerDelay
      }ms; }`
  ).join("\n");

  return (
    <Comp
      ref={mergedRef}
      className={cn(scopeClass, isVisible && "is-visible", className)}
      {...rest}
    >
      <style>{`
        .${scopeClass} > * {
          opacity: 0;
          transform: ${offset};
          transition-property: opacity, transform;
          transition-duration: ${duration}ms;
          transition-timing-function: ${easing};
        }
        ${staggerRules}
        .${scopeClass}.is-visible > * {
          opacity: 1;
          transform: translate3d(0,0,0);
        }
      `}</style>
      {children}
    </Comp>
  );
}
