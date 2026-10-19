"use client";

import { useEffect } from "react";

export const TARGET_WORLD_PAINTED_EVENT = "target-world-painted";

declare global {
  interface Window {
    __targetMountTime?: number | null;
    __targetPaintedTime?: number | null;
    __fadeStartTime?: number | null;
    __fadeEndTime?: number | null;
    __isReadyFlipped?: number | null;
    __transitionOverlayStartTime?: number | null;
    __lastWorldPainted?: { world: string; timestamp: number };
    __activeTlCount?: number;
    __activeSafetyTimers?: number;
  }
}

export function isTestMetricsEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (typeof window !== "undefined" && Boolean((window as unknown as { __TEST_METRICS__?: boolean }).__TEST_METRICS__)) {
    return true;
  }
  return false;
}

/**
 * Dispatches a paint signal two requestAnimationFrame callbacks after
 * the target world component's mount effect runs.
 */
export function useNotifyWorldPainted(worldId: string) {
  useEffect(() => {
    let animId1 = 0;
    let animId2 = 0;

    animId1 = requestAnimationFrame(() => {
      animId2 = requestAnimationFrame(() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(TARGET_WORLD_PAINTED_EVENT, {
              detail: { world: worldId, timestamp: performance.now() },
            })
          );
          if (isTestMetricsEnabled()) {
            window.__lastWorldPainted = {
              world: worldId,
              timestamp: performance.now(),
            };
          }
        }
      });
    });

    return () => {
      if (animId1) cancelAnimationFrame(animId1);
      if (animId2) cancelAnimationFrame(animId2);
    };
  }, [worldId]);
}

export { useWorldRevealed } from "@/lib/gameState";
