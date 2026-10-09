"use client";

import React, { useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { redirectToSpotifyAuth, logoutSpotify } from "@/lib/spotifyAuth";
import { useSpotifySession, usePlaylists, useDevices, useBirthdayMix, useTrackSavedStatus, useSpotifyMutations, useRecentlyPlayed, usePlayerQueue, useAddToSpotifyQueue } from "@/hooks/useSpotify";
import { useQueryClient } from '@tanstack/react-query';
import { useLikedTracks } from "@/hooks/useLikedTracks";
import { TrackList } from "./TrackList";
import { SearchResults } from "./SearchResults";
import { PlaylistDetail } from "./PlaylistDetail";
import { PlaylistCard } from "./PlaylistCard";
import { AlbumDetail } from "./AlbumDetail";
import { ArtistDetail } from "./ArtistDetail";
import { MixSection } from "./MixSection";
import { FrequenciesSection } from "./FrequenciesSection";
import { VibesSection } from "./VibesSection";
import { AddToPlaylistModal, CreatePlaylistModal, RemovePlaylistModal } from "./PlaylistModals";
import { MemoriesSection } from "./MemoriesSection";
import { MemoryEditorModal } from "./MemoryEditorModal";
import { QueueModal } from "./QueueModal";
import { usePlaylistMutations } from "@/hooks/usePlaylistMutations";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { VIBES } from "@/config/vibes";
import { proxyFetch, getFreshToken, onLoginRequired } from "@/lib/spotifyClient";
import { subscribeRecoveryState } from "@/lib/spotifyRecovery";
import { LyricsView, LyricsViewHandle } from "./lyrics/LyricsView";
import { prefetchLyrics } from "./lyrics/useLyrics";
import { useSpotifyPlayer } from "@/providers/SpotifyPlayerProvider";
import { usePlaybackActions } from "./playback/usePlaybackActions";
import { NowPlayingPanel, ProgressBarHandle } from "./now-playing";

const sfx: any = { select: () => { }, hover: () => { }, pop: () => { }, move: () => { }, error: () => { } };

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

export default function SpotifyPlayerUI({ onGoHome }: { onGoHome?: () => void }) {
  const queryClient = useQueryClient();
  const { data: sessionData, isError: sessionError } = useSpotifySession();
  const token = sessionData?.accessToken || null;
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const isSessionExpired = sessionError || showLoginPrompt;

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const {
    player: providerPlayer,
    deviceIdRef,
    needsRecoveryRef,
    notReadyFiredRef,
    latestStateRef,
    subscribe,
  } = useSpotifyPlayer();

  const {
    player: storePlayer, setPlayer,
    deviceId, setDeviceId,
    isReady, setIsReady,
    currentTrack, setCurrentTrack,
    isPaused, setIsPaused,
    isShuffle, setIsShuffle,
    repeatMode, setRepeatMode,
    position, setPosition,
    duration, setDuration,
    error, setError,
    isPremium, setIsPremium,
    queue, queueIndex, setQueueIndex, removeFromQueue, clearQueue, reorderQueue, setQueue
  } = useSpotifyPlayerStore();

  const player = providerPlayer || storePlayer;

  const progressBarRef = React.useRef<ProgressBarHandle>(null);
  const trackStartTimeRef = React.useRef(Date.now());
  const pausedDurationRef = React.useRef(0);
  const pauseTimestampRef = React.useRef<number | null>(null);
  const lastActiveTrackIdRef = React.useRef<string | null>(null);
  const isAutoplayingRef = React.useRef(false);
  const lastActiveTrackUriRef = React.useRef<string | null>(null);

  // New Feature States
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'recent' | 'mix' | 'playlists' | 'search' | 'album' | 'artist' | 'queue' | 'frequencies' | 'vibes' | 'memories'>('home');
  const [resolvedVibes, setResolvedVibes] = useState<Record<string, string | null>>({});
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);



  const [playlistSearch, setPlaylistSearch] = useState("");
  const [mixSearch, setMixSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  const [showLyrics, setShowLyrics] = useState(false);
  const lyricsViewRef = React.useRef<LyricsViewHandle | null>(null);

  const getPositionMs = React.useCallback(() => {
    return Math.max(
      0,
      (pauseTimestampRef.current ?? Date.now()) -
        trackStartTimeRef.current -
        pausedDurationRef.current
    );
  }, []);

  const handleCloseLyrics = React.useCallback(() => {
    setShowLyrics(false);
  }, []);

  const lyricsTrackDisplay = React.useMemo(() => ({
    name: currentTrack?.name,
    artists: currentTrack?.artists ? currentTrack.artists.map((a: any) => a.name).join(', ') : '',
    art: currentTrack?.album?.images?.[0]?.url || (typeof currentTrack?.album?.images?.[0] === 'string' ? currentTrack.album.images[0] : null) || null,
  }), [currentTrack?.id]);


  const playerRef = React.useRef(player);
  playerRef.current = player;
  const durationRef = React.useRef(duration);
  durationRef.current = duration;

  const handleSeek = React.useCallback((targetMs: number) => {
    if (playerRef.current) {
      playerRef.current.seek(targetMs);
    }
    trackStartTimeRef.current = Date.now() - targetMs - pausedDurationRef.current;
    progressBarRef.current?.showPosition(targetMs);
    lyricsViewRef.current?.resync(targetMs);
  }, []);

  const handleDragSeek = React.useCallback((newPos: number) => {
    trackStartTimeRef.current = Date.now() - newPos - pausedDurationRef.current;
  }, []);

  const handleToggleLyrics = React.useCallback(() => {
    setShowLyrics((prev) => !prev);
  }, []);


  const [isGeneratingMix, setIsGeneratingMix] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [removingPlaylist, setRemovingPlaylist] = useState<any>(null);
  const [addingTrackUri, setAddingTrackUri] = useState<string | null>(null);
  const [memoryEditorEntity, setMemoryEditorEntity] = useState<any>(null);
  const [memoryEditorType, setMemoryEditorType] = useState<'track' | 'artist' | 'playlist' | null>(null);
  const [memoryEditorMemoryId, setMemoryEditorMemoryId] = useState<string | null>(null);

  const { removeItems, reorderItems } = usePlaylistMutations();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [libraryPage, setLibraryPage] = useState(0);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueModalTab, setQueueModalTab] = useState<'queue' | 'recent'>('queue');

  const handleExpandQueue = React.useCallback((tab: 'queue' | 'recent') => {
    setQueueModalTab(tab);
    setIsQueueModalOpen(true);
  }, []);

  const { data: playlists = [], isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError } = usePlaylists({ enabled: true });
  const { data: likedData, isLoading: isLikedLoading, isError: isLikedError, error: likedError } = useLikedTracks(libraryPage, 50, { enabled: activeTab === 'library' || activeTab === 'home' });
  const { data: devices = [], refetch: fetchDevices } = useDevices();
  const { data: birthdayMixTracks = [], isLoading: isMixLoading, isError: isMixError, error: mixError, refetch: refetchMix } = useBirthdayMix({ enabled: true });
  const { data: recentTracks = [], isLoading: isRecentLoading, isError: isRecentError, error: recentError } = useRecentlyPlayed({ enabled: !currentTrack || activeTab === 'recent' || activeTab === 'home' || isQueueModalOpen });
  const { data: playerQueueData } = usePlayerQueue({ enabled: !!token });

  const effectiveQueue = React.useMemo(() => {
    if (queue && queue.length > 0) return queue;
    if (playerQueueData?.queue && playerQueueData.queue.length > 0) {
      return playerQueueData.queue.map((t: any) => ({ track: t, contextUri: undefined }));
    }
    return [];
  }, [queue, playerQueueData]);

  // Auto-load last played track from Spotify if player cache is empty
  useEffect(() => {
    if (!currentTrack && recentTracks.length > 0 && recentTracks[0]?.track) {
      const lastPlayed = recentTracks[0].track;
      setCurrentTrack(lastPlayed);
      if (lastPlayed.duration_ms) {
        setDuration(lastPlayed.duration_ms);
      }
    }
  }, [currentTrack, recentTracks, setCurrentTrack, setDuration]);



  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalSearch), 500);
    return () => clearTimeout(t);
  }, [globalSearch]);

  const { data: isSaved = false } = useTrackSavedStatus(currentTrack?.id);
  const { play } = useSpotifyMutations();

  const {
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
  } = usePlaybackActions({
    selectedDevice,
    setRecoveryError,
    birthdayMixTracks,
    likedTracks: likedData?.tracks,
    recentTracks,
    isSaved,
    effectiveQueue,
  });





  const paletteCache = React.useRef<Record<string, any>>({});
  const [layerPalettes, setLayerPalettes] = useState<[any, any]>([null, null]);
  const [activeLayerIndex, setActiveLayerIndex] = useState<0 | 1>(0);
  const activeLayerRef = React.useRef<0 | 1>(0);
  const [palette, setPalette] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const base = palette?.vibrant || '#C2185B';
    const computedBg = palette?.computed?.bg || `color-mix(in srgb, ${base} 8%, #ffffff)`;
    const computedLight = palette?.computed?.light || `color-mix(in srgb, ${base} 15%, #ffffff)`;
    const computedMuted = palette?.computed?.muted || `color-mix(in srgb, ${base} 35%, #ffffff)`;
    const computedDark = palette?.computed?.dark || `color-mix(in srgb, ${base} 40%, #000000)`;

    root.style.setProperty('--base-color', base);
    root.style.setProperty('--color-bg', computedBg);
    root.style.setProperty('--color-light', computedLight);
    root.style.setProperty('--color-muted', computedMuted);
    root.style.setProperty('--color-vibrant', base);
    root.style.setProperty('--color-dark', computedDark);
  }, [palette]);

  useEffect(() => {
    if (!token) return;

    const resolveVibes = async () => {
      const newResolved: Record<string, string | null> = {};
      let updated = false;

      for (const vibe of VIBES) {
        if (vibe.playlistId) {
          newResolved[vibe.id] = vibe.playlistId;
          continue;
        }

        const cacheKey = `resolved_vibe_${vibe.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          newResolved[vibe.id] = cached === 'null' ? null : cached;
          continue;
        }

        try {
          const res = await proxyFetch(`search?q=${encodeURIComponent(vibe.searchQuery)}&type=playlist&limit=10`);
          if (res && res.playlists?.items?.length > 0) {
            let bestPlaylist = null;
            let maxFollowers = -1;

            for (const item of res.playlists.items) {
              if (!item) continue;
              const trackCount = item.items?.total ?? item.tracks?.total ?? 0;
              if (trackCount >= 20 || !bestPlaylist) {
                const followers = item.followers?.total || 0;
                if (followers > maxFollowers || !bestPlaylist) {
                  maxFollowers = followers;
                  bestPlaylist = item;
                }
              }
            }

            if (bestPlaylist) {
              newResolved[vibe.id] = bestPlaylist.id;
              localStorage.setItem(cacheKey, bestPlaylist.id);
            } else {
              newResolved[vibe.id] = null;
              localStorage.setItem(cacheKey, 'null');
            }
          } else {
            newResolved[vibe.id] = null;
            localStorage.setItem(cacheKey, 'null');
          }
        } catch (e) {
          console.error(`Failed to resolve vibe ${vibe.id}`, e);
          newResolved[vibe.id] = null;
        }
        updated = true;
      }

      if (updated || Object.keys(newResolved).length > 0) {
        setResolvedVibes((prev: Record<string, string | null>) => ({ ...prev, ...newResolved }));
      }
    };

    resolveVibes();
  }, [token]);


  useEffect(() => {
    const getArt = (track: any) => track?.album?.images?.[0]?.url || (typeof track?.album?.images?.[0] === 'string' ? track.album.images[0] : null);

    const fetchPalette = async (art: string) => {
      if (paletteCache.current[art]) return paletteCache.current[art];
      try {
        const res = await fetch(`/api/album-palette?url=${encodeURIComponent(art)}`);
        const data = await res.json();
        if (!data.error) {
          paletteCache.current[art] = data;
          return data;
        }
      } catch (e) {
        console.error(e);
      }
      return null;
    };

    const urisToFetch = new Set<string>();
    const currentArt = getArt(currentTrack);
    if (currentArt) urisToFetch.add(currentArt);

    if (effectiveQueue && effectiveQueue.length > 0 && queueIndex < effectiveQueue.length - 1) {
      const nextArt = getArt(effectiveQueue[queueIndex + 1]?.track);
      if (nextArt) urisToFetch.add(nextArt);
    }

    urisToFetch.forEach(art => {
      fetchPalette(art).then(data => {
        if (currentArt === art && data) {
          setPalette((prev: any) => {
            if (prev?.vibrant === data.vibrant) return prev;

            const nextIdx = (1 - activeLayerRef.current) as 0 | 1;
            setLayerPalettes(layers => {
              const newLayers = [...layers] as [any, any];
              newLayers[nextIdx] = data;
              return newLayers;
            });
            activeLayerRef.current = nextIdx;
            setActiveLayerIndex(nextIdx);

            return data;
          });
        }
      });
    });

  }, [currentTrack?.id, effectiveQueue?.length, queueIndex]);

  // Prefetch lyrics for current and next track
  useEffect(() => {
    if (currentTrack?.id) {
      prefetchLyrics(currentTrack.id);
    }
    if (effectiveQueue && effectiveQueue.length > 0 && queueIndex < effectiveQueue.length - 1) {
      const nextTrack = effectiveQueue[queueIndex + 1]?.track;
      if (nextTrack?.id) {
        prefetchLyrics(nextTrack.id);
      }
    }
  }, [currentTrack?.id, effectiveQueue, queueIndex]);

  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  useEffect(() => {
    const pError = playlistsError as any;
    const mError = mixError as any;
    const lError = likedError as any;
    const rError = recentError as any;
    if (pError?.status === 429 && pError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(pError.retryAfter);
    } else if (mError?.status === 429 && mError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(mError.retryAfter);
    } else if (lError?.status === 429 && lError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(lError.retryAfter);
    } else if (rError?.status === 429 && rError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(rError.retryAfter);
    }
  }, [playlistsError, mixError, likedError, recentError, rateLimitTimer]);

  useEffect(() => {
    if (rateLimitTimer === null || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);
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


  // Recovery state subscription and login prompt listener
  useEffect(() => {
    onLoginRequired(() => setShowLoginPrompt(true));
    const unsubscribe = subscribeRecoveryState({
      onReconnectingChange: (reconnecting) => setIsReconnecting(reconnecting),
      onErrorChange: (err) => setRecoveryError(err),
      onDeviceIdChange: (newId) => {
        deviceIdRef.current = newId;
        setDeviceId(newId);
      },
    });
    return () => {
      onLoginRequired(null);
      unsubscribe();
    };
  }, [setDeviceId]);

  const applyPlayerState = React.useCallback(async (state: any) => {
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
      let nextRepeat: 'off' | 'context' | 'track' = 'off';
      if (state.repeat_mode === 0 || state.repeat_mode === '0' || state.repeat_mode === 'off') {
        nextRepeat = 'off';
      } else if (state.repeat_mode === 1 || state.repeat_mode === '1' || state.repeat_mode === 'context') {
        nextRepeat = 'context';
      } else if (state.repeat_mode === 2 || state.repeat_mode === '2' || state.repeat_mode === 'track') {
        nextRepeat = 'track';
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
      const idx = currentQueue.findIndex(item => item.track?.uri === newTrack.uri);
      if (idx !== -1 && storeState.queueIndex !== idx) {
        setQueueIndex(idx);
      }
    }

    // Continuous playback: if playback ended and next_tracks is empty
    const nextTracks = state.track_window?.next_tracks || [];
    const isEnded = state.paused && state.position === 0 && !userPausedRef.current && !!lastActiveTrackUriRef.current;
    if (isEnded && nextTracks.length === 0 && !isAutoplayingRef.current) {
      isAutoplayingRef.current = true;
      try {
        const trackForAutoplay = newTrack || currentTrack;
        if (trackForAutoplay) {
          const { getRelevantTracks } = await import('@/lib/spotify/player');
          const relevant = await getRelevantTracks(trackForAutoplay, 10);
          if (relevant.length > 0) {
            const targetDevice = selectedDevice || deviceIdRef.current || deviceId;
            await play.mutateAsync({
              uris: relevant.map((t: any) => t.uri),
              device_id: targetDevice || undefined
            });
            setQueue(relevant.map((t: any) => ({ track: t })));
            setQueueIndex(0);
          }
        }
      } catch (e) {
        console.error('Autoplay error:', e);
      } finally {
        setTimeout(() => {
          isAutoplayingRef.current = false;
        }, 3000);
      }
    }
  }, [
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
    setQueue
  ]);

  const applyPlayerStateRef = React.useRef(applyPlayerState);
  applyPlayerStateRef.current = applyPlayerState;

  const resyncedPlayerRef = React.useRef<any>(null);

  // Hook subscription and on-mount resync from player.getCurrentState()
  useEffect(() => {
    if (!player) return;

    if (resyncedPlayerRef.current !== player) {
      resyncedPlayerRef.current = player;
      if (latestStateRef?.current) {
        applyPlayerStateRef.current(latestStateRef.current);
      }
      if (typeof player.getCurrentState === 'function') {
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
  }, [player, subscribe]);




  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const heroArt = currentTrack?.album?.images?.[0]?.url || playlists[0]?.images?.[0]?.url || "/soundscape_ref/finalui.png";
  const recentHomeTracks = (() => {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const item of recentTracks) {
      const track = item?.track;
      if (!track) continue;
      const key = track.id || track.uri;
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(track);
      }
      if (result.length >= 6) break;
    }
    return result;
  })();
  const likedHomeTracks = (likedData?.tracks || []).slice(0, 6);
  const homePlaylists = playlists.slice(0, 6);

  const handleVibeClick = async (vibeId: string) => {
    const targetPlaylistId = resolvedVibes[vibeId] || VIBES.find((v) => v.id === vibeId)?.playlistId;
    if (targetPlaylistId) {
      setSelectedPlaylistId(targetPlaylistId);
      setActiveTab('playlists');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --base-color: ${palette?.vibrant || '#C2185B'};
            --color-bg: ${palette?.computed?.bg || 'color-mix(in srgb, var(--base-color) 8%, #ffffff)'};
            --color-light: ${palette?.computed?.light || 'color-mix(in srgb, var(--base-color) 15%, #ffffff)'};
            --color-muted: ${palette?.computed?.muted || 'color-mix(in srgb, var(--base-color) 35%, #ffffff)'};
            --color-vibrant: var(--base-color);
            --color-dark: ${palette?.computed?.dark || 'color-mix(in srgb, var(--base-color) 40%, #000000)'};
          }
          .bg-layer-0 {
            --layer-bg: ${layerPalettes[0]?.computed?.bg || 'color-mix(in srgb, ' + (layerPalettes[0]?.vibrant || '#C2185B') + ' 8%, #ffffff)'};
          }
          .bg-layer-1 {
            --layer-bg: ${layerPalettes[1]?.computed?.bg || 'color-mix(in srgb, ' + (layerPalettes[1]?.vibrant || '#C2185B') + ' 8%, #ffffff)'};
          }
        `}} />
      <div
        className="w-full h-[100dvh] flex flex-col text-[var(--color-dark)] font-sans relative overflow-hidden"
      >
        <div className={`absolute inset-0 z-0 transition-opacity duration-[600ms] ease-in-out bg-layer-0 ${activeLayerIndex === 0 ? 'opacity-95' : 'opacity-0'}`} style={{ backgroundColor: layerPalettes[0]?.computed?.bg || `color-mix(in srgb, ${layerPalettes[0]?.vibrant || '#C2185B'} 8%, #ffffff)` }} />
        <div className={`absolute inset-0 z-0 transition-opacity duration-[600ms] ease-in-out bg-layer-1 ${activeLayerIndex === 1 ? 'opacity-95' : 'opacity-0'}`} style={{ backgroundColor: layerPalettes[1]?.computed?.bg || `color-mix(in srgb, ${layerPalettes[1]?.vibrant || '#C2185B'} 8%, #ffffff)` }} />
        <div className="relative z-10 flex flex-col h-full w-full flex-1 min-h-0">

          {/* Inline Reconnecting Notice / Recovery Error Banner */}
          {(isReconnecting || recoveryError) && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none transition-all duration-300">
              {isReconnecting && (
                <div className="pointer-events-auto bg-[#1DB954] text-white px-4 py-2 rounded-full font-pixel text-xs flex items-center gap-2 shadow-[0_4px_12px_rgba(29,185,84,0.4)] border border-white/20 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Reconnecting to Spotify...</span>
                </div>
              )}
              {recoveryError && !isReconnecting && (
                <div className="pointer-events-auto bg-[#E11D48] text-white px-4 py-2 rounded-full font-pixel text-xs flex items-center gap-2 shadow-[0_4px_12px_rgba(225,29,72,0.4)] border border-white/20">
                  <span>⚠️ {recoveryError}</span>
                  <button
                    onClick={() => setRecoveryError(null)}
                    className="ml-2 hover:opacity-75 font-bold px-1"
                    aria-label="Dismiss error notice"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {isSessionExpired && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-light)]/80 backdrop-blur-sm">
              <div className="bg-white rounded-none border-4 border-[var(--color-vibrant)] shadow-[8px_8px_0px_var(--color-muted)] p-8 flex flex-col items-center gap-4 max-w-xs text-center">
                <div className="text-5xl animate-bounce">🔑</div>
                <h3 className="font-pixel text-lg font-bold text-[var(--color-dark)] leading-snug">SESSION EXPIRED</h3>
                <p className="font-pixel text-xs text-[var(--color-dark)] leading-relaxed">
                  Your music is still playing! But the controls need a fresh login to keep working.
                </p>
                <button
                  onClick={() => redirectToSpotifyAuth()}
                  className="w-full mt-2 bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-white font-pixel text-sm font-bold py-3 px-6 rounded-full shadow-[0_4px_15px_rgba(29,185,84,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  RE-LOGIN TO SPOTIFY
                </button>
              </div>
            </div>
          )}

          {!token && !isSessionExpired && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/75 backdrop-blur-sm px-4">
              <div className="bg-white/95 rounded-3xl border-2 border-[var(--color-muted)] shadow-[0_18px_45px_var(--color-muted)] shadow-opacity-20 p-8 flex flex-col items-center gap-4 max-w-sm text-center">
                <img src="/hampter/hello_kitty_pin.png" alt="" className="w-16 h-16 object-contain" />
                <h3 className="font-pixel text-2xl font-bold text-[var(--color-dark)] leading-snug">KAWAII_PLAYER.EXE</h3>
                <p className="font-pixel text-sm text-[var(--color-dark)] leading-relaxed font-medium">
                  Connect Spotify to load your playlists, queue, and soundscape controls.
                </p>
                <button
                  onClick={() => redirectToSpotifyAuth()}
                  className="w-full mt-2 bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)] text-white font-pixel text-lg font-bold py-3 px-6 rounded-full shadow-[0_8px_22px_var(--color-vibrant)] hover:scale-105 active:scale-95 transition-all"
                >
                  Connect Spotify
                </button>
                {isLocalhost && (
                  <button
                    onClick={() => logoutSpotify()}
                    className="font-pixel text-xs text-[var(--color-dark)] hover:text-[var(--color-dark)] font-medium"
                  >
                    Reset local session
                  </button>
                )}
              </div>
            </div>
          )}

          {/* KawaiiWindowHeader */}
          <div className="flex h-14 border-b-2 border-[var(--color-muted)] items-center px-4 justify-between shrink-0 bg-[var(--color-bg)]/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-muted)]" />
                <div className="w-3 h-3 rounded-full bg-[#FFDAB9]" />
                <div className="w-3 h-3 rounded-full bg-[#86EFAC]" />
              </div>

              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="group px-3 py-1 bg-white/50 hover:bg-[var(--color-light)] border border-[var(--color-muted)] rounded-full flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
                  aria-label="Return to Home World"
                  title="Return to Home World"
                >
                  <span className="text-[var(--color-dark)] text-[10px] font-pixel mt-0.5 group-hover:-translate-x-0.5 transition-transform">◀</span>
                  <span className="font-pixel text-[10px] text-[var(--color-dark)] font-bold tracking-wider uppercase group-hover:text-[var(--color-vibrant)] transition-colors">
                    Home World
                  </span>
                </button>
              )}

              <img src="/hampter/hello_kitty_pin.png" alt="" className="w-7 h-7 object-contain hidden sm:block ml-2" />
              <span className="font-pixel text-base font-bold text-[var(--color-dark)] hidden xl:inline-block">KAWAII_PLAYER.EXE</span>
              <span className="font-pixel text-base text-[var(--color-vibrant)] hidden xl:inline-block">♥</span>
            </div>
            <div className="flex-1 max-w-md mx-4 relative">
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => { setGlobalSearch(e.target.value); setActiveTab('search'); }}
                placeholder="Search songs, artists, playlists..."
                aria-label="Search songs, artists, playlists"
                className="w-full bg-white/95 border-2 border-[var(--color-muted)] rounded-full px-10 py-2 font-pixel text-sm text-[var(--color-dark)] placeholder:text-[var(--color-dark)]/80 focus:outline-none focus:border-[var(--color-vibrant)] focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]/20 transition-colors"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-dark)] font-bold">⌕</span>
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-dark)] hover:text-[var(--color-dark)] font-pixel transition-colors p-1"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 text-[var(--color-dark)] font-bold text-lg shrink-0">
              <div className="hidden lg:flex px-3 py-1 bg-white/50 border border-[var(--color-muted)] rounded-full items-center gap-1.5 mr-2">
                <span className="font-pixel text-[10px] text-[var(--color-dark)] font-bold tracking-wider uppercase">Music World</span>
                <span className="font-pixel text-[10px] text-[var(--color-vibrant)]">♪</span>
              </div>
              <button className="hover:scale-110 hover:text-[var(--color-vibrant)] transition-all p-1 flex items-center justify-center" aria-label="Minimize window"><span className="text-sm">_</span></button>
              <button className="hover:scale-110 hover:text-[var(--color-vibrant)] transition-all p-1 flex items-center justify-center" aria-label="Maximize window"><span className="text-base">□</span></button>
              <button className="hover:scale-110 hover:text-[var(--color-vibrant)] transition-all p-1 flex items-center justify-center" aria-label="Close window"><span className="text-xl leading-none">×</span></button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex flex-1 overflow-hidden min-h-0 relative">

            {/* Left Sidebar */}
            <div className="w-64 border-r-2 border-[var(--color-muted)] flex flex-col shrink-0 bg-white/90 hidden md:flex" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 8%, white)' }}>
              <div className="h-28 border-2 border-[var(--color-muted)] bg-[var(--color-light)] flex items-center gap-3 justify-center m-4 rounded-2xl shrink-0">
                <img src="/hampter/hello_kitty_pin.png" alt="" className="w-16 h-16 object-contain" />
                <div>
                  <div className="font-pixel text-lg font-bold text-[var(--color-dark)]">KAWAII</div>
                  <div className="font-pixel text-xs text-[var(--color-dark)] font-medium">vibes • memories</div>
                </div>
              </div>

              <nav className="flex flex-col gap-1 px-4 py-2 shrink-0" aria-label="Main Navigation">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${activeTab === 'home' ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs' : 'text-[var(--color-dark)] hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] font-medium'}`}
                >
                  <span className="w-5 text-xl">⌂</span>
                  <span className="text-base">Home</span>
                </button>
                <button
                  onClick={() => setActiveTab('playlists')}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${activeTab === 'playlists' ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs' : 'text-[var(--color-dark)] hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] font-medium'}`}
                >
                  <span className="w-5 text-xl">♫</span>
                  <span className="text-base">Playlists</span>
                </button>
                <button
                  onClick={() => setActiveTab('mix')}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${activeTab === 'mix' ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs' : 'text-[var(--color-dark)] hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] font-medium'}`}
                >
                  <span className="w-5 text-xl">✨</span>
                  <span className="text-base">Mix</span>
                </button>
                <button
                  onClick={() => setActiveTab('vibes')}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${activeTab === 'vibes' ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs' : 'text-[var(--color-dark)] hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] font-medium'}`}
                >
                  <span className="w-5 text-xl">✦</span>
                  <span className="text-base">Vibes</span>
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${activeTab === 'library' ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs' : 'text-[var(--color-dark)] hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] font-medium'}`}
                >
                  <span className="w-5 text-xl">▥</span>
                  <span className="text-base">Library</span>
                </button>
                <button
                  onClick={() => setActiveTab('memories')}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${activeTab === 'memories' ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs' : 'text-[var(--color-dark)] hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] font-medium'}`}
                >
                  <span className="w-5 text-xl">▣</span>
                  <span className="text-base">Memories</span>
                </button>
                <button
                  onClick={() => setActiveTab('frequencies')}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] ${activeTab === 'frequencies' ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs' : 'text-[var(--color-dark)] hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] font-medium'}`}
                >
                  <span className="w-5 text-xl">≋</span>
                  <span className="text-base">Frequencies</span>
                </button>
              </nav>

              <div className="flex flex-col flex-1 overflow-hidden mt-2">
                <div className="px-4 py-2 flex justify-between items-center text-[var(--color-dark)] shrink-0 border-t border-[var(--color-light)]">
                  <span className="font-pixel text-sm font-bold uppercase tracking-wider text-[var(--color-dark)]">Your Playlists</span>
                  <button
                    onClick={() => setIsCreatingPlaylist(true)}
                    className="hover:scale-110 font-bold text-base text-[var(--color-dark)] p-1 rounded transition-transform"
                    aria-label="Create new playlist"
                    title="Create new playlist"
                  >
                    +
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                  {playlists.slice(0, 15).map((p: any, idx: number) => (
                    <div
                      key={`${p.id || 'playlist'}-${idx}`}
                      onClick={() => { setActiveTab('playlists'); setSelectedPlaylistId(p.id); }}
                      className="flex items-center gap-3 py-2 cursor-pointer hover:bg-[var(--color-light)] rounded-lg px-2 transition-colors group"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setActiveTab('playlists');
                          setSelectedPlaylistId(p.id);
                        }
                      }}
                    >
                      {p.images && p.images.length >= 4 ? (
                        <div className="w-8 h-8 rounded overflow-hidden grid grid-cols-2 grid-rows-2 shadow-sm shrink-0 border border-[var(--color-muted)] bg-[var(--color-muted)]">
                          {p.images.slice(0, 4).map((img: any, i: number) => (
                            <img key={i} src={img.url || img} alt="" className="w-full h-full object-cover" />
                          ))}
                        </div>
                      ) : p.images?.[0] ? (
                        <img src={(p.images[2] || p.images[0]).url || p.images[0]} loading="lazy" alt={p.name} className="w-8 h-8 rounded object-cover shadow-sm shrink-0 border border-[var(--color-muted)]" />
                      ) : (
                        <div className="w-8 h-8 bg-[var(--color-muted)] border border-[var(--color-muted)] rounded shadow-sm flex items-center justify-center text-[var(--color-dark)] text-xs font-bold shrink-0">♪</div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-[var(--color-dark)] truncate group-hover:text-[var(--color-dark)] transition-colors">{p.name}</span>
                        <span className="text-xs text-[var(--color-dark)] font-medium">{(p.items?.total ?? p.tracks?.total ?? p.total_tracks ?? (Array.isArray(p.items) ? p.items.length : (Array.isArray(p.tracks?.items) ? p.tracks.items.length : (Array.isArray(p.tracks) ? p.tracks.length : 0))))} songs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 mt-auto border-t border-[var(--color-light)]">
                <button
                  onClick={logoutSpotify}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[var(--color-vibrant)] text-[var(--color-vibrant)] font-pixel text-sm font-bold hover:bg-[var(--color-vibrant)] hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6 relative bg-[var(--color-light)]">
              {activeTab === 'home' && (
                <div className="flex flex-col gap-6">
                  <section className="relative min-h-[220px] sm:min-h-[260px] overflow-hidden rounded-[24px] border-2 border-[var(--color-muted)] bg-[var(--color-light)] shadow-sm">
                    <img src={heroArt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" fetchPriority="high" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-light)]/95 via-[var(--color-light)]/85 to-[var(--color-light)]/40" />
                    <div className="relative z-10 flex min-h-[220px] sm:min-h-[260px] items-center px-6 sm:px-8 py-6 sm:py-8">
                      <div className="max-w-lg">
                        <p className="font-pixel text-xs sm:text-sm font-bold tracking-widest text-[var(--color-dark)] uppercase">
                          {currentTrack ? 'CURRENTLY PLAYING' : 'GOOD EVENING'}
                        </p>
                        <h2 className="mt-2 font-pixel text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-[var(--color-dark)] drop-shadow-[0_2px_0_#FFFFFF]">
                          {currentTrack ? currentTrack.name : "Let's listen together ♡"}
                        </h2>
                        <p className="mt-2 sm:mt-3 font-pixel text-sm sm:text-base md:text-lg font-medium text-[var(--color-dark)] opacity-90">
                          {currentTrack ? currentTrack.artists?.map((a: any) => a.name).join(', ') : "What are we listening to today?"}
                        </p>
                        <button
                          onClick={() => {
                            if (currentTrack) {
                              if (isPaused) togglePlay();
                            } else {
                              const tracksToPlay = birthdayMixTracks.length > 0 ? birthdayMixTracks : (likedData?.tracks || []);
                              if (tracksToPlay.length > 0) {
                                playTracks(tracksToPlay.map((t: any) => t.uri), tracksToPlay);
                              } else {
                                setActiveTab('mix');
                              }
                            }
                          }}
                          className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-vibrant)] px-5 sm:px-6 py-2 sm:py-2.5 font-pixel text-sm sm:text-base font-bold text-white shadow-md transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] group"
                        >
                          <span className="group-hover:scale-110 transition-transform">{currentTrack ? (isPaused ? '▶' : '⏸') : '▶'}</span>
                          {currentTrack ? (isPaused ? 'Resume' : 'Playing') : 'Play Mix'}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] flex items-center gap-2">
                        <span className="text-[var(--color-vibrant)]">♥</span> Continue Listening
                      </h3>
                      <button onClick={() => setActiveTab('playlists')} className="font-pixel text-xs sm:text-sm font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:underline">See all →</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                      {homePlaylists.map((playlist: any, idx: number) => (
                        <button
                          key={`${playlist.id || 'playlist'}-${idx}`}
                          onClick={() => { setActiveTab('playlists'); setSelectedPlaylistId(playlist.id); }}
                          className="w-[160px] sm:w-[180px] shrink-0 group overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-[var(--color-bg)]/95 text-left shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-muted)] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
                        >
                          {playlist.images && playlist.images.length >= 4 ? (
                            <div className="relative aspect-[4/3] w-full overflow-hidden grid grid-cols-2 grid-rows-2 bg-[var(--color-light)]">
                              {playlist.images.slice(0, 4).map((img: any, i: number) => (
                                <img key={i} src={img.url || img} alt="" className="w-full h-full object-cover" />
                              ))}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-vibrant)] text-white flex items-center justify-center text-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">▶</div>
                              </div>
                            </div>
                          ) : playlist.images?.[0] ? (
                            <div className="relative aspect-[4/3] w-full">
                              <img src={(playlist.images[1] || playlist.images[0]).url || playlist.images[0]} loading="lazy" alt={playlist.name} className="absolute inset-0 h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-vibrant)] text-white flex items-center justify-center text-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">▶</div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative aspect-[4/3] w-full bg-[var(--color-light)] flex items-center justify-center font-bold text-2xl text-[var(--color-muted)]">
                              ♪
                              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-vibrant)] text-white flex items-center justify-center text-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">▶</div>
                              </div>
                            </div>
                          )}
                          <div className="p-3">
                            <div className="truncate font-pixel text-base font-bold text-[var(--color-dark)] group-hover:text-[var(--color-vibrant)] transition-colors">{playlist.name}</div>
                            <div className="font-pixel text-xs text-[var(--color-dark)] font-medium opacity-80">{(playlist.items?.total ?? playlist.tracks?.total ?? playlist.total_tracks ?? (Array.isArray(playlist.items) ? playlist.items.length : (Array.isArray(playlist.tracks?.items) ? playlist.tracks.items.length : (Array.isArray(playlist.tracks) ? playlist.tracks.length : 0))))} songs</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] flex items-center gap-2">
                        <span className="text-[var(--color-vibrant)]">♥</span> Vibes
                      </h3>
                      <button onClick={() => setActiveTab('vibes')} className="font-pixel text-xs sm:text-sm font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:underline">See all →</button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                      {VIBES.filter(vibe => resolvedVibes[vibe.id] !== null).map((vibe) => (
                        <button
                          key={vibe.id}
                          onClick={() => handleVibeClick(vibe.id)}
                          className="group relative overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-vibrant)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] aspect-square"
                        >
                          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${vibe.tone} text-4xl sm:text-5xl text-white drop-shadow-sm`}>
                            {vibe.emoji}
                          </div>
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
                          <div className="absolute inset-0 p-3 flex flex-col justify-end">
                            <div className="font-pixel text-sm sm:text-base font-bold text-white drop-shadow-md group-hover:text-[var(--color-vibrant)] transition-colors">{vibe.label}</div>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-vibrant)] text-white flex items-center justify-center text-sm shadow-md">▶</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] flex items-center gap-2">
                        <span className="text-[var(--color-vibrant)]">◷</span> Recently Played
                      </h3>
                      <button onClick={() => setActiveTab('recent')} className="font-pixel text-xs sm:text-sm font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:underline">See all →</button>
                    </div>
                    {recentHomeTracks.length === 0 && likedHomeTracks.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[var(--color-muted)] bg-[var(--color-light)]/50">
                        <p className="font-pixel text-sm text-[var(--color-dark)] font-bold opacity-70">Nothing here yet! Start playing some tunes ~</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(recentHomeTracks.length ? recentHomeTracks : likedHomeTracks).map((track: any, idx: number) => (
                          <button
                            key={`${track.id || track.uri || 'track'}-${idx}`}
                            onClick={() => playTrack(track.uri)}
                            className="group flex items-center gap-3 overflow-hidden rounded-xl border-2 border-transparent bg-[var(--color-light)] hover:bg-white text-left transition p-2 hover:-translate-y-0.5 hover:border-[var(--color-muted)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
                          >
                            <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden shadow-sm">
                              {track.album?.images?.[0]?.url ? (
                                <img src={(track.album.images[1] || track.album.images[0]).url} loading="lazy" alt={track.name} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 bg-[var(--color-muted)]" />
                              )}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-lg shadow-sm">▶</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="truncate font-pixel text-sm font-bold text-[var(--color-dark)] group-hover:text-[var(--color-vibrant)] transition-colors">{track.name}</div>
                              <div className="truncate font-pixel text-xs text-[var(--color-dark)] font-medium opacity-80">{track.artists?.map((a: any) => a.name).join(', ')}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
              {activeTab === 'playlists' && (
                selectedPlaylistId ? (
                  <PlaylistDetail
                    playlistId={selectedPlaylistId}
                    onBack={() => setSelectedPlaylistId(null)}
                    onEdit={() => {
                      const p = playlists.find((pl: any) => pl.id === selectedPlaylistId);
                      if (p) setEditingPlaylist(p);
                    }}
                    onRemove={() => {
                      const p = playlists.find((pl: any) => pl.id === selectedPlaylistId);
                      if (p) setRemovingPlaylist(p);
                    }}
                    onPlayPlaylist={(uri, tracks) => playPlaylist(uri, tracks)}
                    onPlayTrack={(uri, contextUri, track) => {
                      if (contextUri) playContextTrack(contextUri, uri);
                      else playTrack(uri, undefined, track);
                    }}
                    onAddToQueue={handleAddToQueue}
                    onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                    onRemoveFromPlaylist={async (uri) => {
                      if (selectedPlaylistId) {
                        await removeItems.mutateAsync({ playlistId: selectedPlaylistId, uri });
                      }
                    }}
                    onAddMemory={(entity, type) => {
                      setMemoryEditorEntity(entity);
                      setMemoryEditorType(type);
                    }}
                    onReorder={async (startIndex, endIndex) => {
                      if (selectedPlaylistId) {
                        const insertBefore = endIndex > startIndex ? endIndex + 1 : endIndex;
                        await reorderItems.mutateAsync({ playlistId: selectedPlaylistId, range_start: startIndex, insert_before: insertBefore });
                      }
                    }}
                    onShufflePlay={async (uri, tracks) => {
                      if (!isShuffle) {
                        await toggleShuffle();
                      }
                      playPlaylist(uri, tracks);
                    }}
                  />
                ) : (
                  <>
                    <div className="flex gap-2 mb-2 shrink-0">
                      <input
                        type="text"
                        value={playlistSearch}
                        onChange={(e) => setPlaylistSearch(e.target.value)}
                        placeholder="Filter playlists..."
                        aria-label="Filter playlists"
                        className="flex-1 bg-white border-2 border-[var(--color-muted)] rounded-xl px-3 py-2 font-pixel text-xs text-[var(--color-dark)] placeholder:text-[var(--color-dark)]/80 focus:outline-none focus:border-[var(--color-vibrant)] focus:ring-2 focus:ring-[var(--color-vibrant)]/20"
                      />
                      <button
                        onClick={() => setIsCreatingPlaylist(true)}
                        className="bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)] text-white px-4 py-2 rounded-xl font-pixel text-xs font-bold hover:scale-105 active:scale-95 transition-transform shadow-xs flex items-center gap-1"
                        title="Create Playlist"
                      >
                        <span>+</span> NEW
                      </button>
                    </div>
                    {(() => {
                      if (isPlaylistsError && (playlistsError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-xs font-bold text-center px-4">RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((playlistsError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                      if (isPlaylistsLoading) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-xs font-medium animate-pulse">LOADING LIBRARY...</div>;
                      if (playlists.length === 0) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-xs font-medium">NO PLAYLISTS FOUND</div>;

                      const filteredPlaylists = playlists.filter((p: any) => p.name.toLowerCase().includes(playlistSearch.toLowerCase()));
                      if (filteredPlaylists.length === 0) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-xs font-medium">NO MATCHES FOUND</div>;

                      return filteredPlaylists.map((p: any, idx: number) => (
                        <PlaylistCard key={`${p.id || 'playlist'}-${idx}`} playlist={p} onClick={() => setSelectedPlaylistId(p.id)} />
                      ));
                    })()}
                  </>
                )
              )}

              {activeTab === 'recent' && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="flex justify-between items-center mb-2 shrink-0">
                    <span className="font-pixel text-xs font-bold uppercase tracking-wider text-[var(--color-dark)]">RECENTLY PLAYED</span>
                  </div>
                  {(() => {
                    if (isRecentError && (recentError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-xs font-bold text-center px-4">RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((recentError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                    return <TrackList tracks={recentTracks.map((item: any) => item.track).filter(Boolean)} isLoading={isRecentLoading} onPlayTrack={playTrack} onAddToQueue={handleAddToQueue} onAddToPlaylist={(uri) => setAddingTrackUri(uri)} onAddMemory={(track) => { setMemoryEditorEntity(track); setMemoryEditorType('track'); }} emptyMessage="NO RECENTLY PLAYED TRACKS" />;
                  })()}
                </div>
              )}

              {activeTab === 'library' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <span className="font-pixel text-xs font-bold uppercase tracking-wider text-[var(--color-dark)]">LIKED SONGS</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setLibraryPage(p => Math.max(0, p - 1))} disabled={libraryPage === 0} className="text-xs font-bold text-[var(--color-dark)] disabled:opacity-40 hover:text-[var(--color-dark)] cursor-pointer p-1" aria-label="Previous page">◀</button>
                      <span className="font-pixel text-xs font-bold text-[var(--color-dark)] px-1">{libraryPage + 1}</span>
                      <button onClick={() => setLibraryPage(p => p + 1)} disabled={!likedData?.next} className="text-xs font-bold text-[var(--color-dark)] disabled:opacity-40 hover:text-[var(--color-dark)] cursor-pointer p-1" aria-label="Next page">▶</button>
                    </div>
                  </div>
                  <button
                    onClick={() => playTracks(likedData?.tracks?.map((t: any) => t.uri) || [], likedData?.tracks || [])}
                    disabled={!likedData?.tracks?.length}
                    className={`w-full mb-3 shrink-0 bg-gradient-to-r from-[var(--color-vibrant)] to-[var(--color-vibrant)] hover:from-[var(--color-vibrant)] hover:to-[#AD1457] text-white py-3 rounded-xl shadow-[0_4px_14px_var(--color-vibrant)] transition-all flex flex-col items-center justify-center gap-1 ${!likedData?.tracks?.length ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-95'}`}
                  >
                    <span className="font-pixel text-sm font-bold tracking-widest">
                      ✦ PLAY LIKED ✦
                    </span>
                  </button>
                  {(() => {
                    if (isLikedError && (likedError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-xs font-bold text-center px-4">RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((likedError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                    return <TrackList tracks={likedData?.tracks || []} isLoading={isLikedLoading} onPlayTrack={playTrack} onAddToQueue={handleAddToQueue} onAddToPlaylist={(uri) => setAddingTrackUri(uri)} onAddMemory={(track) => { setMemoryEditorEntity(track); setMemoryEditorType('track'); }} emptyMessage="NO LIKED SONGS" />;
                  })()}
                </div>
              )}

              {activeTab === 'mix' && (
                <MixSection
                  onPlayTrack={playTrack}
                  onPlayTracks={playTracks}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                  onClickArtist={(id) => {
                    setActiveTab('artist');
                    setSelectedArtistId(id);
                  }}
                  onClickPlaylist={(id) => {
                    setActiveTab('playlists');
                    setSelectedPlaylistId(id);
                  }}
                  onAddMemory={(entity, type) => {
                    setMemoryEditorEntity(entity);
                    setMemoryEditorType(type);
                  }}
                  rateLimitTimer={rateLimitTimer}
                />
              )}

              {activeTab === 'frequencies' && (
                <FrequenciesSection
                  onPlayTrack={playTrack}
                  onPlayTracks={playTracks}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                  onClickArtist={(id) => {
                    setActiveTab('artist');
                    setSelectedArtistId(id);
                  }}
                  onAddMemory={(entity, type) => {
                    setMemoryEditorEntity(entity);
                    setMemoryEditorType(type);
                  }}
                  rateLimitTimer={rateLimitTimer}
                />
              )}

              {activeTab === 'vibes' && (
                <VibesSection
                  onPlayTrack={playTrack}
                  onPlayTracks={playTracks}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                  onClickArtist={(id) => {
                    setActiveTab('artist');
                    setSelectedArtistId(id);
                  }}
                  onAddMemory={(entity, type) => {
                    setMemoryEditorEntity(entity);
                    setMemoryEditorType(type);
                    setMemoryEditorMemoryId(null);
                  }}
                  rateLimitTimer={rateLimitTimer}
                />
              )}

              {activeTab === 'memories' && (
                <MemoriesSection
                  onPlayTrack={playTrack}
                  onPlayPlaylist={playPlaylist}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                  onClickArtist={(id) => {
                    setActiveTab('artist');
                    setSelectedArtistId(id);
                  }}
                  onClickPlaylist={(id) => {
                    setActiveTab('playlists');
                    setSelectedPlaylistId(id);
                  }}
                  onEditMemory={(entity, type, memoryId) => {
                    setMemoryEditorEntity(entity);
                    setMemoryEditorType(type);
                    setMemoryEditorMemoryId(memoryId || null);
                  }}
                />
              )}

              {activeTab === 'search' && (
                <div className="flex flex-col h-full">
                  <SearchResults
                    query={debouncedSearch}
                    onPlayTrack={playTrack}
                    onAddToQueue={handleAddToQueue}
                    onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                    onClickPlaylist={(id) => {
                      setActiveTab('playlists');
                      setSelectedPlaylistId(id);
                    }}
                    onClickAlbum={(id) => {
                      setActiveTab('album');
                      setSelectedAlbumId(id);
                    }}
                    onClickArtist={(id) => {
                      setActiveTab('artist');
                      setSelectedArtistId(id);
                    }}
                    onAddMemory={(entity, type) => {
                      setMemoryEditorEntity(entity);
                      setMemoryEditorType(type);
                    }}
                  />
                </div>
              )}

              {activeTab === 'album' && selectedAlbumId && (
                <AlbumDetail
                  albumId={selectedAlbumId}
                  onBack={() => {
                    setActiveTab('search');
                    setSelectedAlbumId(null);
                  }}
                  onPlayAlbum={playPlaylist}
                  onPlayTrack={(uri: string, contextUri?: string) => {
                    playTrack(uri, contextUri);
                  }}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                  onAddMemory={(entity, type) => {
                    setMemoryEditorEntity(entity);
                    setMemoryEditorType(type);
                  }}
                  onShufflePlay={async (uri) => {
                    if (!isShuffle) {
                      await toggleShuffle();
                    }
                    playPlaylist(uri);
                  }}
                />
              )}

              {activeTab === 'artist' && selectedArtistId && (
                <ArtistDetail
                  artistId={selectedArtistId}
                  onBack={() => {
                    setActiveTab('search');
                    setSelectedArtistId(null);
                  }}
                  onClickAlbum={(id) => {
                    setActiveTab('album');
                    setSelectedAlbumId(id);
                  }}
                  onPlayTrack={(uri: string, contextUri?: string) => {
                    playTrack(uri, contextUri);
                  }}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
                  onAddMemory={(entity, type) => {
                    setMemoryEditorEntity(entity);
                    setMemoryEditorType(type);
                    setMemoryEditorMemoryId(null);
                  }}
                />
              )}
            </div>

            {/* Right Sidebar */}
            <NowPlayingPanel
              progressBarRef={progressBarRef}
              showLyrics={showLyrics}
              onToggleLyrics={handleToggleLyrics}
              isSaved={isSaved}
              toggleSaveTrack={toggleSaveTrack}
              getPositionMs={getPositionMs}
              onSeek={handleSeek}
              onDragSeek={handleDragSeek}
              token={token}
              togglePlay={togglePlay}
              prevTrack={prevTrack}
              nextTrack={nextTrack}
              toggleShuffle={toggleShuffle}
              toggleRepeat={toggleRepeat}
              onExpandQueue={handleExpandQueue}
              playQueueItem={playQueueItem}
              playTrack={playTrack}
              playContextTrack={playContextTrack}
              handleAddToQueue={handleAddToQueue}
            />

            {/* Lyrics View Overlay */}
            {showLyrics && (
              <LyricsView
                ref={lyricsViewRef}
                trackId={currentTrack?.id || null}
                trackDisplay={lyricsTrackDisplay}
                isPaused={isPaused}
                getPositionMs={getPositionMs}
                onSeek={handleSeek}
                onClose={handleCloseLyrics}
              />
            )}

          </div>

          <QueueModal
            isOpen={isQueueModalOpen}
            onClose={() => setIsQueueModalOpen(false)}
            initialTab={queueModalTab}
            onPlayTrack={(uri, contextUri) => {
              if (contextUri) playContextTrack(contextUri, uri);
              else playTrack(uri);
            }}
            onAddToPlaylist={(uri) => setAddingTrackUri(uri)}
          />

          <MemoryEditorModal
            isOpen={!!memoryEditorEntity || !!memoryEditorMemoryId}
            onClose={() => { setMemoryEditorEntity(null); setMemoryEditorType(null); setMemoryEditorMemoryId(null); }}
            entity={memoryEditorEntity}
            entityType={memoryEditorType}
            memoryId={memoryEditorMemoryId}
          />

          {addingTrackUri && (
            <AddToPlaylistModal
              trackUri={addingTrackUri}
              onClose={() => setAddingTrackUri(null)}
            />
          )}
          {isCreatingPlaylist && (
            <CreatePlaylistModal
              onClose={() => setIsCreatingPlaylist(false)}
            />
          )}
          {editingPlaylist && (
            <CreatePlaylistModal
              onClose={() => setEditingPlaylist(null)}
              playlistToEdit={editingPlaylist}
            />
          )}
          {removingPlaylist && (
            <RemovePlaylistModal
              playlist={removingPlaylist}
              onClose={() => setRemovingPlaylist(null)}
              onComplete={() => {
                if (selectedPlaylistId === removingPlaylist.id) {
                  setSelectedPlaylistId(null);
                }
              }}
            />
          )}


        </div>
      </div>
    </>
  );
}
