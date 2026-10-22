import React from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

export interface UsePlaybackActionsOptions {
  selectedDevice?: string;
  setRecoveryError: (error: string | null) => void;
  birthdayMixTracks?: any[];
  likedTracks?: any[];
  recentTracks?: any[];
  isSaved?: boolean;
  effectiveQueue?: any[];
}

export interface UsePlaybackActionsReturn {
  playTrack: (uri: string, contextUri?: any, trackObj?: any) => Promise<void>;
  playTracks: (uris: string[], tracksList?: any[], offsetPosition?: number) => Promise<void>;
  playPlaylist: (uri: string, playlistTracks?: any[]) => Promise<void>;
  playContextTrack: (contextUri: string, trackUri: string, tracksList?: any[]) => Promise<void>;
  playQueueItem: (index: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
  toggleSaveTrack: () => Promise<void>;
  handleAddToQueue: (trackOrUri: any, contextUri?: any) => Promise<void>;
  userPausedRef: React.RefObject<boolean>;
}

export const isValidContextUri = (uri: unknown): uri is string => {
  return (
    typeof uri === 'string' &&
    (uri.startsWith('spotify:playlist:') ||
      uri.startsWith('spotify:album:') ||
      uri.startsWith('spotify:artist:') ||
      uri.startsWith('spotify:show:'))
  );
};

export function openInSpotify(uri?: string): void {
  if (!uri) return;
  const parts = uri.split(':');
  if (parts.length === 3) {
    window.open(`https://open.spotify.com/${parts[1]}/${parts[2]}`, '_blank');
  }
}

export const sfx = {
  select: () => { },
  hover: () => { },
  pop: () => { },
  move: () => { },
  error: () => { },
};

export function findTrackInSources(
  uri: string,
  sources: {
    birthdayMixTracks?: any[];
    likedTracks?: any[];
    recentTracks?: any[];
  }
): any {
  return (
    sources.birthdayMixTracks?.find((t: any) => t.uri === uri) ||
    sources.likedTracks?.find((t: any) => t.uri === uri) ||
    sources.recentTracks?.find((item: any) => item.track?.uri === uri)?.track
  );
}

export function resolveTrackForPlayback(
  uri: string,
  contextUri: any,
  trackObj: any,
  currentTrack: any,
  sources: {
    birthdayMixTracks?: any[];
    likedTracks?: any[];
    recentTracks?: any[];
  }
): any {
  let track = trackObj;
  if (!track && typeof contextUri === 'object' && contextUri !== null) {
    track = contextUri;
  }
  if (!track && currentTrack?.uri === uri) {
    track = currentTrack;
  }
  if (!track) {
    track = findTrackInSources(uri, sources);
  }
  return track;
}

export async function fetchRelevantTracks(track: any): Promise<any[]> {
  if (!track) return [];
  try {
    const { getRelevantTracks } = await import('@/lib/spotify/player');
    return await getRelevantTracks(track, 10);
  } catch (err) {
    console.warn('Could not fetch relevant tracks:', err);
    return [];
  }
}

export const PLAYBACK_DEBUG = false;

interface PendingPlay {
  trackId: string | null;
  uri: string | null;
  timestamp: number;
}

let pendingPlay: PendingPlay | null = null;
let lastIgnoredTrack: any = null;
let lastIgnoredNextTracks: any[] = [];
let pendingExpiryTimer: NodeJS.Timeout | null = null;

export type DeferredApplyCallback = (deferredTrack: any, nextTracks?: any[]) => void;
let deferredApplyCallback: DeferredApplyCallback | null = null;

export function setDeferredApplyCallback(cb: DeferredApplyCallback | null): () => void {
  deferredApplyCallback = cb;
  return () => {
    if (deferredApplyCallback === cb) {
      deferredApplyCallback = null;
    }
  };
}

export function clearPendingTrackId(): void {
  if (pendingExpiryTimer) {
    clearTimeout(pendingExpiryTimer);
    pendingExpiryTimer = null;
  }
  pendingPlay = null;
  lastIgnoredTrack = null;
  lastIgnoredNextTracks = [];
}

export function recordPendingTrackId(trackId?: string | null, uri?: string | null): void {
  if (pendingExpiryTimer) {
    clearTimeout(pendingExpiryTimer);
    pendingExpiryTimer = null;
  }
  lastIgnoredTrack = null;
  lastIgnoredNextTracks = [];

  const resolvedId =
    trackId || (uri?.startsWith('spotify:track:') ? uri.split(':')[2] : null);
  const resolvedUri =
    uri || (resolvedId ? `spotify:track:${resolvedId}` : null);

  if (resolvedId || resolvedUri) {
    pendingPlay = {
      trackId: resolvedId,
      uri: resolvedUri,
      timestamp: Date.now(),
    };

    pendingExpiryTimer = setTimeout(() => {
      pendingExpiryTimer = null;
      if (!pendingPlay) return;

      const deferred = lastIgnoredTrack;
      const nextTracks = lastIgnoredNextTracks;
      pendingPlay = null;
      lastIgnoredTrack = null;
      lastIgnoredNextTracks = [];

      if (deferred) {
        const store = useSpotifyPlayerStore.getState();
        const current = store.currentTrack;
        const differs =
          (deferred.id && deferred.id !== current?.id) ||
          (deferred.uri && deferred.uri !== current?.uri) ||
          (!deferred.id && !deferred.uri && deferred !== current);

        if (differs) {
          store.setCurrentTrack(deferred);
          if (store.queue.length > 0) {
            const idx = store.queue.findIndex(
              (item) =>
                (item.track?.id && item.track.id === deferred.id) ||
                (item.track?.uri && item.track.uri === deferred.uri)
            );
            if (idx !== -1 && idx !== store.queueIndex) {
              store.setQueueIndex(idx);
            }
          }
          if (deferredApplyCallback) {
            deferredApplyCallback(deferred, nextTracks);
          }
        }
      }
    }, 3000);
  } else {
    pendingPlay = null;
  }
}

export function getPendingTrackId(): string | null {
  if (!pendingPlay) return null;
  if (Date.now() - pendingPlay.timestamp >= 3000) {
    clearPendingTrackId();
    return null;
  }
  return pendingPlay.trackId;
}

export function getLastIgnoredTrack(): any {
  return lastIgnoredTrack;
}

export function shouldIgnoreIncomingTrack(
  incomingTrackOrId?: any,
  linkedFromId?: string | null,
  nextTracks?: any[]
): boolean {
  if (!pendingPlay) return false;
  if (Date.now() - pendingPlay.timestamp >= 3000) {
    clearPendingTrackId();
    return false;
  }

  let incomingId: string | null = null;
  let incomingLinkedFromId: string | null = linkedFromId || null;
  let incomingUri: string | null = null;
  let trackObj: any = null;

  if (incomingTrackOrId && typeof incomingTrackOrId === 'object') {
    trackObj = incomingTrackOrId;
    incomingId =
      trackObj.id ||
      (trackObj.uri?.startsWith('spotify:track:') ? trackObj.uri.split(':')[2] : null);
    incomingLinkedFromId = trackObj.linked_from?.id || linkedFromId || null;
    incomingUri =
      trackObj.uri || (incomingId ? `spotify:track:${incomingId}` : null);
  } else if (typeof incomingTrackOrId === 'string') {
    incomingId = incomingTrackOrId.startsWith('spotify:track:')
      ? incomingTrackOrId.split(':')[2]
      : incomingTrackOrId;
    incomingUri = incomingTrackOrId.startsWith('spotify:track:')
      ? incomingTrackOrId
      : `spotify:track:${incomingTrackOrId}`;
    trackObj = { id: incomingId, uri: incomingUri };
  }

  const matchesId = Boolean(
    (pendingPlay.trackId && incomingId && incomingId === pendingPlay.trackId) ||
    (pendingPlay.trackId && incomingLinkedFromId && incomingLinkedFromId === pendingPlay.trackId)
  );

  const matchesUri = Boolean(
    (pendingPlay.uri && incomingUri && incomingUri === pendingPlay.uri) ||
    (pendingPlay.uri && trackObj?.linked_from?.uri && trackObj.linked_from.uri === pendingPlay.uri)
  );

  if (matchesId || matchesUri) {
    clearPendingTrackId();
    return false;
  }

  if (trackObj) {
    lastIgnoredTrack = trackObj;
    if (nextTracks) {
      lastIgnoredNextTracks = nextTracks;
    }
  }

  return true;
}

export function isQueueItem(item: any): boolean {
  return Boolean(
    item &&
    typeof item === 'object' &&
    typeof item.track === 'object' &&
    item.track !== null
  );
}

export function toQueueItem(item: any, contextUri?: string): { track: any; contextUri?: string } {
  if (isQueueItem(item)) {
    return contextUri && !item.contextUri ? { ...item, contextUri } : item;
  }
  return { track: item, contextUri };
}

export function extractTrack(item: any): any {
  if (isQueueItem(item)) {
    return item.track;
  }
  return item;
}

export async function executeContinuousPlayTrack(
  uri: string,
  track: any,
  targetDevice: string,
  playMutation: any,
  setStoreQueue: (queue: any[]) => void,
  setStoreQueueIndex: (index: number) => void
): Promise<void> {
  const resolvedTrack = track;
  const resolvedUri = resolvedTrack?.uri || uri;
  const resolvedId =
    resolvedTrack?.id ||
    (resolvedUri?.startsWith('spotify:track:') ? resolvedUri.split(':')[2] : null);
  if (resolvedId || resolvedUri) {
    recordPendingTrackId(resolvedId, resolvedUri);
  }
  if (resolvedTrack) {
    useSpotifyPlayerStore.getState().setCurrentTrack?.(resolvedTrack);
  }

  const relevant = await fetchRelevantTracks(track);
  const relevantUris = relevant.map((t: any) => t.uri).filter(Boolean);
  const requestBody = {
    uris: [uri, ...relevantUris],
    offset: { position: 0 },
    device_id: targetDevice || undefined,
  };
  if (PLAYBACK_DEBUG) {
    console.debug('[PLAYBACK_DEBUG] executeContinuousPlayTrack:', {
      clickedUri: uri,
      requestBody,
    });
  }
  await playMutation.mutateAsync(requestBody);
  const initialItems = resolvedTrack ? [{ track: resolvedTrack, contextUri: undefined }] : [];
  setStoreQueue([
    ...initialItems,
    ...relevant.map((t: any) => ({ track: t, contextUri: undefined })),
  ]);
  setStoreQueueIndex(0);
}

export async function executePlayTracks(
  uris: string[],
  tracksList: any[] | undefined,
  offsetPosition: number | undefined,
  targetDevice: string,
  playMutation: any,
  setStoreQueue: (queue: any[]) => void,
  setStoreQueueIndex: (index: number) => void
): Promise<void> {
  const startIndex =
    typeof offsetPosition === 'number' && offsetPosition >= 0 && offsetPosition < uris.length
      ? offsetPosition
      : 0;

  const requestBody = {
    uris,
    offset: typeof offsetPosition === 'number' ? { position: offsetPosition } : undefined,
    device_id: targetDevice || undefined,
  };
  if (PLAYBACK_DEBUG) {
    console.debug('[PLAYBACK_DEBUG] executePlayTracks:', {
      clickedUri: uris[startIndex],
      requestBody,
    });
  }
  if (playMutation?.mutateAsync) {
    await playMutation.mutateAsync(requestBody);
  } else {
    let url = '/me/player/play';
    if (targetDevice) url += `?device_id=${targetDevice}`;
    const { proxyFetch } = await import('@/lib/spotifyClient');
    await proxyFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  }

  if (tracksList && tracksList.length > 0) {
    setStoreQueue(tracksList.map((t) => toQueueItem(t)));
  } else {
    setStoreQueue(uris.map((u) => ({ track: { uri: u } })));
  }
  setStoreQueueIndex(startIndex);

  const selectedTrack = extractTrack(tracksList?.[startIndex]);
  if (selectedTrack) {
    useSpotifyPlayerStore.getState().setCurrentTrack(selectedTrack);
  }
}

export function resolveQueueTrack(
  trackOrUri: any,
  contextUri?: any
): { uri: string; track: any } | null {
  const unwrapped = extractTrack(trackOrUri);
  const uri = typeof unwrapped === 'string' ? unwrapped : unwrapped?.uri;
  if (!uri) return null;
  let track = typeof unwrapped === 'object' && unwrapped !== null ? unwrapped : null;
  if (!track && typeof contextUri === 'object' && contextUri !== null) {
    track = contextUri;
  }
  if (!track) {
    track = { uri };
  }
  return { uri, track };
}

export async function executeQueueTrackAddition(
  trackOrUri: any,
  contextUri: any,
  targetDevice: string | null | undefined,
  addToStoreQueue: (track: any, context?: string) => void
): Promise<void> {
  const resolved = resolveQueueTrack(trackOrUri, contextUri);
  if (!resolved) return;

  const validContext = isValidContextUri(contextUri) ? contextUri : undefined;

  try {
    const { addTrackToPlayerQueue } = await import('@/lib/spotify/player');
    await addTrackToPlayerQueue(resolved.uri, targetDevice || undefined);
    addToStoreQueue(resolved.track, validContext);
  } catch (err: any) {
    console.warn('Could not add to Spotify queue:', err);
    try {
      const { notifyRecoveryError } = await import('@/lib/spotifyRecovery');
      const msg = err?.message || 'Could not add to Spotify queue';
      notifyRecoveryError(msg);
      setTimeout(() => {
        notifyRecoveryError(null);
      }, 4000);
    } catch {}
  }
}

export function getNextRepeatMode(
  current: 'off' | 'context' | 'track'
): 'off' | 'context' | 'track' {
  return current === 'off' ? 'context' : current === 'context' ? 'track' : 'off';
}

export function computeNextQueueIndex(
  repeatMode: string,
  listLength: number,
  queueIndex: number
): number | null {
  if (repeatMode === 'track' && listLength > 0 && queueIndex >= 0) {
    return queueIndex;
  }
  if (listLength > 0 && queueIndex < listLength - 1) {
    return queueIndex + 1;
  }
  if (listLength > 0 && repeatMode === 'context') {
    return 0;
  }
  return null;
}

export function computePrevQueueIndex(
  repeatMode: string,
  listLength: number,
  queueIndex: number
): number | null {
  if (repeatMode === 'track' && listLength > 0 && queueIndex >= 0) {
    return queueIndex;
  }
  if (listLength > 0 && queueIndex > 0) {
    return queueIndex - 1;
  }
  if (listLength > 0 && repeatMode === 'context') {
    return listLength - 1;
  }
  return null;
}

export async function executeTogglePlay(
  activePlayer: any,
  currentTrack: any,
  userPausedRef: React.RefObject<boolean>,
  playTrack: (uri: string, contextUri?: any, trackObj?: any) => Promise<void>
): Promise<void> {
  if (!activePlayer) {
    if (currentTrack?.uri) {
      userPausedRef.current = false;
      await playTrack(currentTrack.uri, undefined, currentTrack);
    }
    return;
  }

  try {
    const state = await activePlayer.getCurrentState();
    if ((!state || !state.track_window?.current_track) && currentTrack?.uri) {
      userPausedRef.current = false;
      await playTrack(currentTrack.uri, undefined, currentTrack);
    } else {
      userPausedRef.current = !state?.paused;
      await activePlayer.togglePlay();
    }
  } catch (e: any) {
    console.warn(`[${new Date().toISOString()}] [togglePlay State Exception]`, e);
    if (currentTrack?.uri) {
      userPausedRef.current = false;
      await playTrack(currentTrack.uri, undefined, currentTrack);
    } else {
      activePlayer.togglePlay();
    }
  }
}

export function formatTime(ms?: number | null): string {
  if (typeof ms !== 'number' || isNaN(ms)) {
    return '';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
