"use client";

import React, { useEffect, useState } from "react";

type CursorMode = "default" | "pointer" | "photo" | "hamster";

export default function PixelCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [cursorMode, setCursorMode] = useState<CursorMode>("default");
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || prefersReducedMotion) {
      setIsEnabled(false);
      return;
    }

    setIsEnabled(true);

    let animationFrameId: number;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest("[data-cursor='hamster']")) {
          setCursorMode("hamster");
        } else if (target.closest("[data-cursor='photo']")) {
          setCursorMode("photo");
        } else if (
          target.closest(
            "button, a, [data-cursor='pointer'], [role='button'], input[type='checkbox']"
          )
        ) {
          setCursorMode("pointer");
        } else {
          setCursorMode("default");
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const render = () => {
      currentX += (targetX - currentX) * 0.45;
      currentY += (targetY - currentY) * 0.45;
      setPosition({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isEnabled || !isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-transform duration-75 ease-out select-none will-change-transform"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        left: -8,
        top: -8,
      }}
    >
      {cursorMode === "default" && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-[2px_2px_0px_rgba(58,46,80,0.3)]"
        >
          <path
            d="M12 2C8 2 4 8 4 15C4 20 7 22 12 22C17 22 20 20 20 15C20 8 16 2 12 2Z"
            fill="#FFFFFF"
            stroke="#3A2E50"
            strokeWidth="1.5"
          />
          <circle cx="7" cy="4" r="2" fill="#FFFFFF" stroke="#3A2E50" strokeWidth="1" />
          <circle cx="17" cy="4" r="2" fill="#FFFFFF" stroke="#3A2E50" strokeWidth="1" />
          <circle cx="8.5" cy="11" r="1.8" fill="#3A2E50" />
          <circle cx="8" cy="10.5" r="0.6" fill="#FFFFFF" />
          <circle cx="15.5" cy="11" r="1.8" fill="#3A2E50" />
          <circle cx="15" cy="10.5" r="0.6" fill="#FFFFFF" />
          <polygon points="12,13 11,14.5 13,14.5" fill="#FFB6C1" />
          <path
            d="M10 15.5Q12 17 14 15.5"
            stroke="#3A2E50"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      )}

      {cursorMode === "pointer" && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-[2px_2px_0px_rgba(58,46,80,0.3)] animate-pulse"
        >
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="#FFB6C1"
            stroke="#3A2E50"
            strokeWidth="2"
          />
        </svg>
      )}

      {cursorMode === "photo" && (
        <div className="flex items-center gap-1">
          <span className="text-sm">✨</span>
          <span className="text-[8px] font-retro text-dark bg-yellow px-1 py-0.5 border border-border shadow-[1px_1px_0_0_#3A2E50]">
            VIEW
          </span>
        </div>
      )}

      {cursorMode === "hamster" && (
        <div className="flex items-center gap-1">
          <span className="text-sm animate-bounce">✦</span>
          <span className="text-[8px] font-retro text-dark bg-pink px-1 py-0.5 border border-border shadow-[1px_1px_0_0_#3A2E50]">
            BOOP!
          </span>
        </div>
      )}
    </div>
  );
}
