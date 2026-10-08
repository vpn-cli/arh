/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useGameState } from "@/lib/gameState";
import { useSpotifySession } from "@/hooks/useSpotify";
import { getFreshToken } from "@/lib/spotifyClient";
import {
  registerPlayerForRecovery,
  subscribeRecoveryState,
  markNeedsRecovery,
  clearNeedsRecovery,
} from "@/lib/spotifyRecovery";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

export interface SpotifyPlayerContextValue {
  player: any | null;
  deviceIdRef: React.RefObject<string | null>;
  notReadyFiredRef: React.RefObject<boolean>;
  needsRecoveryRef: React.RefObject<boolean>;
  latestStateRef: React.RefObject<any>;
  subscribe: (listener: (state: any) => void) => () => void;
  disconnect: () => void;
}

// Module-level references guarding against remounts and React StrictMode double invocation
let sharedPlayer: any = null;
let isInitializing = false;
let sharedLatestState: any = null;
const subscribers = new Set<(state: any) => void>();
const playerListeners = new Set<() => void>();

function notifyPlayerChanged() {
  playerListeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.error("[SpotifyPlayerProvider] listener error:", err);
    }
  });
}

export function disconnectSpotifyPlayer() {
  if (sharedPlayer) {
    try {
      if (typeof sharedPlayer.disconnect === "function") {
        sharedPlayer.disconnect();
      }
    } catch (e) {
      console.warn("[SpotifyPlayerProvider] disconnect error:", e);
    }
    sharedPlayer = null;
  }
  isInitializing = false;
  sharedLatestState = null;
  subscribers.clear();
  try {
    registerPlayerForRecovery(null, { current: null }, { current: false });
    const store = useSpotifyPlayerStore.getState();
    store.setPlayer(null);
    store.setDeviceId(null);
    store.setIsReady(false);
  } catch {}
  notifyPlayerChanged();
}

const defaultContextValue: SpotifyPlayerContextValue = {
  player: null,
  deviceIdRef: { current: null },
  notReadyFiredRef: { current: false },
  needsRecoveryRef: { current: false },
  latestStateRef: { current: null },
  subscribe: () => () => {},
  disconnect: disconnectSpotifyPlayer,
};

const SpotifyPlayerContext = createContext<SpotifyPlayerContextValue>(defaultContextValue);

export function useSpotifyPlayer(): SpotifyPlayerContextValue {
  const ctx = useContext(SpotifyPlayerContext);
  return ctx || defaultContextValue;
}

export function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  const { currentWorld } = useGameState();
  const { data: sessionData } = useSpotifySession();
  const token = sessionData?.accessToken || null;

  const player = useSyncExternalStore(
    (callback) => {
      playerListeners.add(callback);
      return () => {
        playerListeners.delete(callback);
      };
    },
    () => sharedPlayer,
    () => null
  );

  const deviceIdRef = useRef<string | null>(null);
  const notReadyFiredRef = useRef<boolean>(false);
  const needsRecoveryRef = useRef<boolean>(false);
  const latestStateRef = useRef<any>(sharedLatestState);

  // Keep latestStateRef in sync with module-level state outside of render
  useEffect(() => {
    latestStateRef.current = sharedLatestState;
  });

  const subscribe = useCallback((listener: (state: any) => void) => {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  // Sync recovery state updates for device ID
  useEffect(() => {
    const unsubscribe = subscribeRecoveryState({
      onDeviceIdChange: (newId) => {
        deviceIdRef.current = newId;
        useSpotifyPlayerStore.getState().setDeviceId(newId);
      },
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Visibility and online health check
  useEffect(() => {
    const checkStateHealth = async () => {
      const p = sharedPlayer;
      if (!p) return;

      // Reconnect proactively (player.connect() only, no transfer) only if the SDK
      // fired not_ready or the device ID ref is null.
      if (notReadyFiredRef.current || !deviceIdRef.current) {
        console.log(
          `[${new Date().toISOString()}] [Spotify Health Check] Proactively reconnecting player (no transfer) because not_ready fired or deviceId is null.`
        );
        p.connect().catch((err: any) => {
          console.warn(
            `[${new Date().toISOString()}] [Spotify Health Check] player.connect() error:`,
            err
          );
        });
      }

      try {
        const state = await p.getCurrentState();
        if (state === null) {
          // getCurrentState() === null also means "this browser is not the active device",
          // which is normal when listening on another device (e.g. phone) or hasn't played yet.
          console.log(
            `[${new Date().toISOString()}] [Spotify Health Check] player.getCurrentState() returned null (browser not active device). Setting needs-recovery flag.`
          );
          needsRecoveryRef.current = true;
          markNeedsRecovery();
        } else {
          needsRecoveryRef.current = false;
          clearNeedsRecovery();
          latestStateRef.current = state;
          sharedLatestState = state;
        }
      } catch (err) {
        console.warn(
          `[${new Date().toISOString()}] [Spotify Health Check] Error checking player state:`,
          err
        );
        needsRecoveryRef.current = true;
        markNeedsRecovery();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkStateHealth();
      }
    };

    const handleOnline = () => {
      checkStateHealth();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Disconnect and clear reference on session expiry / logout
  useEffect(() => {
    if (!token && sharedPlayer) {
      disconnectSpotifyPlayer();
    }
  }, [token]);

  // Create player once, the first time Music World opens with a logged-in session
  useEffect(() => {
    if (currentWorld !== "music" || !token) return;
    if (sharedPlayer || isInitializing) return;

    isInitializing = true;

    const initializePlayer = () => {
      if (sharedPlayer) {
        isInitializing = false;
        return;
      }
      if (!window.Spotify) {
        isInitializing = false;
        return;
      }

      const spotifyPlayer = new window.Spotify.Player({
        name: "Kawaii Web Player",
        getOAuthToken: async (cb: (token: string) => void) => {
          try {
            const freshToken = await getFreshToken();
            if (freshToken) {
              cb(freshToken);
            }
          } catch (error) {
            console.error(
              `[${new Date().toISOString()}] [Spotify SDK getOAuthToken Error]`,
              error
            );
          }
        },
        volume: 0.5,
      });

      sharedPlayer = spotifyPlayer;
      isInitializing = false;
      notifyPlayerChanged();
      useSpotifyPlayerStore.getState().setPlayer(spotifyPlayer);

      registerPlayerForRecovery(spotifyPlayer, deviceIdRef, notReadyFiredRef);

      spotifyPlayer.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log(
          `[${new Date().toISOString()}] [Spotify SDK Event: ready] Device ID: ${device_id}`
        );
        deviceIdRef.current = device_id;
        notReadyFiredRef.current = false;
        useSpotifyPlayerStore.getState().setDeviceId(device_id);
        useSpotifyPlayerStore.getState().setIsReady(true);
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.warn(
          `[${new Date().toISOString()}] [Spotify SDK Event: not_ready] Device ID: ${device_id}`
        );
        deviceIdRef.current = null;
        notReadyFiredRef.current = true;
        useSpotifyPlayerStore.getState().setDeviceId(null);
        useSpotifyPlayerStore.getState().setIsReady(false);
      });

      spotifyPlayer.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        latestStateRef.current = state;
        sharedLatestState = state;

        const newTrack = state.track_window?.current_track;
        const store = useSpotifyPlayerStore.getState();
        store.setCurrentTrack(newTrack);
        store.setIsPaused(state.paused);
        store.setIsShuffle(state.shuffle);
        if (state.repeat_mode !== undefined) {
          if (
            state.repeat_mode === 0 ||
            state.repeat_mode === "0" ||
            state.repeat_mode === "off"
          ) {
            store.setRepeatMode("off");
          } else if (
            state.repeat_mode === 1 ||
            state.repeat_mode === "1" ||
            state.repeat_mode === "context"
          ) {
            store.setRepeatMode("context");
          } else if (
            state.repeat_mode === 2 ||
            state.repeat_mode === "2" ||
            state.repeat_mode === "track"
          ) {
            store.setRepeatMode("track");
          }
        }
        store.setDuration(state.duration);

        // Notify subscribers
        subscribers.forEach((cb) => {
          try {
            cb(state);
          } catch (err) {
            console.error("[SpotifyPlayerProvider] Subscriber error:", err);
          }
        });
      });

      spotifyPlayer.addListener(
        "initialization_error",
        ({ message }: { message: string }) => {
          console.error(
            `[${new Date().toISOString()}] [Spotify SDK Event: initialization_error] ${message}`
          );
          useSpotifyPlayerStore.getState().setError(message);
        }
      );

      spotifyPlayer.addListener(
        "authentication_error",
        ({ message }: { message: string }) => {
          console.error(
            `[${new Date().toISOString()}] [Spotify SDK Event: authentication_error] ${message}`
          );
          useSpotifyPlayerStore.getState().setError(message);
        }
      );

      spotifyPlayer.addListener("account_error", ({ message }: { message: string }) => {
        console.error(
          `[${new Date().toISOString()}] [Spotify SDK Event: account_error] ${message}`
        );
        useSpotifyPlayerStore.getState().setIsPremium(false);
        useSpotifyPlayerStore.getState().setError("Premium required for web playback.");
      });

      spotifyPlayer.addListener(
        "playback_error",
        ({ message }: { message: string }) => {
          console.error(
            `[${new Date().toISOString()}] [Spotify SDK Event: playback_error] ${message}`
          );
          useSpotifyPlayerStore.getState().setError(message);
        }
      );

      spotifyPlayer.connect();
    };

    if (!window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
      }
    } else {
      initializePlayer();
    }
  }, [currentWorld, token]);

  const value = useMemo<SpotifyPlayerContextValue>(
    () => ({
      player: player || sharedPlayer,
      deviceIdRef,
      notReadyFiredRef,
      needsRecoveryRef,
      latestStateRef,
      subscribe,
      disconnect: disconnectSpotifyPlayer,
    }),
    [player, subscribe]
  );

  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}
