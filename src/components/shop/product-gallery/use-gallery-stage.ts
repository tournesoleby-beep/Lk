"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * Touch-gesture engine shared by the inline mobile/tablet product gallery
 * and the fullscreen gallery. Handles, on a single stage:
 *  - horizontal swipe between images (with rubber-band at the first/last)
 *  - pinch-to-zoom up to `maxScale`, anchored under the fingers
 *  - double-tap to zoom in/out, anchored under the tap
 *  - drag-to-pan while zoomed, clamped to the image bounds with rubber-band
 *  - a single tap (when not zoomed) to trigger `onSingleTap`
 *
 * Perf note: while a gesture is in flight, transforms are written directly
 * to the DOM via refs (no re-render). React state (`isZoomed`, `loadedFlags`)
 * is only touched at the start/end of a gesture, which is what actually
 * needs to affect layout/other UI.
 */

const SPRING_TRANSITION = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
const SWIPE_COMMIT_RATIO = 0.22;
const EDGE_RESISTANCE = 0.35;
const PAN_RESISTANCE = 0.45;
const SCALE_RESISTANCE = 0.5;
const LOCK_THRESHOLD = 6;
const TAP_MAX_DURATION = 300;
const DOUBLE_TAP_WINDOW = 300;

type Point = { x: number; y: number };
type GestureMode = "idle" | "locking" | "swipe" | "pan" | "pinch";

export interface GalleryStageOptions {
  imageCount: number;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  objectFit: "cover" | "contain";
  maxScale?: number;
  doubleTapScale?: number;
  /** Fires on a plain tap while not zoomed — e.g. open the fullscreen viewer. */
  onSingleTap?: () => void;
  enabled?: boolean;
}

export function useGalleryStage({
  imageCount,
  activeIndex,
  onIndexChange,
  objectFit,
  maxScale = 3,
  doubleTapScale = 2.4,
  onSingleTap,
  enabled = true,
}: GalleryStageOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wrapRefs = useRef<Array<HTMLDivElement | null>>([]);
  const naturalSizes = useRef<Array<{ w: number; h: number } | undefined>>([]);
  const containerSize = useRef({ w: 0, h: 0 });

  const [isZoomed, setIsZoomed] = useState(false);

  const pointers = useRef<Map<number, Point>>(new Map());
  const gestureMode = useRef<GestureMode>("idle");
  const startPointer = useRef<Point>({ x: 0, y: 0 });
  const startTime = useRef(0);
  const dragPxRef = useRef(0);
  const scaleRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const panBaseRef = useRef<Point>({ x: 0, y: 0 });
  const pinchStartDist = useRef(1);
  const pinchStartScale = useRef(1);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const singleTapTimer = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    containerSize.current = { w: el.clientWidth, h: el.clientHeight };
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) containerSize.current = { w: box.width, h: box.height };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimer.current !== null) {
      window.clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
    }
  }, []);
  useEffect(() => clearSingleTapTimer, [clearSingleTapTimer]);

  const setWrapRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      wrapRefs.current[index] = el;
    },
    []
  );

  const handleImageLoad = useCallback((index: number, img: HTMLImageElement) => {
    naturalSizes.current[index] = {
      w: img.naturalWidth || 1,
      h: img.naturalHeight || 1,
    };
  }, []);

  const setImageTransform = useCallback(
    (index: number, scale: number, pan: Point, animate: boolean) => {
      const wrap = wrapRefs.current[index];
      if (!wrap) return;
      wrap.style.transition = animate ? SPRING_TRANSITION : "none";
      wrap.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
    },
    []
  );

  const setTrackTransform = useCallback((index: number, dragPx: number, animate: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = animate ? SPRING_TRANSITION : "none";
    track.style.transform = `translateX(calc(${-index * 100}% + ${dragPx}px))`;
  }, []);

  const getBounds = useCallback(
    (index: number, scale: number) => {
      const { w: cw, h: ch } = containerSize.current;
      const natural = naturalSizes.current[index];
      if (!cw || !ch) return { x: 0, y: 0 };
      let fitW = cw;
      let fitH = ch;
      if (objectFit === "contain" && natural) {
        const fitScale = Math.min(cw / natural.w, ch / natural.h);
        fitW = natural.w * fitScale;
        fitH = natural.h * fitScale;
      }
      return {
        x: Math.max(0, (fitW * scale - cw) / 2),
        y: Math.max(0, (fitH * scale - ch) / 2),
      };
    },
    [objectFit]
  );

  // Reset every slide's zoom whenever the active index changes (swipe commit
  // or thumbnail tap), and sync the track's resting position. useLayoutEffect
  // so this lands before paint — no flash of the wrong offset.
  useLayoutEffect(() => {
    scaleRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    // Syncs the zoomed-UI flag to the (externally driven) active index —
    // a legitimate prop->state sync, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsZoomed(false);
    wrapRefs.current.forEach((wrap) => {
      if (!wrap) return;
      wrap.style.transition = "none";
      wrap.style.transform = "translate(0px, 0px) scale(1)";
    });
    const track = trackRef.current;
    if (track) {
      track.style.transition = mountedRef.current ? SPRING_TRANSITION : "none";
      track.style.transform = `translateX(${-activeIndex * 100}%)`;
    }
    mountedRef.current = true;
  }, [activeIndex]);

  const zoomTo = useCallback(
    (index: number, targetScale: number, focal: Point) => {
      const { w: cw, h: ch } = containerSize.current;
      const cx = focal.x - cw / 2;
      const cy = focal.y - ch / 2;
      const s0 = scaleRef.current;
      const p0 = panRef.current;
      let pan: Point = { x: 0, y: 0 };
      if (targetScale > 1.001) {
        pan = {
          x: cx - (cx - p0.x) * (targetScale / s0),
          y: cy - (cy - p0.y) * (targetScale / s0),
        };
        const bounds = getBounds(index, targetScale);
        pan.x = Math.min(bounds.x, Math.max(-bounds.x, pan.x));
        pan.y = Math.min(bounds.y, Math.max(-bounds.y, pan.y));
      }
      scaleRef.current = targetScale;
      panRef.current = pan;
      setImageTransform(index, targetScale, pan, true);
      setIsZoomed(targetScale > 1.001);
    },
    [getBounds, setImageTransform]
  );

  const finalizeScale = useCallback(() => {
    const s = Math.min(maxScale, Math.max(1, scaleRef.current));
    const zoomed = s > 1.02;
    if (!zoomed) {
      scaleRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      setImageTransform(activeIndex, 1, { x: 0, y: 0 }, true);
    } else {
      const bounds = getBounds(activeIndex, s);
      const pan = {
        x: Math.min(bounds.x, Math.max(-bounds.x, panRef.current.x)),
        y: Math.min(bounds.y, Math.max(-bounds.y, panRef.current.y)),
      };
      scaleRef.current = s;
      panRef.current = pan;
      setImageTransform(activeIndex, s, pan, true);
    }
    setIsZoomed(zoomed);
  }, [activeIndex, maxScale, getBounds, setImageTransform]);

  const finalizePan = useCallback(() => {
    const bounds = getBounds(activeIndex, scaleRef.current);
    const pan = {
      x: Math.min(bounds.x, Math.max(-bounds.x, panRef.current.x)),
      y: Math.min(bounds.y, Math.max(-bounds.y, panRef.current.y)),
    };
    panRef.current = pan;
    setImageTransform(activeIndex, scaleRef.current, pan, true);
  }, [activeIndex, getBounds, setImageTransform]);

  const handleTap = useCallback(
    (x: number, y: number) => {
      const now = performance.now();
      if (now - startTime.current > TAP_MAX_DURATION) return;
      const last = lastTap.current;
      if (last && now - last.time < DOUBLE_TAP_WINDOW && Math.hypot(x - last.x, y - last.y) < 40) {
        clearSingleTapTimer();
        lastTap.current = null;
        const rect = containerRef.current?.getBoundingClientRect();
        const focal = rect ? { x: x - rect.left, y: y - rect.top } : { x: 0, y: 0 };
        const targetScale = scaleRef.current > 1.02 ? 1 : doubleTapScale;
        zoomTo(activeIndex, targetScale, focal);
        return;
      }
      lastTap.current = { time: now, x, y };
      if (onSingleTap && scaleRef.current <= 1.02) {
        clearSingleTapTimer();
        singleTapTimer.current = window.setTimeout(() => {
          lastTap.current = null;
          onSingleTap();
        }, DOUBLE_TAP_WINDOW + 30);
      }
    },
    [activeIndex, clearSingleTapTimer, doubleTapScale, onSingleTap, zoomTo]
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      (event.target as Element).setPointerCapture?.(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.current.size === 1) {
        gestureMode.current = "locking";
        startPointer.current = { x: event.clientX, y: event.clientY };
        startTime.current = performance.now();
        dragPxRef.current = 0;
        panBaseRef.current = panRef.current;
      } else if (pointers.current.size === 2) {
        clearSingleTapTimer();
        const pts = Array.from(pointers.current.values());
        pinchStartDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        pinchStartScale.current = scaleRef.current;
        gestureMode.current = "pinch";
      }
    },
    [enabled, clearSingleTapTimer]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || !pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (gestureMode.current === "pinch" && pointers.current.size >= 2) {
        const pts = Array.from(pointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        const centroid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const rect = containerRef.current?.getBoundingClientRect();
        const cw = containerSize.current.w;
        const ch = containerSize.current.h;
        const cx = rect ? centroid.x - rect.left - cw / 2 : 0;
        const cy = rect ? centroid.y - rect.top - ch / 2 : 0;

        let rawScale = pinchStartScale.current * (dist / pinchStartDist.current);
        if (rawScale > maxScale) rawScale = maxScale + (rawScale - maxScale) * SCALE_RESISTANCE;
        if (rawScale < 1) rawScale = 1 - (1 - rawScale) * SCALE_RESISTANCE;

        const s0 = scaleRef.current;
        const p0 = panRef.current;
        const pan = {
          x: cx - (cx - p0.x) * (rawScale / s0),
          y: cy - (cy - p0.y) * (rawScale / s0),
        };

        scaleRef.current = rawScale;
        panRef.current = pan;
        setImageTransform(activeIndex, rawScale, pan, false);
        event.preventDefault();
        return;
      }

      const dxTotal = event.clientX - startPointer.current.x;
      const dyTotal = event.clientY - startPointer.current.y;

      if (gestureMode.current === "locking") {
        if (Math.hypot(dxTotal, dyTotal) < LOCK_THRESHOLD) return;
        if (scaleRef.current > 1.02) {
          gestureMode.current = "pan";
        } else if (Math.abs(dxTotal) > Math.abs(dyTotal)) {
          gestureMode.current = "swipe";
        } else {
          // Predominantly vertical — let the page scroll instead.
          gestureMode.current = "idle";
          pointers.current.delete(event.pointerId);
          return;
        }
      }

      if (gestureMode.current === "swipe") {
        let drag = dxTotal;
        const atStart = activeIndex === 0 && drag > 0;
        const atEnd = activeIndex === imageCount - 1 && drag < 0;
        if (atStart || atEnd) drag *= EDGE_RESISTANCE;
        dragPxRef.current = drag;
        setTrackTransform(activeIndex, drag, false);
        event.preventDefault();
      } else if (gestureMode.current === "pan") {
        const bounds = getBounds(activeIndex, scaleRef.current);
        let x = panBaseRef.current.x + dxTotal;
        let y = panBaseRef.current.y + dyTotal;
        if (x > bounds.x) x = bounds.x + (x - bounds.x) * PAN_RESISTANCE;
        if (x < -bounds.x) x = -bounds.x + (x + bounds.x) * PAN_RESISTANCE;
        if (y > bounds.y) y = bounds.y + (y - bounds.y) * PAN_RESISTANCE;
        if (y < -bounds.y) y = -bounds.y + (y + bounds.y) * PAN_RESISTANCE;
        panRef.current = { x, y };
        setImageTransform(activeIndex, scaleRef.current, panRef.current, false);
        event.preventDefault();
      }
    },
    [enabled, activeIndex, imageCount, maxScale, getBounds, setImageTransform, setTrackTransform]
  );

  const endGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.delete(event.pointerId);
      (event.target as Element).releasePointerCapture?.(event.pointerId);

      if (gestureMode.current === "pinch") {
        if (pointers.current.size === 1) {
          // One finger lifted mid-pinch — hand off to a single-finger pan
          // instead of ending the gesture, so the transition feels continuous.
          const remaining = Array.from(pointers.current.values())[0];
          finalizeScale();
          gestureMode.current = scaleRef.current > 1.02 ? "pan" : "idle";
          startPointer.current = remaining;
          panBaseRef.current = panRef.current;
          return;
        }
        finalizeScale();
        finalizePan();
        gestureMode.current = "idle";
        return;
      }

      if (pointers.current.size > 0) return;

      if (gestureMode.current === "swipe") {
        const cw = containerSize.current.w || 1;
        const drag = dragPxRef.current;
        const commit = Math.abs(drag) > cw * SWIPE_COMMIT_RATIO;
        let nextIndex = activeIndex;
        if (commit) {
          nextIndex = drag < 0 ? Math.min(imageCount - 1, activeIndex + 1) : Math.max(0, activeIndex - 1);
        }
        dragPxRef.current = 0;
        setTrackTransform(nextIndex, 0, true);
        if (nextIndex !== activeIndex) onIndexChange(nextIndex);
      } else if (gestureMode.current === "pan") {
        finalizePan();
      } else if (gestureMode.current === "locking") {
        handleTap(event.clientX, event.clientY);
      }

      gestureMode.current = "idle";
    },
    [activeIndex, imageCount, onIndexChange, finalizeScale, finalizePan, setTrackTransform, handleTap]
  );

  return {
    containerRef,
    trackRef,
    setWrapRef,
    handleImageLoad,
    isZoomed,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  };
}
