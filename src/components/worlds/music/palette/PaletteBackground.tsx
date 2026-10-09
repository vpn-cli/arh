/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";

export interface PaletteBackgroundProps {
  currentTrack?: any;
  effectiveQueue?: any[];
  queueIndex?: number;
}

export const PaletteBackground = React.memo(function PaletteBackground({
  currentTrack,
  effectiveQueue,
  queueIndex = 0,
}: PaletteBackgroundProps) {
  const paletteCache = useRef<Record<string, any>>({});
  const [layerPalettes, setLayerPalettes] = useState<[any, any]>([null, null]);
  const [activeLayerIndex, setActiveLayerIndex] = useState<0 | 1>(0);
  const activeLayerRef = useRef<0 | 1>(0);
  const [palette, setPalette] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const base = palette?.vibrant || "#C2185B";
    const computedBg = palette?.computed?.bg || `color-mix(in srgb, ${base} 8%, #ffffff)`;
    const computedLight = palette?.computed?.light || `color-mix(in srgb, ${base} 15%, #ffffff)`;
    const computedMuted = palette?.computed?.muted || `color-mix(in srgb, ${base} 35%, #ffffff)`;
    const computedDark = palette?.computed?.dark || `color-mix(in srgb, ${base} 40%, #000000)`;

    root.style.setProperty("--base-color", base);
    root.style.setProperty("--color-bg", computedBg);
    root.style.setProperty("--color-light", computedLight);
    root.style.setProperty("--color-muted", computedMuted);
    root.style.setProperty("--color-vibrant", base);
    root.style.setProperty("--color-dark", computedDark);
  }, [palette]);

  useEffect(() => {
    const getArt = (track: any) =>
      track?.album?.images?.[0]?.url ||
      (typeof track?.album?.images?.[0] === "string" ? track.album.images[0] : null);

    const fetchPalette = async (art: string) => {
      if (paletteCache.current[art]) return paletteCache.current[art];
      try {
        const res = await fetch(`/api/album-palette?url=${encodeURIComponent(art)}`);
        const data = await res.json();
        if (!data.error) {
          paletteCache.current[art] = data;
          return data;
        }
      } catch (e) {
        console.error(e);
      }
      return null;
    };

    const urisToFetch = new Set<string>();
    const currentArt = getArt(currentTrack);
    if (currentArt) urisToFetch.add(currentArt);

    if (effectiveQueue && effectiveQueue.length > 0 && queueIndex < effectiveQueue.length - 1) {
      const nextArt = getArt(effectiveQueue[queueIndex + 1]?.track);
      if (nextArt) urisToFetch.add(nextArt);
    }

    urisToFetch.forEach((art) => {
      fetchPalette(art).then((data) => {
        if (currentArt === art && data) {
          setPalette((prev: any) => {
            if (prev?.vibrant === data.vibrant) return prev;

            const nextIdx = (1 - activeLayerRef.current) as 0 | 1;
            setLayerPalettes((layers) => {
              const newLayers = [...layers] as [any, any];
              newLayers[nextIdx] = data;
              return newLayers;
            });
            activeLayerRef.current = nextIdx;
            setActiveLayerIndex(nextIdx);

            return data;
          });
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, effectiveQueue?.length, queueIndex]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            --base-color: ${palette?.vibrant || "#C2185B"};
            --color-bg: ${palette?.computed?.bg || "color-mix(in srgb, var(--base-color) 8%, #ffffff)"};
            --color-light: ${palette?.computed?.light || "color-mix(in srgb, var(--base-color) 15%, #ffffff)"};
            --color-muted: ${palette?.computed?.muted || "color-mix(in srgb, var(--base-color) 35%, #ffffff)"};
            --color-vibrant: var(--base-color);
            --color-dark: ${palette?.computed?.dark || "color-mix(in srgb, var(--base-color) 40%, #000000)"};
          }
          .bg-layer-0 {
            --layer-bg: ${layerPalettes[0]?.computed?.bg || "color-mix(in srgb, " + (layerPalettes[0]?.vibrant || "#C2185B") + " 8%, #ffffff)"};
          }
          .bg-layer-1 {
            --layer-bg: ${layerPalettes[1]?.computed?.bg || "color-mix(in srgb, " + (layerPalettes[1]?.vibrant || "#C2185B") + " 8%, #ffffff)"};
          }
        `,
        }}
      />
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-[600ms] ease-in-out bg-layer-0 ${
          activeLayerIndex === 0 ? "opacity-95" : "opacity-0"
        }`}
        style={{
          backgroundColor:
            layerPalettes[0]?.computed?.bg ||
            `color-mix(in srgb, ${layerPalettes[0]?.vibrant || "#C2185B"} 8%, #ffffff)`,
        }}
      />
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-[600ms] ease-in-out bg-layer-1 ${
          activeLayerIndex === 1 ? "opacity-95" : "opacity-0"
        }`}
        style={{
          backgroundColor:
            layerPalettes[1]?.computed?.bg ||
            `color-mix(in srgb, ${layerPalettes[1]?.vibrant || "#C2185B"} 8%, #ffffff)`,
        }}
      />
    </>
  );
});
