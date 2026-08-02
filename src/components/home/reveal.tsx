"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
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

// Subscribe to the user's motion preference via useSyncExternalStore rather
// than reading matchMedia inside an effect. This avoids calling setState
// synchronously on mount (flagged by react-hooks/set-state-in-effect) and
// keeps the server snapshot ("no preference") consistent with the initial
// client render, so there's no hydration mismatch.
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
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
  const [isVisible, setIsVisible] = useState(false);
  const scopeId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const scopeClass = `reveal-${scopeId}`;

  // Read the user's motion preference as external state (not effect-driven
  // setState) — server snapshot is "no preference" so this matches the
  // initial client render, then updates reactively if the OS setting changes.
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    const node = ref.current;
    // Respect the user's motion preference: skip the observer entirely so
    // content just renders in its final (visible) state, no animation.
    if (!node || prefersReducedMotion) return;

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
  }, [threshold, rootMargin, prefersReducedMotion]);

  const visible = isVisible || prefersReducedMotion;
  const offset = OFFSETS[variant];
  const Comp = Tag as ElementType;
  const mergedRef = mergeRefs(ref, elementRef);

  if (!stagger) {
    const style: CSSProperties = {
      opacity: visible ? 1 : 0,
      transform: visible ? "translate3d(0,0,0)" : offset,
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
      className={cn(scopeClass, visible && "is-visible", className)}
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
