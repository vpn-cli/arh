import React from 'react';

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
  playContextTrack: (contextUri: string, trackUri: string) => Promise<void>;
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
  select: () => {},
  hover: () => {},
  pop: () => {},
  move: () => {},
  error: () => {},
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

export async function executeContinuousPlayTrack(
  uri: string,
  track: any,
  targetDevice: string,
  playMutation: any,
  setStoreQueue: (queue: any[]) => void,
  setStoreQueueIndex: (index: number) => void
): Promise<void> {
  const relevant = await fetchRelevantTracks(track);
  const relevantUris = relevant.map((t: any) => t.uri).filter(Boolean);
  await playMutation.mutateAsync({
    uris: [uri, ...relevantUris],
    device_id: targetDevice || undefined,
  });
  setStoreQueue([
    { track: track || { uri, name: 'Playing Track' }, contextUri: undefined },
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

  await playMutation.mutateAsync({
    uris,
    offset: typeof offsetPosition === 'number' ? { position: offsetPosition } : undefined,
    device_id: targetDevice || undefined,
  });

  if (tracksList && tracksList.length > 0) {
    setStoreQueue(tracksList.map((t) => ({ track: t })));
  } else {
    setStoreQueue(uris.map((u) => ({ track: { uri: u, name: 'Queued Track' } })));
  }
  setStoreQueueIndex(startIndex);
}

export function resolveQueueTrack(
  trackOrUri: any,
  contextUri?: any
): { uri: string; track: any } | null {
  const uri = typeof trackOrUri === 'string' ? trackOrUri : trackOrUri?.uri;
  if (!uri) return null;
  let track = typeof trackOrUri === 'object' ? trackOrUri : null;
  if (!track && typeof contextUri === 'object' && contextUri !== null) {
    track = contextUri;
  }
  if (!track) {
    track = { uri, name: 'Queued Track' };
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
  addToStoreQueue(resolved.track, validContext);

  try {
    const { addTrackToPlayerQueue } = await import('@/lib/spotify/player');
    await addTrackToPlayerQueue(resolved.uri, targetDevice || undefined);
  } catch (err) {
    console.warn('Could not add to Spotify queue:', err);
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
