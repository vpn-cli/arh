"use client";

import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { proxyFetch } from "@/lib/spotifyClient";
import {
  recoverPlaybackDevice,
  getNeedsRecovery,
  clearNeedsRecovery,
} from "@/lib/spotifyRecovery";
import {
  computeNextQueueIndex,
  computePrevQueueIndex,
  isValidContextUri,
  openInSpotify,
  sfx,
} from "./playbackHelpers";
import { seekSharedClock } from "./playbackClock";

export async function ensurePlaybackDevice(fallbackUri?: string): Promise<string | null> {
  const store = useSpotifyPlayerStore.getState();
  const activePlayer = store.player;
  if (activePlayer && typeof activePlayer.activateElement === "function") {
    activePlayer.activateElement().catch(() => {});
  }

  if (!store.isPremium) {
    openInSpotify(fallbackUri);
    return null;
  }

  let targetDevice = store.deviceId;

  if (getNeedsRecovery() || !targetDevice) {
    try {
      const reason = getNeedsRecovery()
        ? "ensurePlaybackDevice: needsRecovery"
        : "ensurePlaybackDevice: no device";
      const recoveredId = await recoverPlaybackDevice(reason);
      clearNeedsRecovery();
      targetDevice = recoveredId;
    } catch (err: any) {
      console.warn("[ensurePlaybackDevice] Device recovery error:", err);
      return null;
    }
  }

  return targetDevice || "";
}

export async function playTrackGlobal(
  uri: string,
  contextUri?: string,
  trackObj?: any
): Promise<void> {
  sfx.select();
  const targetDevice = await ensurePlaybackDevice(uri);
  if (targetDevice === null) return;

  try {
    let url = "/me/player/play";
    if (targetDevice) url += `?device_id=${targetDevice}`;
    const body: Record<string, unknown> = {};
    if (contextUri && isValidContextUri(contextUri)) {
      body.context_uri = contextUri;
      body.offset = { uri };
    } else {
      body.uris = [uri];
    }
    await proxyFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (trackObj) {
      useSpotifyPlayerStore.getState().setCurrentTrack(trackObj);
    }
  } catch (e: any) {
    console.error("[playTrackGlobal] Error playing track:", e);
  }
}

export async function playQueueItemGlobal(index: number): Promise<void> {
  const store = useSpotifyPlayerStore.getState();
  const queue = store.queue;
  if (index < 0 || index >= queue.length) return;
  const item = queue[index];
  store.setQueueIndex(index);
  if (item.contextUri) {
    await playTrackGlobal(item.track.uri, item.contextUri, item.track);
  } else {
    await playTrackGlobal(item.track.uri, undefined, item.track);
  }
}

export async function togglePlayGlobal(): Promise<void> {
  sfx.select();
  const store = useSpotifyPlayerStore.getState();
  const currentTrack = store.currentTrack;
  const targetDevice = await ensurePlaybackDevice(currentTrack?.uri);
  if (targetDevice === null) return;

  const activePlayer = store.player;
  if (!activePlayer) {
    if (currentTrack?.uri) {
      await playTrackGlobal(currentTrack.uri, undefined, currentTrack);
    }
    return;
  }

  try {
    const state = await activePlayer.getCurrentState();
    if ((!state || !state.track_window?.current_track) && currentTrack?.uri) {
      await playTrackGlobal(currentTrack.uri, undefined, currentTrack);
    } else {
      await activePlayer.togglePlay();
    }
  } catch (e: any) {
    console.warn("[togglePlayGlobal] State exception:", e);
    if (currentTrack?.uri) {
      await playTrackGlobal(currentTrack.uri, undefined, currentTrack);
    } else {
      activePlayer.togglePlay();
    }
  }
}

export function nextTrackGlobal(): void {
  const store = useSpotifyPlayerStore.getState();
  const activePlayer = store.player;
  if (!activePlayer) return;
  sfx.select();

  const { queue, queueIndex, repeatMode } = store;
  const nextIdx = computeNextQueueIndex(repeatMode, queue.length, queueIndex);
  if (nextIdx !== null) {
    playQueueItemGlobal(nextIdx).catch((err) => {
      console.warn("[nextTrackGlobal] playQueueItem error:", err);
    });
  } else {
    activePlayer.nextTrack().catch?.(() => {});
  }
}

export function prevTrackGlobal(): void {
  const store = useSpotifyPlayerStore.getState();
  const activePlayer = store.player;
  if (!activePlayer) return;
  sfx.select();

  const { queue, queueIndex, repeatMode } = store;
  const prevIdx = computePrevQueueIndex(repeatMode, queue.length, queueIndex);
  if (prevIdx !== null) {
    playQueueItemGlobal(prevIdx).catch((err) => {
      console.warn("[prevTrackGlobal] playQueueItem error:", err);
    });
  } else {
    activePlayer.previousTrack().catch?.(() => {});
  }
}

export function seekGlobal(positionMs: number): void {
  const player = useSpotifyPlayerStore.getState().player;
  if (player && typeof player.seek === "function") {
    player.seek(positionMs).catch?.(() => {});
  }
  seekSharedClock(positionMs);
}
