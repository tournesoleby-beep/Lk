"use client";

import { useRef } from "react";

/**
 * A soft radial spotlight that follows the pointer across the hero. Purely
 * decorative — updates CSS custom properties directly via a ref so it never
 * triggers React re-renders, and no-ops on touch devices.
 */
export function HeroGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    glowRef.current?.style.setProperty("--glow-x", `${x}%`);
    glowRef.current?.style.setProperty("--glow-y", `${y}%`);
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onPointerMove={handlePointerMove}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-500 [--glow-x:50%] [--glow-y:20%] hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--glow-x) var(--glow-y), rgba(168,50,79,0.12), transparent 70%)",
        }}
      />
    </div>
  );
}
