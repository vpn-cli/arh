"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

interface HamsterStickerProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  rotate?: number;
  scale?: number;
  zIndex?: number;
  speech?: string;
  entranceDelay?: number;
  onClick?: () => void;
}

export default function HamsterSticker({
  src,
  alt = "Hamster Sticker",
  className = "",
  width = 120,
  height = 120,
  rotate = 0,
  scale = 1,
  zIndex = 10,
  speech,
  entranceDelay = 0,
  onClick,
}: HamsterStickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boopCount, setBoopCount] = useState(0);

  const handleBoop = () => {
    if (onClick) onClick();
    setBoopCount((prev) => prev + 1);

    if (containerRef.current) {
      gsap
        .timeline()
        .to(containerRef.current, {
          scaleY: 0.85 * scale,
          scaleX: 1.15 * scale,
          duration: 0.08,
          ease: "power1.in",
        })
        .to(containerRef.current, {
          scaleY: 1.1 * scale,
          scaleX: 0.92 * scale,
          duration: 0.12,
          ease: "back.out(2)",
        })
        .to(containerRef.current, {
          scaleY: 1 * scale,
          scaleX: 1 * scale,
          duration: 0.1,
          ease: "power1.out",
        });
    }
  };

  return (
    <div
      className={`absolute flex flex-col items-center justify-center animate-slide-up ${className}`}
      style={{ zIndex, transform: `rotate(${rotate}deg) scale(${scale})`, animationDelay: `${entranceDelay}ms` }}
    >
      {speech && (
        <div className="speech-bubble mb-3 max-w-[200px] text-center text-sm animate-float">
          {speech}
        </div>
      )}
      <div
        ref={containerRef}
        onClick={handleBoop}
        className="cursor-pointer transition-transform hover:brightness-110 active:scale-95 drop-shadow-[3px_3px_0px_rgba(32,35,63,0.25)]"
        data-cursor="hamster"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="pixelated"
          priority
        />
      </div>
    </div>
  );
}
