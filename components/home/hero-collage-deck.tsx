"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

// A small stacked "photo deck" for the mobile/tablet hero. Not a carousel —
// dragging left or right cycles which card sits on top of the pile, the way
// flipping through a stack of printed photos would. Desktop keeps its own
// offset tile arrangement in hero-banner.tsx and never renders this.

type Card = {
  id: number;
  gradient: string;
  /** A small fixed tilt per photo so the pile reads as physical, not perfectly aligned. */
  tilt: number;
};

const CARDS: Card[] = [
  {
    id: 0,
    gradient: "linear-gradient(145deg, #efe3d8 0%, #d9c4ae 55%, #a9843f 100%)",
    tilt: -2.5,
  },
  {
    id: 1,
    gradient: "linear-gradient(160deg, #2c232a 0%, #17151a 100%)",
    tilt: 3,
  },
  {
    id: 2,
    gradient: "linear-gradient(160deg, #fbebee 0%, #a8324f 100%)",
    tilt: -3.5,
  },
  {
    id: 3,
    gradient: "linear-gradient(150deg, #eef1ea 0%, #7c8b6f 100%)",
    tilt: 2,
  },
];

// Depth 0 = front (fully visible), depth 3 = mostly hidden at the back.
const DEPTH = [
  { x: 0, y: 0, scale: 1, opacity: 1, shadow: "shadow-lg" },
  { x: 10, y: 12, scale: 0.94, opacity: 0.82, shadow: "shadow-md" },
  { x: 18, y: 22, scale: 0.88, opacity: 0.52, shadow: "shadow-sm" },
  { x: 24, y: 30, scale: 0.82, opacity: 0.22, shadow: "" },
] as const;

const DRAG_THRESHOLD = 56;
const MAX_DRAG = 140;
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export function HeroCollageDeck() {
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3]);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const activePointer = useRef<number | null>(null);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
    activePointer.current = e.pointerId;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointer.current !== e.pointerId) return;
    const delta = e.clientX - startX.current;
    setDragX(Math.max(-MAX_DRAG, Math.min(MAX_DRAG, delta)));
  }

  function settle(finalDragX: number) {
    if (finalDragX <= -DRAG_THRESHOLD) {
      // Front card rotates to the back; the next card becomes the front.
      setOrder((prev) => [...prev.slice(1), prev[0]]);
    } else if (finalDragX >= DRAG_THRESHOLD) {
      // Bring the back card around to the front.
      setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
    }
    setDragX(0);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    setDragging(false);
    settle(dragX);
  }

  return (
    <div
      className="relative aspect-square w-full touch-pan-y select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-hidden="true"
    >
      {order.map((cardId, depth) => {
        const card = CARDS[cardId];
        const d = DEPTH[depth];
        const isFront = depth === 0;
        const isSecond = depth === 1;
        // Front card tracks the finger 1:1; the second card gets a light
        // parallax nudge in the same direction for a sense of depth.
        const dragOffset = isFront ? dragX : isSecond ? dragX * 0.25 : 0;
        const dragTilt = isFront ? dragX / 18 : 0;
        const transform = `translate(${d.x + dragOffset}px, ${d.y}px) rotate(${
          card.tilt + dragTilt
        }deg) scale(${d.scale})`;
        // Only the front card skips the transition while actively dragged,
        // so it tracks the pointer exactly; releasing (or any other card)
        // always eases back with a soft spring — no abrupt jumps.
        const skipTransition = dragging && isFront;

        return (
          <div
            key={card.id}
            className={`absolute inset-0 overflow-hidden rounded-2xl ${d.shadow} ${
              isFront ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
            }`}
            style={{
              background: card.gradient,
              transform,
              opacity: d.opacity,
              zIndex: 40 - depth * 10,
              transition: skipTransition
                ? "none"
                : `transform 0.55s ${SPRING}, opacity 0.4s ease-out`,
            }}
          />
        );
      })}
    </div>
  );
}
