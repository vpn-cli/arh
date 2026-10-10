import React, { useCallback, useEffect, useRef } from 'react';
import { useSpotifyPlayer } from '@/providers/SpotifyPlayerProvider';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import {
  useSpotifyMutations,
  useSpotifySession,
  usePlayerQueue,
  useTrackSavedStatus,
} from '@/hooks/useSpotify';
import { recoverPlaybackDevice } from '@/lib/spotifyRecovery';
import {
  UsePlaybackActionsOptions,
  UsePlaybackActionsReturn,
  isValidContextUri,
  openInSpotify,
  sfx,
  resolveTrackForPlayback,
  executeContinuousPlayTrack,
  executePlayTracks,
  executeQueueTrackAddition,
  getNextRepeatMode,
  computeNextQueueIndex,
  computePrevQueueIndex,
  executeTogglePlay,
} from './playbackHelpers';
import {
  togglePlayGlobal,
  nextTrackGlobal,
  prevTrackGlobal,
  playQueueItemGlobal,
} from './globalPlaybackActions';

export function usePlaybackActions({
  selectedDevice,
  setRecoveryError,
  birthdayMixTracks,
  likedTracks,
  recentTracks,
  isSaved: propIsSaved,
  effectiveQueue: propEffectiveQueue,
}: UsePlaybackActionsOptions): UsePlaybackActionsReturn {
  const { data: sessionData } = useSpotifySession();
  const token = sessionData?.accessToken || null;

  const {
    player: providerPlayer,
    deviceIdRef,
    needsRecoveryRef,
  } = useSpotifyPlayer();

  const storePlayer = useSpotifyPlayerStore((s) => s.player);
  const player = providerPlayer || storePlayer;

  const storeCurrentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const { data: queryIsSaved = false } = useTrackSavedStatus(storeCurrentTrack?.id);
  const isSaved = propIsSaved !== undefined ? propIsSaved : queryIsSaved;

  const { data: playerQueueData } = usePlayerQueue({ enabled: !!token });
  const {
    play,
    toggleSave: toggleSaveMutation,
    toggleShuffle: toggleShuffleMutation,
    toggleRepeat: toggleRepeatMutation,
  } = useSpotifyMutations();

  const userPausedRef = useRef(false);

  const optionsRef = useRef({
    selectedDevice,
    setRecoveryError,
    birthdayMixTracks,
    likedTracks,
    recentTracks,
    isSaved,
    effectiveQueue: propEffectiveQueue,
  });

  const providerRef = useRef({ player, deviceIdRef, needsRecoveryRef });
  const playerQueueDataRef = useRef(playerQueueData);
  const tokenRef = useRef(token);

  const mutationsRef = useRef({
    play,
    toggleSave: toggleSaveMutation,
    toggleShuffle: toggleShuffleMutation,
    toggleRepeat: toggleRepeatMutation,
  });

  const playTrackRef = useRef<(uri: string, contextUri?: any, trackObj?: any) => Promise<void>>(() => Promise.resolve());
  const playContextTrackRef = useRef<(contextUri: string, trackUri: string) => Promise<void>>(() => Promise.resolve());
  const playQueueItemRef = useRef<(index: number) => Promise<void>>(() => Promise.resolve());

  const getEffectiveQueue = useCallback((): any[] => {
    const customQueue = optionsRef.current.effectiveQueue;
    if (customQueue && customQueue.length > 0) return customQueue;
    const storeQueue = useSpotifyPlayerStore.getState().queue;
    if (storeQueue && storeQueue.length > 0) return storeQueue;
    const pq = playerQueueDataRef.current?.queue;
    if (pq && pq.length > 0) return pq.map((t: any) => ({ track: t, contextUri: undefined }));
    return [];
  }, []);

  const ensurePlaybackDevice = useCallback(async (fallbackUri?: string): Promise<string | null> => {
    const { player: activePlayer, deviceIdRef: currentDeviceIdRef, needsRecoveryRef: currentNeedsRecoveryRef } = providerRef.current;
    if (activePlayer && typeof activePlayer.activateElement === 'function') {
      activePlayer.activateElement().catch(() => {});
    }

    const { isPremium, deviceId } = useSpotifyPlayerStore.getState();
    if (!isPremium) {
      openInSpotify(fallbackUri);
      return null;
    }

    userPausedRef.current = false;
    let targetDevice = optionsRef.current.selectedDevice || currentDeviceIdRef.current || deviceId;

    if (currentNeedsRecoveryRef.current || (!targetDevice && isPremium)) {
      try {
        const reason = currentNeedsRecoveryRef.current
          ? "ensurePlaybackDevice: needsRecovery"
          : "ensurePlaybackDevice: no device";
        const recoveredId = await recoverPlaybackDevice(reason);
        currentNeedsRecoveryRef.current = false;
        targetDevice = optionsRef.current.selectedDevice || recoveredId;
      } catch (err: any) {
        optionsRef.current.setRecoveryError(err.message || 'Error reconnecting to Spotify device');
        return null;
      }
    }

    return targetDevice || '';
  }, []);

  const playContextTrack = useCallback(async (contextUri: string, trackUri: string) => {
    if (!isValidContextUri(contextUri)) {
      await playTrackRef.current(trackUri);
      return;
    }
    if (!tokenRef.current) return;
    sfx.select();

    const targetDevice = await ensurePlaybackDevice(trackUri);
    if (targetDevice === null) return;

    try {
      await mutationsRef.current.play.mutateAsync({
        context_uri: contextUri,
        offset: { uri: trackUri },
        device_id: targetDevice || undefined,
      });
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] [Play Context Track Error]`, e);
      optionsRef.current.setRecoveryError(e.message || 'Error playing track in context');
    }
  }, [ensurePlaybackDevice]);

  const playTrack = useCallback(async (uri: string, contextUri?: any, trackObj?: any) => {
    if (!tokenRef.current) return;
    sfx.select();

    const targetDevice = await ensurePlaybackDevice(uri);
    if (targetDevice === null) return;

    try {
      if (isValidContextUri(contextUri)) {
        await playContextTrackRef.current(contextUri, uri);
        return;
      }

      const store = useSpotifyPlayerStore.getState();
      const track = resolveTrackForPlayback(uri, contextUri, trackObj, store.currentTrack, {
        birthdayMixTracks: optionsRef.current.birthdayMixTracks,
        likedTracks: optionsRef.current.likedTracks,
        recentTracks: optionsRef.current.recentTracks,
      });

      await executeContinuousPlayTrack(
        uri,
        track,
        targetDevice,
        mutationsRef.current.play,
        store.setQueue,
        store.setQueueIndex
      );
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] [Play Track Error]`, e);
      optionsRef.current.setRecoveryError(e.message || 'Error playing track');
    }
  }, [ensurePlaybackDevice]);

  const playTracks = useCallback(async (
    uris: string[],
    tracksList?: any[],
    offsetPosition?: number
  ) => {
    if (!tokenRef.current || uris.length === 0) return;
    sfx.select();

    const startIndex =
      typeof offsetPosition === 'number' && offsetPosition >= 0 && offsetPosition < uris.length
        ? offsetPosition
        : 0;

    const targetDevice = await ensurePlaybackDevice(uris[startIndex]);
    if (targetDevice === null) return;

    try {
      const store = useSpotifyPlayerStore.getState();
      await executePlayTracks(
        uris,
        tracksList,
        offsetPosition,
        targetDevice,
        mutationsRef.current.play,
        store.setQueue,
        store.setQueueIndex
      );
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] [Play Tracks Error]`, e);
      optionsRef.current.setRecoveryError(e.message || 'Error playing tracks');
    }
  }, [ensurePlaybackDevice]);

  const playPlaylist = useCallback(async (uri: string, playlistTracks?: any[]) => {
    if (!tokenRef.current) return;
    sfx.select();

    const targetDevice = await ensurePlaybackDevice(uri);
    if (targetDevice === null) return;

    try {
      await mutationsRef.current.play.mutateAsync({
        context_uri: uri,
        device_id: targetDevice || undefined,
      });
      if (playlistTracks && playlistTracks.length > 0) {
        const store = useSpotifyPlayerStore.getState();
        store.setQueue(playlistTracks.map((t) => ({ track: t, contextUri: uri })));
        store.setQueueIndex(0);
      }
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] [Play Playlist Error]`, e);
      optionsRef.current.setRecoveryError(e.message || 'Error playing playlist');
    }
  }, [ensurePlaybackDevice]);

  const playQueueItem = useCallback(async (index: number) => {
    await playQueueItemGlobal(index);
  }, []);

  const togglePlay = useCallback(async () => {
    await togglePlayGlobal();
  }, []);

  const nextTrack = useCallback(() => {
    nextTrackGlobal();
  }, []);

  const prevTrack = useCallback(() => {
    prevTrackGlobal();
  }, []);

  const toggleShuffle = useCallback(async () => {
    if (!tokenRef.current) return;
    sfx.select();
    const store = useSpotifyPlayerStore.getState();
    const targetDevice = optionsRef.current.selectedDevice || store.deviceId;
    const nextShuffle = !store.isShuffle;
    try {
      await mutationsRef.current.toggleShuffle.mutateAsync({
        state: nextShuffle,
        device_id: targetDevice || undefined,
      });
      store.setIsShuffle(nextShuffle);
    } catch {}
  }, []);

  const toggleRepeat = useCallback(async () => {
    if (!tokenRef.current) return;
    sfx.select();
    const store = useSpotifyPlayerStore.getState();
    const targetDevice = optionsRef.current.selectedDevice || store.deviceId;
    const prevMode = store.repeatMode;
    const nextMode = getNextRepeatMode(prevMode);

    store.setRepeatMode(nextMode);

    try {
      await mutationsRef.current.toggleRepeat.mutateAsync({
        state: nextMode,
        device_id: targetDevice || undefined,
      });
    } catch (e: any) {
      console.error('Failed to toggle repeat mode:', e);
      store.setRepeatMode(prevMode);
    }
  }, []);

  const toggleSaveTrack = useCallback(async () => {
    const currentTrack = useSpotifyPlayerStore.getState().currentTrack;
    if (!tokenRef.current || !currentTrack) return;
    sfx.select();
    try {
      await mutationsRef.current.toggleSave.mutateAsync({
        trackId: currentTrack.id,
        isSaved: optionsRef.current.isSaved,
      });
    } catch {}
  }, []);

  const handleAddToQueue = useCallback(async (trackOrUri: any, contextUri?: any) => {
    const store = useSpotifyPlayerStore.getState();
    const targetDevice = optionsRef.current.selectedDevice || providerRef.current.deviceIdRef.current || store.deviceId;
    await executeQueueTrackAddition(trackOrUri, contextUri, targetDevice, store.addToQueue);
  }, []);

  useEffect(() => {
    optionsRef.current = {
      selectedDevice,
      setRecoveryError,
      birthdayMixTracks,
      likedTracks,
      recentTracks,
      isSaved,
      effectiveQueue: propEffectiveQueue,
    };
    providerRef.current = { player, deviceIdRef, needsRecoveryRef };
    playerQueueDataRef.current = playerQueueData;
    tokenRef.current = token;
    mutationsRef.current = {
      play,
      toggleSave: toggleSaveMutation,
      toggleShuffle: toggleShuffleMutation,
      toggleRepeat: toggleRepeatMutation,
    };
    playTrackRef.current = playTrack;
    playContextTrackRef.current = playContextTrack;
    playQueueItemRef.current = playQueueItem;
  });

  return {
    playTrack,
    playTracks,
    playPlaylist,
    playContextTrack,
    playQueueItem,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleSaveTrack,
    handleAddToQueue,
    userPausedRef,
  };
}
