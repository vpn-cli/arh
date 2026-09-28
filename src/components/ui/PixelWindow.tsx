"use client";

import React from "react";

type WindowVariant = "pink" | "blue" | "yellow" | "lavender" | "mint";

interface PixelWindowProps {
  title: string;
  variant?: WindowVariant;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  compact?: boolean;
}

export default function PixelWindow({
  title,
  variant = "pink",
  children,
  className = "",
  contentClassName = "",
  compact = false,
}: PixelWindowProps) {
  return (
    <div className={`pixel-window pixel-window--${variant} ${className}`}>
      <div className="pixel-window__bar">
        <div className="pixel-window__dots">
          <span />
          <span />
          <span />
        </div>
        <span>{title}</span>
      </div>
      <div
        className={`pixel-window__content ${compact ? "!p-2 sm:!p-3" : ""} ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
