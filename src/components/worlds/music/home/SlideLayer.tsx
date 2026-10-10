/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useEffect } from "react";
import type { SlideItem } from "@/config/slideshow";

export interface SlideLayerProps {
  slide: SlideItem;
  isPriority: boolean;
  opacity: number;
  isFading: boolean;
  fadeMs?: number;
  onReady?: () => void;
  onError?: () => void;
}

export const SlideLayer = React.memo(function SlideLayer({
  slide,
  isPriority,
  opacity,
  isFading,
  fadeMs = 800,
  onReady,
  onError,
}: SlideLayerProps) {
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
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{
        opacity,
        transition: isFading ? `opacity ${fadeMs}ms var(--ease-out, ease-out)` : undefined,
      }}
    >
      <img
        ref={imgRef}
        src={slide.src}
        width={slide.width}
        height={slide.height}
        alt=""
        aria-hidden="true"
        fetchPriority={isPriority ? "high" : "auto"}
        decoding="async"
        className="h-full w-full object-cover"
        style={{ objectPosition: "65% 50%" }}
      />
    </div>
  );
});
