"use client";

import React, { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function useGameboyParallax(rootRef: React.RefObject<HTMLElement | null>) {
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const lastLeanRef = useRef(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const ny = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      targetOffsetRef.current = {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      };
    };

    if (reduced) {
      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--mx", "0");
        el.style.setProperty("--my", "0");
        el.style.setProperty("--lean-x", "0");
      }
      return;
    }

    const updateParallax = () => {
      const current = currentOffsetRef.current;
      const target = targetOffsetRef.current;

      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      // $10M-quality Premium Camera Float
      const time = performance.now() * 0.001;
      const idleX = Math.sin(time * 0.4) * 0.03 + Math.sin(time * 0.25) * 0.015;
      const idleY = Math.cos(time * 0.3) * 0.03 + Math.sin(time * 0.2) * 0.015;

      const finalX = current.x + idleX;
      const finalY = current.y + idleY;

      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--mx", finalX.toFixed(4));
        el.style.setProperty("--my", finalY.toFixed(4));

        const lean = Math.round(finalX * 8) / 8;
        if (lean !== lastLeanRef.current) {
          lastLeanRef.current = lean;
          el.style.setProperty("--lean-x", String(lean));
        }
      }
      animFrameRef.current = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animFrameRef.current = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [reduced, rootRef]);
}

export default function GameboyParallax({
  children,
  rootRef,
}: {
  children?: React.ReactNode;
  rootRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const activeRef = rootRef || localRef;
  useGameboyParallax(activeRef);

  return (
    <div ref={activeRef as React.RefObject<HTMLDivElement>} className="contents">
      {children}
    </div>
  );
}
