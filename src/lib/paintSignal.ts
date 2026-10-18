"use client";

import { useEffect } from "react";

export const TARGET_WORLD_PAINTED_EVENT = "target-world-painted";

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
          (window as any).__lastWorldPainted = {
            world: worldId,
            timestamp: performance.now(),
          };
        }
      });
    });

    return () => {
      if (animId1) cancelAnimationFrame(animId1);
      if (animId2) cancelAnimationFrame(animId2);
    };
  }, [worldId]);
}
