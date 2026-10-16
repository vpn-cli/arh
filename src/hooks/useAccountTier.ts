"use client";

import { useEffect, useRef } from "react";
import { useSpotifySession, useSpotifyMe } from "./useSpotify";
import { useSpotifyPlayerStore, AccountTier } from "@/store/spotifyStore";
import { notifyRecoveryError } from "@/lib/spotifyRecovery";
import { useSpotifyLockStore } from "@/store/spotifyLockStore";

export const SPOTIFY_UNREACHABLE_MSG = "Can't reach Spotify right now. Trying again shortly.";

/**
 * Resolves Spotify account tier ('premium' | 'free' | 'unknown') wherever the player appears.
 * Reuses the existing cached/merged ['spotify', 'me'] React Query call without issuing new requests.
 * Automatically retries up to at most once every 30 seconds while the tier is 'unknown',
 * respecting local rate limits, and surfaces a recovery banner if unresolved after 8 seconds or on error.
 */
export function useAccountTier(): AccountTier {
  const accountTier = useSpotifyPlayerStore((s) => s.accountTier);
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  const query = useSpotifyMe({
    enabled: isAuthenticated,
    refetchInterval: (q) => {
      const currentTier = useSpotifyPlayerStore.getState().accountTier;
      if (currentTier !== "unknown") return false;

      const error: any = q?.state?.error;
      if (error?.status === 401) return false;

      const lockRemaining = useSpotifyLockStore.getState().getRemainingSeconds();
      const errRetryAfter = typeof error?.retryAfter === "number" ? error.retryAfter : 0;
      const remainingSec = Math.max(lockRemaining, errRetryAfter);

      // At most once every 30 seconds, never faster than the local limiter allows
      return Math.max(30_000, remainingSec * 1000);
    },
    refetchIntervalInBackground: true,
  });

  const bannerShownRef = useRef(false);
  const timeoutStartedRef = useRef(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (accountTier !== "unknown") {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (bannerShownRef.current) {
        notifyRecoveryError(null);
        bannerShownRef.current = false;
      }
      return;
    }

    if (query.isError) {
      const errorStatus = (query.error as any)?.status;
      if (errorStatus !== 401) {
        notifyRecoveryError(SPOTIFY_UNREACHABLE_MSG);
        bannerShownRef.current = true;
      }
      return;
    }

    if (isAuthenticated && !timeoutStartedRef.current) {
      timeoutStartedRef.current = true;
      timeoutIdRef.current = setTimeout(() => {
        const currentTier = useSpotifyPlayerStore.getState().accountTier;
        if (currentTier === "unknown") {
          notifyRecoveryError(SPOTIFY_UNREACHABLE_MSG);
          bannerShownRef.current = true;
        }
      }, 8000);
    }
  }, [accountTier, query.isError, query.error, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return accountTier;
}
