"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface LikeButtonProps {
  isSaved?: boolean;
  onToggle?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  size?: number;
  ariaLabel?: string;
  disableSnoopyPop?: boolean;
  showSnoopyPop?: boolean;
}

export const LikeButton = React.memo(function LikeButton({
  isSaved = false,
  onToggle,
  disabled = false,
  className = "",
  size = 20,
  ariaLabel,
  disableSnoopyPop = false,
  showSnoopyPop = true,
}: LikeButtonProps) {
  const shouldShowSnoopy = showSnoopyPop && !disableSnoopyPop;
  const [isAnimating, setIsAnimating] = useState(false);

  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (disabled || !onToggle) return;

      if (!isSaved) {
        if (!reducedMotion) {
          setIsAnimating(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setIsAnimating(false);
          }, 850);
        }
      } else {
        setIsAnimating(false);
      }

      await onToggle();
    },
    [disabled, onToggle, isSaved, reducedMotion]
  );

  const defaultLabel = isSaved ? "Remove from Liked Songs" : "Save to Liked Songs";
  const label = ariaLabel || defaultLabel;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`relative inline-flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${
          disabled ? "opacity-40 cursor-not-allowed hover:scale-100 active:scale-100" : ""
        } ${className}`}
      >
        <span
          className={`inline-flex items-center justify-center ${
            isSaved ? "text-[var(--color-vibrant)]" : "text-[var(--color-dark)] hover:text-[var(--color-vibrant)]"
          } ${isAnimating && !reducedMotion ? "mw-like-star-spring" : "mw-like-un-saving"}`}
        >
          {isSaved ? (
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              fill="currentColor"
              stroke="var(--color-dark)"
              strokeWidth="1"
              strokeLinejoin="round"
              className="shrink-0"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </span>
      </button>

      {/* Sparkles burst */}
      {isAnimating && !reducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none z-20"
        >
          <span className="absolute w-2 h-2 text-[var(--color-vibrant)] mw-like-sparkle-1">
            <svg viewBox="0 0 16 16" className="w-full h-full fill-current">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
            </svg>
          </span>
          <span className="absolute w-2 h-2 text-[#FFD166] mw-like-sparkle-2">
            <svg viewBox="0 0 16 16" className="w-full h-full fill-current">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
            </svg>
          </span>
          <span className="absolute w-1.5 h-1.5 text-[var(--color-vibrant)] mw-like-sparkle-3">
            <svg viewBox="0 0 16 16" className="w-full h-full fill-current">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
            </svg>
          </span>
          <span className="absolute w-1.5 h-1.5 text-[#FFD166] mw-like-sparkle-4">
            <svg viewBox="0 0 16 16" className="w-full h-full fill-current">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
            </svg>
          </span>
        </div>
      )}

      {/* Snoopy sticker pop (r2c1) */}
      {shouldShowSnoopy && isAnimating && !reducedMotion && (

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full mb-1 left-1/2 select-none z-30 mw-like-snoopy"
        >
          <img
            src="/stickers/snoopy-v1/r2c1.png"
            alt=""
            width={44}
            height={44}
            className="w-11 h-11 object-contain drop-shadow-sm max-w-none"
          />
        </div>
      )}
    </div>
  );
});

LikeButton.displayName = "LikeButton";
