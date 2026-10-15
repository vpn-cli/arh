"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface ScrollRibbonProps {
  containerRef: React.RefObject<HTMLElement | null>;
  startElementId?: string;
  endElementId?: string;
  className?: string;
}

export default function ScrollRibbon({
  containerRef,
  startElementId = "hero-down-indicator",
  endElementId = "end-of-transmission",
  className = "",
}: ScrollRibbonProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathLengthRef = useRef<number>(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [pathData, setPathData] = useState<{
    width: number;
    height: number;
    d: string;
  }>({
    width: 100,
    height: 1000,
    d: "M 50 0 L 50 1000",
  });

  // Recompute path dimensions and coordinates when container or layout resizes
  const recomputePath = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top + window.scrollY;
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    let startY = 120; // fallback below hero
    let endY = containerHeight - 80;

    const startEl = document.getElementById(startElementId);
    if (startEl) {
      const startRect = startEl.getBoundingClientRect();
      startY = startRect.bottom + window.scrollY - containerTop + 8;
    }

    const endEl = document.getElementById(endElementId);
    if (endEl) {
      const endRect = endEl.getBoundingClientRect();
      endY = endRect.top + window.scrollY - containerTop + 16;
    }

    // Ensure startY < endY
    if (endY <= startY) {
      endY = startY + 500;
    }

    const centerX = Math.round(containerWidth / 2);
    const d = `M ${centerX} ${Math.round(startY)} L ${centerX} ${Math.round(endY)}`;

    setPathData({
      width: containerWidth,
      height: containerHeight,
      d,
    });
  };

  // ResizeObserver on the page/main container to handle letter opening, vault open, etc.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    recomputePath();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        recomputePath();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", recomputePath);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", recomputePath);
    };
  }, [containerRef, startElementId, endElementId]);

  // Update stroke-dasharray and dashoffset on scroll using rAF without setting React state
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    try {
      const length = path.getTotalLength();
      pathLengthRef.current = length;

      if (prefersReducedMotion) {
        path.style.strokeDasharray = "none";
        path.style.strokeDashoffset = "0";
        return;
      }

      path.style.strokeDasharray = `${length} ${length}`;
    } catch {
      return;
    }

    const updateScrollProgress = () => {
      if (!pathRef.current) return;

      if (prefersReducedMotion) {
        pathRef.current.style.strokeDashoffset = "0";
        return;
      }

      const length = pathLengthRef.current;
      if (length <= 0) return;

      const pathRect = pathRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      // Draw ahead as user scrolls down the page
      const triggerOffset = windowHeight * 0.7;
      const scrolled = triggerOffset - pathRect.top;
      const progress = Math.min(Math.max(scrolled / (pathRect.height || 1), 0), 1);

      const offset = length * (1 - progress);
      pathRef.current.style.strokeDashoffset = `${offset}`;
    };

    updateScrollProgress();

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateScrollProgress();
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [pathData, prefersReducedMotion]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-0 overflow-hidden ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        data-testid="scroll-ribbon"
        width={pathData.width}
        height={pathData.height}
        viewBox={`0 0 ${pathData.width} ${pathData.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full pointer-events-none"
        style={{ pointerEvents: "none" }}
      >
        <path
          ref={pathRef}
          data-testid="scroll-ribbon-path"
          d={pathData.d}
          stroke="#FF8FB3"
          strokeWidth="2.5"
          strokeDasharray="8 6"
          strokeLinecap="round"
          style={{
            pointerEvents: "none",
            strokeDashoffset: prefersReducedMotion ? "0" : undefined,
          }}
        />
      </svg>
    </div>
  );
}
