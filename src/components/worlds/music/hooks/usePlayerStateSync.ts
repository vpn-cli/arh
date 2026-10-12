/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs, react-hooks/purity */
"use client";

import { useEffect, useRef, useCallback, RefObject, MutableRefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSpotifyPlayer } from "@/providers/SpotifyPlayerProvider";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { useSpotifyMutations } from "@/hooks/useSpotify";
import { ProgressBarHandle } from "../now-playing";
import { LyricsViewHandle } from "../lyrics/LyricsView";
import {
  getSharedPositionMs,
  updateSharedPlaybackState,
  seekSharedClock,
  setSharedPaused,
} from "../playback/playbackClock";
import { PLAYBACK_DEBUG } from "../playback/playbackHelpers";
import { getPlayerQueue } from "@/lib/spotify/player";

export interface UsePlayerStateSyncOptions {
  progressBarRef: RefObject<ProgressBarHandle | null>;
  lyricsViewRef: RefObject<LyricsViewHandle | null>;
  userPausedRef: MutableRefObject<boolean>;
  selectedDevice?: string;
}

export function usePlayerStateSync({
  progressBarRef,
  lyricsViewRef,
  userPausedRef,
  selectedDevice = "",
}: UsePlayerStateSyncOptions) {
  const queryClient = useQueryClient();
  const {
    player: providerPlayer,
    deviceIdRef,
    latestStateRef,
    subscribe,
  } = useSpotifyPlayer();

  const storePlayer = useSpotifyPlayerStore((s) => s.player);
  const player = providerPlayer || storePlayer;

  const deviceId = useSpotifyPlayerStore((s) => s.deviceId);
  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);

  const setCurrentTrack = useSpotifyPlayerStore((s) => s.setCurrentTrack);
  const setIsPaused = useSpotifyPlayerStore((s) => s.setIsPaused);
  const setIsShuffle = useSpotifyPlayerStore((s) => s.setIsShuffle);
  const setRepeatMode = useSpotifyPlayerStore((s) => s.setRepeatMode);
  const setDuration = useSpotifyPlayerStore((s) => s.setDuration);
  const setQueueIndex = useSpotifyPlayerStore((s) => s.setQueueIndex);
  const setQueue = useSpotifyPlayerStore((s) => s.setQueue);

  const { play } = useSpotifyMutations();

  const lastActiveTrackIdRef = useRef<string | null>(null);
  const isAutoplayingRef = useRef(false);
  const lastActiveTrackUriRef = useRef<string | null>(null);
  const hasActuallyPlayedRef = useRef(false);
  const prevPositionRef = useRef(0);
  const queueDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playerRef = useRef(player);
  playerRef.current = player;

  const getPositionMs = useCallback(() => {
    return getSharedPositionMs();
  }, []);

  const handleSeek = useCallback(
    (targetMs: number) => {
      if (playerRef.current) {
        playerRef.current.seek(targetMs);
      }
      seekSharedClock(targetMs);
      progressBarRef.current?.showPosition(targetMs);
      lyricsViewRef.current?.resync(targetMs);
    },
    [progressBarRef, lyricsViewRef]
  );

  const handleDragSeek = useCallback((newPos: number) => {
    seekSharedClock(newPos);
  }, []);

  // Sync pause states for our shared accumulator
  useEffect(() => {
    setSharedPaused(isPaused);
  }, [isPaused]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (queueDebounceTimerRef.current) {
        clearTimeout(queueDebounceTimerRef.current);
      }
    };
  }, []);

  const applyPlayerState = useCallback(
    async (state: any) => {
      if (!state) return;
      const newTrack = state.track_window?.current_track;
      const storeState = useSpotifyPlayerStore.getState();

      if (newTrack?.id !== storeState.currentTrack?.id) {
        setCurrentTrack(newTrack);
        // Update queue from SDK's track_window.next_tracks instead of invalidating query
        const nextTracks = state.track_window?.next_tracks || [];
        queryClient.setQueryData(['spotify', 'playerQueue'], {
          currently_playing: newTrack,
          queue: nextTracks,
        });

        // Debounce remaining queue refresh by 1.5s after last track change (isPolling: true)
        if (queueDebounceTimerRef.current) {
          clearTimeout(queueDebounceTimerRef.current);
        }
        queueDebounceTimerRef.current = setTimeout(async () => {
          try {
            const freshQueue = await getPlayerQueue(true);
            if (freshQueue) {
              queryClient.setQueryData(['spotify', 'playerQueue'], freshQueue);
            }
          } catch (e) {
            console.error('Debounced queue refresh error:', e);
          }
        }, 1500);
      }
      if (storeState.isPaused !== state.paused) {
        setIsPaused(state.paused);
      }
      const incomingShuffle =
        typeof state.shuffle === 'boolean'
          ? state.shuffle
          : typeof state.shuffle_state === 'boolean'
            ? state.shuffle_state
            : undefined;

      if (PLAYBACK_DEBUG) {
        console.debug('[PLAYBACK_DEBUG] player state shuffle:', {
          incomingShuffle,
          rawShuffle: state.shuffle,
          rawShuffleState: state.shuffle_state,
          storeShuffle: storeState.isShuffle,
        });
      }

      if (typeof incomingShuffle === 'boolean' && storeState.isShuffle !== incomingShuffle) {
        setIsShuffle(incomingShuffle);
      }
      if (state.repeat_mode !== undefined) {
        let nextRepeat: "off" | "context" | "track" = "off";
        if (state.repeat_mode === 0 || state.repeat_mode === "0" || state.repeat_mode === "off") {
          nextRepeat = "off";
        } else if (state.repeat_mode === 1 || state.repeat_mode === "1" || state.repeat_mode === "context") {
          nextRepeat = "context";
        } else if (state.repeat_mode === 2 || state.repeat_mode === "2" || state.repeat_mode === "track") {
          nextRepeat = "track";
        }
        if (storeState.repeatMode !== nextRepeat) {
          setRepeatMode(nextRepeat);
        }
      }

      // Only reset the accumulator when the track ACTUALLY changes to avoid stale event freezing
      const incomingTrackId = state.track_window?.current_track?.id;
      if (incomingTrackId && incomingTrackId !== lastActiveTrackIdRef.current) {
        lastActiveTrackIdRef.current = incomingTrackId;
        hasActuallyPlayedRef.current = false;
        prevPositionRef.current = 0;
      }

      if (!state.paused && state.position > 1000) {
        hasActuallyPlayedRef.current = true;
      }

      updateSharedPlaybackState(state.position, state.paused);

      progressBarRef.current?.applyState({
        positionMs: state.position,
        durationMs: state.duration,
        paused: state.paused,
      });

      lyricsViewRef.current?.resync(state.position);

      if (storeState.duration !== state.duration) {
        setDuration(state.duration);
      }

      // Sync queue position if track is in store queue
      if (newTrack?.uri) {
        lastActiveTrackUriRef.current = newTrack.uri;
        const currentQueue = storeState.queue;
        const idx = currentQueue.findIndex((item) => item.track?.uri === newTrack.uri);
        if (idx !== -1 && storeState.queueIndex !== idx) {
          setQueueIndex(idx);
        }
      }

      // Continuous playback: if playback legitimately ended (track was playing and reached end)
      const nextTracks = state.track_window?.next_tracks || [];
      const didReachEnd =
        hasActuallyPlayedRef.current &&
        state.duration > 0 &&
        (prevPositionRef.current >= state.duration - 3000 ||
          (state.position === 0 && prevPositionRef.current >= state.duration * 0.85));

      const isEnded =
        state.paused && didReachEnd && !userPausedRef.current && !!lastActiveTrackUriRef.current;

      prevPositionRef.current = state.position;

      if (isEnded && nextTracks.length === 0 && !isAutoplayingRef.current) {
        isAutoplayingRef.current = true;
        try {
          const trackForAutoplay = newTrack || currentTrack;
          if (trackForAutoplay) {
            const { getRelevantTracks } = await import("@/lib/spotify/player");
            const relevant = await getRelevantTracks(trackForAutoplay, 10);
            if (relevant.length > 0) {
              const targetDevice = selectedDevice || deviceIdRef?.current || deviceId;
              const autoPayload = {
                uris: relevant.map((t: any) => t.uri),
                device_id: targetDevice || undefined,
              };
              if (PLAYBACK_DEBUG) {
                console.debug("[PLAYBACK_DEBUG] auto-advance on track end request:", {
                  triggerTrack: trackForAutoplay.name,
                  requestBody: autoPayload,
                });
              }
              await play.mutateAsync(autoPayload);
              setQueue(relevant.map((t: any) => ({ track: t })));
              setQueueIndex(0);
            }
          }
        } catch (e) {
          console.error("Autoplay error:", e);
        } finally {
          setTimeout(() => {
            isAutoplayingRef.current = false;
          }, 3000);
        }
      }
    },
    [
      setCurrentTrack,
      setIsPaused,
      setIsShuffle,
      setRepeatMode,
      setDuration,
      setQueueIndex,
      currentTrack,
      selectedDevice,
      deviceId,
      deviceIdRef,
      play,
      setQueue,
      userPausedRef,
      progressBarRef,
      lyricsViewRef,
      queryClient,
    ]
  );

  const applyPlayerStateRef = useRef(applyPlayerState);
  applyPlayerStateRef.current = applyPlayerState;

  const resyncedPlayerRef = useRef<any>(null);

  // Hook subscription and on-mount resync from player.getCurrentState()
  useEffect(() => {
    if (!player) return;

    if (resyncedPlayerRef.current !== player) {
      resyncedPlayerRef.current = player;
      if (latestStateRef?.current) {
        applyPlayerStateRef.current(latestStateRef.current);
      }
      if (typeof player.getCurrentState === "function") {
        player.getCurrentState().then((state: any) => {
          if (state) {
            applyPlayerStateRef.current(state);
          }
        });
      }
    }

    const unsubscribe = subscribe((state: any) => {
      applyPlayerStateRef.current(state);
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, subscribe]);

  return {
    getPositionMs,
    handleSeek,
    handleDragSeek,
    player,
  };
}
