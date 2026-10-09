"use client";

import { useEffect, useState, useCallback, MutableRefObject, RefObject } from "react";
import { onLoginRequired } from "@/lib/spotifyClient";
import { subscribeRecoveryState } from "@/lib/spotifyRecovery";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { useSpotifyPlayer } from "@/providers/SpotifyPlayerProvider";

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

  const isSessionExpired = sessionError || showLoginPrompt;

  const handleDismissRecoveryError = useCallback(() => {
    setRecoveryError(null);
  }, []);

  useEffect(() => {
    onLoginRequired(() => setShowLoginPrompt(true));
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
