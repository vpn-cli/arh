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
  const showLoginPromptRef = useRef(showLoginPrompt);

  useEffect(() => {
    showLoginPromptRef.current = showLoginPrompt;
  }, [showLoginPrompt]);

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const { deviceIdRef: contextDeviceIdRef } = useSpotifyPlayer();
  const deviceIdRef = externalDeviceIdRef || contextDeviceIdRef;
  const setDeviceId = useSpotifyPlayerStore((s) => s.setDeviceId);

  const { data: sessionData, refetch: refetchSession } = useSpotifySession();
  const refetchSessionRef = useRef(refetchSession);

  useEffect(() => {
    refetchSessionRef.current = refetchSession;
  }, [refetchSession]);

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
    const unsubLogin = onLoginRequired(() => setShowLoginPrompt(true));
    const unsubSession = onSessionRecovered(() => {
      const wasPromptShowing = showLoginPromptRef.current;
      setShowLoginPrompt(false);
      if (wasPromptShowing) {
        refetchSessionRef.current?.();
      }
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
      unsubLogin();
      unsubSession();
      unsubscribe();
    };
  }, [setDeviceId, deviceIdRef]);

  return {
    isReconnecting,
    recoveryError,
    setRecoveryError,
    handleDismissRecoveryError,
    showLoginPrompt,
    isSessionExpired,
  };
}
