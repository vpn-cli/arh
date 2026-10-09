/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs, react-hooks/purity */
"use client";

import { useEffect, useRef, useCallback, RefObject, MutableRefObject } from "react";
import { useSpotifyPlayer } from "@/providers/SpotifyPlayerProvider";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { useSpotifyMutations } from "@/hooks/useSpotify";
import { ProgressBarHandle } from "../now-playing";
import { LyricsViewHandle } from "../lyrics/LyricsView";

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

  const trackStartTimeRef = useRef(Date.now());
  const pausedDurationRef = useRef(0);
  const pauseTimestampRef = useRef<number | null>(null);
  const lastActiveTrackIdRef = useRef<string | null>(null);
  const isAutoplayingRef = useRef(false);
  const lastActiveTrackUriRef = useRef<string | null>(null);

  const playerRef = useRef(player);
  playerRef.current = player;

  const getPositionMs = useCallback(() => {
    return Math.max(
      0,
      (pauseTimestampRef.current ?? Date.now()) -
        trackStartTimeRef.current -
        pausedDurationRef.current
    );
  }, []);

  const handleSeek = useCallback(
    (targetMs: number) => {
      if (playerRef.current) {
        playerRef.current.seek(targetMs);
      }
      trackStartTimeRef.current = Date.now() - targetMs - pausedDurationRef.current;
      progressBarRef.current?.showPosition(targetMs);
      lyricsViewRef.current?.resync(targetMs);
    },
    [progressBarRef, lyricsViewRef]
  );

  const handleDragSeek = useCallback((newPos: number) => {
    trackStartTimeRef.current = Date.now() - newPos - pausedDurationRef.current;
  }, []);

  // Sync pause states for our accumulator
  useEffect(() => {
    if (isPaused) {
      if (!pauseTimestampRef.current) pauseTimestampRef.current = Date.now();
    } else {
      if (pauseTimestampRef.current) {
        pausedDurationRef.current += Date.now() - pauseTimestampRef.current;
        pauseTimestampRef.current = null;
      }
    }
  }, [isPaused]);

  const applyPlayerState = useCallback(
    async (state: any) => {
      if (!state) return;
      const newTrack = state.track_window?.current_track;
      const storeState = useSpotifyPlayerStore.getState();

      if (newTrack?.id !== storeState.currentTrack?.id) {
        setCurrentTrack(newTrack);
      }
      if (storeState.isPaused !== state.paused) {
        setIsPaused(state.paused);
      }
      if (storeState.isShuffle !== state.shuffle) {
        setIsShuffle(state.shuffle);
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
      }
      trackStartTimeRef.current = Date.now() - state.position;
      pausedDurationRef.current = 0;
      pauseTimestampRef.current = state.paused ? Date.now() : null;

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

      // Continuous playback: if playback ended and next_tracks is empty
      const nextTracks = state.track_window?.next_tracks || [];
      const isEnded =
        state.paused && state.position === 0 && !userPausedRef.current && !!lastActiveTrackUriRef.current;
      if (isEnded && nextTracks.length === 0 && !isAutoplayingRef.current) {
        isAutoplayingRef.current = true;
        try {
          const trackForAutoplay = newTrack || currentTrack;
          if (trackForAutoplay) {
            const { getRelevantTracks } = await import("@/lib/spotify/player");
            const relevant = await getRelevantTracks(trackForAutoplay, 10);
            if (relevant.length > 0) {
              const targetDevice = selectedDevice || deviceIdRef?.current || deviceId;
              await play.mutateAsync({
                uris: relevant.map((t: any) => t.uri),
                device_id: targetDevice || undefined,
              });
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
