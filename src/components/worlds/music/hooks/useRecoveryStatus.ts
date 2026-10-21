"use client";

import { useEffect, useState, useCallback, useRef, MutableRefObject, RefObject } from "react";
import { onLoginRequired, onSessionRecovered } from "@/lib/spotifyClient";
import { subscribeRecoveryState } from "@/lib/spotifyRecovery";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { useSpotifyPlayer } from "@/providers/SpotifyPlayerProvider";
import { useSpotifySession } from "@/hooks/useSpotify";

export interface UseRecoveryStatusProps {
  sessionError?: boolean;
  deviceIdRef?: MutableRefObject<string | null> | RefObject<string | null>;
}

export function useRecoveryStatus({
  sessionError = false,
  deviceIdRef: externalDeviceIdRef,
}: UseRecoveryStatusProps = {}) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const { deviceIdRef: contextDeviceIdRef } = useSpotifyPlayer();
  const deviceIdRef = externalDeviceIdRef || contextDeviceIdRef;
  const setDeviceId = useSpotifyPlayerStore((s) => s.setDeviceId);

  const { data: sessionData, refetch: refetchSession } = useSpotifySession();

  const previousTokenRef = useRef(sessionData?.accessToken);

  // Reset sticky login prompt when session genuinely recovers via auth redirect or a newly acquired valid session
  useEffect(() => {
    const hasAuthSuccess =
      typeof window !== "undefined" &&
      window.location.search.includes("spotify_auth=success");

    const currentToken = sessionData?.accessToken;
    const isNewToken = Boolean(currentToken && currentToken !== previousTokenRef.current);

    if (hasAuthSuccess || isNewToken) {
      setShowLoginPrompt(false);
    }
    previousTokenRef.current = currentToken;
  }, [sessionData?.accessToken]);

  const isSessionExpired = sessionError || showLoginPrompt;

  const handleDismissRecoveryError = useCallback(() => {
    setRecoveryError(null);
  }, []);

  useEffect(() => {
    onLoginRequired(() => setShowLoginPrompt(true));
    onSessionRecovered(() => {
      setShowLoginPrompt(false);
      refetchSession?.();
    });
    const unsubscribe = subscribeRecoveryState({
      onReconnectingChange: (reconnecting) => setIsReconnecting(reconnecting),
      onErrorChange: (err) => setRecoveryError(err),
      onDeviceIdChange: (newId) => {
        if (deviceIdRef && "current" in deviceIdRef) {
          (deviceIdRef as MutableRefObject<string | null>).current = newId;
        }
        setDeviceId(newId);
      },
    });
    return () => {
      onLoginRequired(null);
      onSessionRecovered(null);
      unsubscribe();
    };
  }, [setDeviceId, deviceIdRef, refetchSession]);

  return {
    isReconnecting,
    recoveryError,
    setRecoveryError,
    handleDismissRecoveryError,
    showLoginPrompt,
    isSessionExpired,
  };
}
