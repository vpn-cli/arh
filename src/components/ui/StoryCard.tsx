"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import PixelWindow from "./PixelWindow";

interface StoryCardProps {
  title: string;
  variant?: "pink" | "blue" | "yellow" | "lavender" | "mint";
  children: React.ReactNode;
  isActive: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

export default function StoryCard({
  title,
  variant = "pink",
  children,
  isActive,
  onEnter,
  onExit,
}: StoryCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      // Entrance animation
      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.2)", onComplete: onEnter }
        );
      }
    }
  }, [isActive, onEnter]);

  if (!isActive) return null;

  return (
    <div ref={containerRef} className="w-full max-w-lg mx-auto relative z-10">
      <PixelWindow title={title} variant={variant}>
        <div className="flex flex-col items-center text-center p-4 min-h-[300px] justify-between">
          {children}
        </div>
      </PixelWindow>
    </div>
  );
}
