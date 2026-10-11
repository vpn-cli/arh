"use client";

import { useEffect, useRef } from "react";
import { useSpotifySession } from "@/hooks/useSpotify";
import { useMemoriesStore } from "@/store/useMemoriesStore";

export const FOCUS_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export function useMusicWorldMemories() {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const lastLoadTimeRef = useRef<number>(0);

  useEffect(() => {
    useMemoriesStore.getState().setAuthenticated?.(isAuthenticated);

    if (!isAuthenticated) return;

    // Load memories once when Music World mounts and the user is authenticated
    useMemoriesStore.getState().loadMemories(true);
    lastLoadTimeRef.current = Date.now();

    const handleFocus = () => {
      if (!isAuthenticated) return;
      const now = Date.now();
      if (now - lastLoadTimeRef.current >= FOCUS_THROTTLE_MS) {
        lastLoadTimeRef.current = now;
        useMemoriesStore.getState().loadMemories(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated]);
}
