"use client";

import React, { useId, useState } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { sfx } from "@/lib/audio";
import { FLOATING_ITEMS, FloatingItem } from "./floatingElementsData";

/* ═══════════════════════════════════════════════════════
   HOME FLOATING ELEMENTS
   
   Aesthetic pink sticker elements clipped from elements.jpeg
   (excluding lips). Dispersed in an organic, randomized collage
   layout with screen blending mode so they merge naturally into
   the warm ambient background lighting.
   ═══════════════════════════════════════════════════════ */

export default function HomeFloatingElements() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const componentId = useId().replace(/:/g, "");
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  const handleItemClick = (id: string) => {
    sfx.pop();
    setClickedItem(id);
    setTimeout(() => {
      setClickedItem((prev) => (prev === id ? null : prev));
    }, 400);
  };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      <style>{`
        @keyframes float-drift-${componentId} {
          0%, 100% {
            transform: translateY(0px) rotate(var(--rot, 0deg));
          }
          50% {
            transform: translateY(var(--dist, -10px)) rotate(calc(var(--rot, 0deg) + 2deg));
          }
        }
      `}</style>

      {FLOATING_ITEMS.map((item: FloatingItem) => {
        const isPopped = clickedItem === item.id;
        const style: React.CSSProperties = {
          position: "absolute",
          top: item.top,
          bottom: item.bottom,
          left: item.left,
          right: item.right,
          width: `${item.size}px`,
          opacity: item.opacity,
          zIndex: item.zIndex ?? 0,
          mixBlendMode: item.blendMode ?? "screen",
          filter:
            "drop-shadow(0 0 24px rgba(255, 182, 193, 0.3)) drop-shadow(0 0 48px rgba(180, 120, 140, 0.15))",
          "--rot": `${item.rotate}deg`,
          "--dist": `${-item.floatDistance}px`,
          animation: prefersReducedMotion
            ? "none"
            : `float-drift-${componentId} ${item.floatDuration}s ease-in-out ${item.floatDelay}s infinite`,
        } as React.CSSProperties;

        return (
          <div
            key={item.id}
            className={`transition-all duration-700 pointer-events-auto select-none cursor-pointer group ${item.hideOnMobile ? "hidden md:block" : "block max-md:scale-75 max-md:opacity-40"
              }`}
            style={style}
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => sfx.hover()}
            title={item.alt}
          >
            <div
              className={`w-full h-full transition-transform duration-300 ease-out group-hover:scale-115 group-hover:-translate-y-1.5 ${isPopped ? "scale-125 -rotate-6" : ""
                }`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="w-full h-auto object-contain pointer-events-none select-none transition-filter duration-300 group-hover:drop-shadow-[0_0_20px_rgba(255,200,220,0.9)]"
                priority={false}
                loading="lazy"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
