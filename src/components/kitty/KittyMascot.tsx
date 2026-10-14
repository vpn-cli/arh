"use client";

import React from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export type KittyMascotProps = {
  size?: number;
  className?: string;
  animate?: boolean;
};

export default function KittyMascot({
  size = 180,
  className = "",
  animate = true,
}: KittyMascotProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;
  const height = Math.round(size * (251 / 266));

  return (
    <Image
      src="/images/terminal-kitty.webp"
      alt="Hello Kitty mascot"
      width={size}
      height={height}
      priority
      unoptimized
      className={`block w-[140px] sm:w-[170px] md:w-[180px] max-w-full h-auto select-none pointer-events-none motion-reduce:animate-none ${className}`.trim()}
      style={{
        maxWidth: `${size}px`,
        imageRendering: "pixelated",
        animation: shouldAnimate
          ? "slide-up 0.5s ease-out, float-gentle 3s ease-in-out 0.5s infinite"
          : undefined,
      }}
    />
  );
}

export { KittyMascot };
