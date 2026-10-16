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
  PLAYBACK_DEBUG,
  executePlayTracks,
} from "./playbackHelpers";
import { seekSharedClock } from "./playbackClock";

export async function ensurePlaybackDevice(fallbackUri?: string): Promise<string | null> {
  const store = useSpotifyPlayerStore.getState();
  const activePlayer = store.player;
  if (activePlayer && typeof activePlayer.activateElement === "function") {
    activePlayer.activateElement().catch(() => {});
  }

  if (store.accountTier === "free") {
    openInSpotify(fallbackUri);
    return null;
  }

  if (store.accountTier !== "premium") {
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
      body.offset = { position: 0 };
    }
    if (PLAYBACK_DEBUG) {
      console.debug("[PLAYBACK_DEBUG] playTrackGlobal request:", {
        clickedUri: uri,
        requestBody: body,
        targetDevice,
      });
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
  if (!item) return;

  sfx.select();
  const targetDevice = await ensurePlaybackDevice(item.track?.uri);
  if (targetDevice === null) return;

  store.setQueueIndex(index);
  if (item.track) {
    store.setCurrentTrack(item.track);
  }

  const contextUri =
    item.contextUri ||
    (isValidContextUri((item as any).context?.uri) ? (item as any).context?.uri : undefined);

  if (contextUri && isValidContextUri(contextUri)) {
    try {
      let url = "/me/player/play";
      if (targetDevice) url += `?device_id=${targetDevice}`;
      const body = {
        context_uri: contextUri,
        offset: { uri: item.track?.uri },
      };
      if (PLAYBACK_DEBUG) {
        console.debug("[PLAYBACK_DEBUG] playQueueItemGlobal context request:", body);
      }
      await proxyFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      console.error("[playQueueItemGlobal] Error playing context track:", e);
    }
    return;
  }

  const uris = queue.map((q) => q.track?.uri).filter(Boolean) as string[];
  await executePlayTracks(
    uris,
    queue,
    index,
    targetDevice,
    null,
    store.setQueue,
    store.setQueueIndex
  );
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
