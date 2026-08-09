"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

const EDGE_EPSILON = 4;
const PAGE_FRACTION = 0.9;
// Pointer must move at least this many px before a pointerdown is treated
// as a drag (and captures the pointer). Below this, it's left alone as a
// plain click/tap so it can reach a link or button under the cursor —
// setPointerCapture() retargets the eventual click event to the scroller
// itself, which silently breaks navigation on every tile if it fires
// unconditionally on pointerdown.
const DRAG_THRESHOLD = 5;

/**
 * Drives a single horizontally-scrolling row (New Arrivals, Instagram
 * Highlights, and anything else shaped like them): mouse/pen drag-to-scroll,
 * a plain vertical wheel gesture mapped to horizontal, left/right arrow-key
 * paging when the row is focused, and the at-start/at-end/can-scroll state
 * that drives a pair of prev/next buttons.
 *
 * Touch is deliberately left alone everywhere here — it already gets native
 * swipe/snap scrolling on an overflow-x-auto row, and fighting that with
 * manual scrollLeft writes just makes it feel janky. Desktop input methods
 * (mouse drag, wheel, arrow keys, click) are additive on top of that.
 */
export function useHorizontalCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    // Pointer is currently down (button held), regardless of whether it
    // has moved enough to count as a drag yet.
    down: false,
    // True once movement has passed DRAG_THRESHOLD and the pointer has
    // been captured — from here on this gesture is a drag, not a click.
    dragging: false,
    pointerId: -1,
    startX: 0,
    startScroll: 0,
  });

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [canScroll, setCanScroll] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScroll(maxScroll > EDGE_EPSILON);
    setAtStart(el.scrollLeft <= EDGE_EPSILON);
    setAtEnd(el.scrollLeft >= maxScroll - EDGE_EPSILON);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * PAGE_FRACTION * direction, behavior: "smooth" });
  }, []);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const el = scrollerRef.current;
    if (!el) return;
    // Deliberately no setPointerCapture here — see DRAG_THRESHOLD comment.
    dragState.current = {
      down: true,
      dragging: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: el.scrollLeft,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    const state = dragState.current;
    if (!el || !state.down) return;

    const delta = event.clientX - state.startX;

    if (!state.dragging) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      // Movement just crossed the threshold — this gesture is now a real
      // drag. Capture from here on so the rest of the drag tracks even if
      // the pointer leaves the element.
      state.dragging = true;
      el.setPointerCapture(state.pointerId);
    }

    el.scrollLeft = state.startScroll - delta;
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    const state = dragState.current;
    if (state.dragging && el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    dragState.current = {
      down: false,
      dragging: false,
      pointerId: -1,
      startX: 0,
      startScroll: 0,
    };
  }

  // Shift+wheel and trackpad horizontal scroll already work natively on an
  // overflow-x-auto element — this just extends the same courtesy to a
  // plain vertical wheel so a regular mouse can drive the row too.
  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    if (!el || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    el.scrollLeft += event.deltaY;
    event.preventDefault();
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByPage(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByPage(-1);
    }
  }

  return {
    scrollerRef,
    atStart,
    atEnd,
    canScroll,
    scrollByPage,
    onWheel,
    onKeyDown,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
