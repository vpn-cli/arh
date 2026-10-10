/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useEffect } from "react";
import type { SlideItem } from "@/config/slideshow";

export interface SlideLayerProps {
  slide: SlideItem;
  isPriority: boolean;
  opacity: number;
  isFading: boolean;
  onReady?: () => void;
  onError?: () => void;
}

export const SlideLayer = React.memo(function SlideLayer({
  slide,
  isPriority,
  opacity,
  isFading,
  onReady,
  onError,
}: SlideLayerProps) {
  const isWide = slide.width / slide.height >= 1.6;
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !onReady) return;

    let cancelled = false;

    if (img.complete && img.naturalWidth > 0) {
      if ("decode" in img) {
        img
          .decode()
          .then(() => {
            if (!cancelled) onReady();
          })
          .catch(() => {
            if (!cancelled && onError) onError();
          });
      } else {
        onReady();
      }
    } else {
      const handleLoad = () => {
        if (cancelled) return;
        if ("decode" in img) {
          img
            .decode()
            .then(() => {
              if (!cancelled) onReady();
            })
            .catch(() => {
              if (!cancelled && onError) onError();
            });
        } else {
          onReady();
        }
      };

      const handleError = () => {
        if (!cancelled && onError) onError();
      };

      img.addEventListener("load", handleLoad, { once: true });
      img.addEventListener("error", handleError, { once: true });

      return () => {
        cancelled = true;
        img.removeEventListener("load", handleLoad);
        img.removeEventListener("error", handleError);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [slide.src, onReady, onError]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        opacity,
        transition: isFading ? "opacity 600ms var(--ease-out)" : undefined,
        pointerEvents: opacity === 1 ? "auto" : "none",
      }}
    >
      {!isWide && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-60 pointer-events-none"
          style={{ backgroundImage: `url(${slide.src})` }}
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={slide.src}
        width={slide.width}
        height={slide.height}
        alt=""
        fetchPriority={isPriority ? "high" : "auto"}
        decoding="async"
        className={
          isWide
            ? "h-full w-full object-cover"
            : "relative z-10 h-full w-full object-contain"
        }
      />
    </div>
  );
});
