"use client";

import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { computeNextQueueIndex, computePrevQueueIndex } from "./playbackHelpers";
import { seekSharedClock } from "./playbackClock";

export async function togglePlayGlobal(): Promise<void> {
  const store = useSpotifyPlayerStore.getState();
  const player = store.player;
  if (player && typeof player.togglePlay === "function") {
    try {
      await player.togglePlay();
    } catch (err) {
      console.warn("[globalPlaybackActions] togglePlay error:", err);
    }
  }
}

export function prevTrackGlobal(): void {
  const store = useSpotifyPlayerStore.getState();
  const { queue, queueIndex, repeatMode, player } = store;
  if (!player) return;

  const prevIdx = computePrevQueueIndex(repeatMode, queue.length, queueIndex);
  if (prevIdx !== null && prevIdx >= 0 && prevIdx < queue.length) {
    store.setQueueIndex(prevIdx);
  }
  if (typeof player.previousTrack === "function") {
    player.previousTrack().catch?.(() => {});
  }
}

export function nextTrackGlobal(): void {
  const store = useSpotifyPlayerStore.getState();
  const { queue, queueIndex, repeatMode, player } = store;
  if (!player) return;

  const nextIdx = computeNextQueueIndex(repeatMode, queue.length, queueIndex);
  if (nextIdx !== null && nextIdx >= 0 && nextIdx < queue.length) {
    store.setQueueIndex(nextIdx);
  }
  if (typeof player.nextTrack === "function") {
    player.nextTrack().catch?.(() => {});
  }
}

export function seekGlobal(positionMs: number): void {
  const player = useSpotifyPlayerStore.getState().player;
  if (player && typeof player.seek === "function") {
    player.seek(positionMs).catch?.(() => {});
  }
  seekSharedClock(positionMs);
}
