"use client";

import React, { useEffect, useState } from "react";
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
  const isSessionExpired = sessionError;

  const {
    player, setPlayer,
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
    queue, queueIndex, setQueueIndex, addToQueue, removeFromQueue, clearQueue, reorderQueue, setQueue
  } = useSpotifyPlayerStore();

  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const [dragOverQueueIndex, setDragOverQueueIndex] = useState<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = React.useRef<HTMLDivElement>(null);
  const userPausedRef = React.useRef(false);
  const isAutoplayingRef = React.useRef(false);
  const lastActiveTrackUriRef = React.useRef<string | null>(null);

  // New Feature States
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'recent' | 'mix' | 'playlists' | 'search' | 'album' | 'artist' | 'queue' | 'frequencies' | 'vibes' | 'memories'>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);



  const [playlistSearch, setPlaylistSearch] = useState("");
  const [mixSearch, setMixSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");


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
  const [rightPanelTab, setRightPanelTab] = useState<'queue' | 'recent'>('queue');
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueModalTab, setQueueModalTab] = useState<'queue' | 'recent'>('queue');

  const { data: playlists = [], isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError } = usePlaylists({ enabled: true });
  const { data: likedData, isLoading: isLikedLoading, isError: isLikedError, error: likedError } = useLikedTracks(libraryPage, 50, { enabled: activeTab === 'library' || activeTab === 'home' });
  const { data: devices = [], refetch: fetchDevices } = useDevices();
  const { data: birthdayMixTracks = [], isLoading: isMixLoading, isError: isMixError, error: mixError, refetch: refetchMix } = useBirthdayMix({ enabled: true });
  const { data: recentTracks = [], isLoading: isRecentLoading, isError: isRecentError, error: recentError } = useRecentlyPlayed({ enabled: !currentTrack || activeTab === 'recent' || activeTab === 'home' || rightPanelTab === 'recent' || isQueueModalOpen });
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
  const { play, toggleSave: toggleSaveMutation, toggleShuffle: toggleShuffleMutation, toggleRepeat: toggleRepeatMutation } = useSpotifyMutations();





  const [palette, setPalette] = useState<any>(null);

  useEffect(() => {
    const art = currentTrack?.album?.images?.[0]?.url || (typeof currentTrack?.album?.images?.[0] === 'string' ? currentTrack.album.images[0] : null);
    if (!art) return;
    fetch(`/api/album-palette?url=${encodeURIComponent(art)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          if (document.startViewTransition) {
            document.startViewTransition(() => {
              flushSync(() => {
                setPalette(data);
              });
            });
          } else {
            setPalette(data);
          }
        }
      })
      .catch(console.error);
  }, [currentTrack?.album?.images]);

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

  // Update position every second if playing using player.getCurrentState()
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (player && !isPaused && !isDragging) {
      interval = setInterval(() => {
        player.getCurrentState().then((state: any) => {
          if (!state) return;
          setPosition(state.position);
          setDuration(state.duration);
          if (state.repeat_mode !== undefined) {
            if (state.repeat_mode === 0 || state.repeat_mode === '0' || state.repeat_mode === 'off') {
              setRepeatMode('off');
            } else if (state.repeat_mode === 1 || state.repeat_mode === '1' || state.repeat_mode === 'context') {
              setRepeatMode('context');
            } else if (state.repeat_mode === 2 || state.repeat_mode === '2' || state.repeat_mode === 'track') {
              setRepeatMode('track');
            }
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [player, isPaused, isDragging]);

  // Load SDK and initialize
  useEffect(() => {
    if (!token) return;

    const initializePlayer = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: "Kawaii Web Player",
        getOAuthToken: async (cb: (token: string) => void) => {
          try {
            const res = await fetch('/api/spotify/session', {
              credentials: 'include',
              cache: 'no-store'
            });
            if (!res.ok) {
              console.error('[Spotify SDK] Failed to obtain current token:', res.status);
              return;
            }
            const data = await res.json();
            if (!data.accessToken) {
              console.error('[Spotify SDK] Session returned no access token');
              return;
            }
            cb(data.accessToken);
          } catch (error) {
            console.error('[Spotify SDK] Failed to obtain current token', error);
          }
        },
        volume: 0.5
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        setIsReady(false);
        setDeviceId("");
      });

      spotifyPlayer.addListener('player_state_changed', async (state: any) => {
        if (!state) return;
        const newTrack = state.track_window?.current_track;
        setCurrentTrack(newTrack);
        setIsPaused(state.paused);
        setIsShuffle(state.shuffle);
        if (state.repeat_mode !== undefined) {
          if (state.repeat_mode === 0 || state.repeat_mode === '0' || state.repeat_mode === 'off') {
            setRepeatMode('off');
          } else if (state.repeat_mode === 1 || state.repeat_mode === '1' || state.repeat_mode === 'context') {
            setRepeatMode('context');
          } else if (state.repeat_mode === 2 || state.repeat_mode === '2' || state.repeat_mode === 'track') {
            setRepeatMode('track');
          }
        }
        setPosition(state.position);
        setDuration(state.duration);

        // Sync queue position if track is in store queue
        if (newTrack?.uri) {
          lastActiveTrackUriRef.current = newTrack.uri;
          const currentQueue = useSpotifyPlayerStore.getState().queue;
          const idx = currentQueue.findIndex(item => item.track?.uri === newTrack.uri);
          if (idx !== -1) {
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
              const relevant = await getRelevantTracks(trackForAutoplay, 12);
              if (relevant.length > 0) {
                const targetDevice = selectedDevice || deviceId;
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
      });

      spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => setError(message));
      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => setError(message));
      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
        setIsPremium(false);
        setError("Premium required for web playback.");
      });
      spotifyPlayer.addListener('playback_error', ({ message }: { message: string }) => setError(message));

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

    return () => {
      // Cleanup is tricky if player changes, but we'll leave it simple
    };
  }, [token]);

  const handleAddToQueue = async (trackOrUri: any, contextUri?: string) => {
    const uri = typeof trackOrUri === 'string' ? trackOrUri : trackOrUri?.uri;
    const track = typeof trackOrUri === 'object' ? trackOrUri : { uri, name: 'Queued Track' };
    if (!uri) return;

    addToQueue(track, contextUri);

    try {
      const { addTrackToPlayerQueue } = await import('@/lib/spotify/player');
      const targetDevice = selectedDevice || deviceId;
      await addTrackToPlayerQueue(uri, targetDevice || undefined);
    } catch (err) {
      console.warn('Could not add to Spotify queue:', err);
    }
  };

  const playTrack = async (uri: string, contextUri?: string, trackObj?: any) => {
    if (!token) return;
    sfx?.select?.();
    if (!isPremium) {
      const parts = uri.split(':');
      if (parts.length === 3) window.open(`https://open.spotify.com/${parts[1]}/${parts[2]}`, '_blank');
      return;
    }
    userPausedRef.current = false;
    const targetDevice = selectedDevice || deviceId;

    try {
      if (contextUri) {
        await playContextTrack(contextUri, uri);
        return;
      }

      // Identify track info
      let track = trackObj;
      if (!track && currentTrack?.uri === uri) track = currentTrack;
      if (!track) {
        track = 
          birthdayMixTracks.find((t: any) => t.uri === uri) ||
          likedData?.tracks?.find((t: any) => t.uri === uri) ||
          recentTracks.find((item: any) => item.track?.uri === uri)?.track;
      }

      // Continuous Playback: Fetch relevant tracks so playback keeps going continuously
      let relevant: any[] = [];
      try {
        const { getRelevantTracks } = await import('@/lib/spotify/player');
        relevant = track ? await getRelevantTracks(track, 15) : [];
      } catch (err) {
        console.warn('Could not fetch relevant tracks:', err);
      }

      const relevantUris = relevant.map((t: any) => t.uri).filter(Boolean);
      const allUris = [uri, ...relevantUris];

      await play.mutateAsync({ uris: allUris, device_id: targetDevice || undefined });

      // Populate Zustand queue with active track + upcoming relevant tracks
      const fullQueue = [
        { track: track || { uri, name: 'Playing Track' }, contextUri },
        ...relevant.map((t: any) => ({ track: t, contextUri }))
      ];
      setQueue(fullQueue);
      setQueueIndex(0);
    } catch (e: any) {
      alert(e.message || 'Error playing track');
    }
  };

  const playTracks = async (uris: string[], tracksList?: any[]) => {
    if (!token || uris.length === 0) return;
    sfx?.select?.();
    if (!isPremium) {
      const parts = uris[0].split(':');
      if (parts.length === 3) window.open(`https://open.spotify.com/${parts[1]}/${parts[2]}`, '_blank');
      return;
    }
    userPausedRef.current = false;
    const targetDevice = selectedDevice || deviceId;
    try {
      await play.mutateAsync({ uris, device_id: targetDevice || undefined });

      if (tracksList && tracksList.length > 0) {
        setQueue(tracksList.map(t => ({ track: t })));
        setQueueIndex(0);
      } else {
        setQueue(uris.map(u => ({ track: { uri: u, name: 'Queued Track' } })));
        setQueueIndex(0);
      }
    } catch (e: any) {
      alert(e.message || 'Error playing tracks');
    }
  };

  const toggleSaveTrack = async () => {
    if (!token || !currentTrack) return;
    sfx?.select?.();
    try {
      await toggleSaveMutation.mutateAsync({ trackId: currentTrack.id, isSaved });
    } catch (e: any) { }
  };

  const playPlaylist = async (uri: string, playlistTracks?: any[]) => {
    if (!token) return;
    sfx?.select?.();
    if (!isPremium) {
      const parts = uri.split(':');
      if (parts.length === 3) window.open(`https://open.spotify.com/${parts[1]}/${parts[2]}`, '_blank');
      return;
    }
    userPausedRef.current = false;
    const targetDevice = selectedDevice || deviceId;
    try {
      await play.mutateAsync({ context_uri: uri, device_id: targetDevice || undefined });
      if (playlistTracks && playlistTracks.length > 0) {
        setQueue(playlistTracks.map(t => ({ track: t, contextUri: uri })));
        setQueueIndex(0);
      }
    } catch (e: any) {
      alert(e.message || 'Error playing playlist');
    }
  };

  const playContextTrack = async (contextUri: string, trackUri: string) => {
    if (!token) return;
    sfx?.select?.();
    if (!isPremium) {
      const parts = trackUri.split(':');
      if (parts.length === 3) window.open(`https://open.spotify.com/${parts[1]}/${parts[2]}`, '_blank');
      return;
    }
    userPausedRef.current = false;
    const targetDevice = selectedDevice || deviceId;
    try {
      await play.mutateAsync({ context_uri: contextUri, offset: { uri: trackUri }, device_id: targetDevice || undefined });
    } catch (e: any) {
      alert(e.message || 'Error playing track in context');
    }
  };

  const playQueueItem = async (index: number) => {
    const list = effectiveQueue;
    if (index < 0 || index >= list.length) return;
    const item = list[index];
    setQueueIndex(index);
    if (item.contextUri) {
      await playContextTrack(item.contextUri, item.track.uri);
    } else {
      await playTrack(item.track.uri, undefined, item.track);
    }
  };

  const togglePlay = async () => {
    sfx?.select?.();
    if (!isPremium) {
      if (currentTrack?.uri) {
        const parts = currentTrack.uri.split(':');
        if (parts.length === 3) window.open(`https://open.spotify.com/${parts[1]}/${parts[2]}`, '_blank');
      }
      return;
    }
    if (!player) {
      if (currentTrack?.uri) {
        userPausedRef.current = false;
        await playTrack(currentTrack.uri, undefined, currentTrack);
      }
      return;
    }
    try {
      const state = await player.getCurrentState();
      if ((!state || !state.track_window?.current_track) && currentTrack?.uri) {
        userPausedRef.current = false;
        await playTrack(currentTrack.uri, undefined, currentTrack);
      } else {
        if (!state.paused) {
          userPausedRef.current = true;
        } else {
          userPausedRef.current = false;
        }
        await player.togglePlay();
      }
    } catch {
      if (currentTrack?.uri) {
        userPausedRef.current = false;
        await playTrack(currentTrack.uri, undefined, currentTrack);
      } else {
        player.togglePlay();
      }
    }
  };

  const nextTrack = () => {
    if (!player) return;
    sfx?.select?.();
    const list = effectiveQueue;
    if (repeatMode === 'track' && list.length > 0 && queueIndex >= 0) {
      playQueueItem(queueIndex);
    } else if (list.length > 0 && queueIndex < list.length - 1) {
      playQueueItem(queueIndex + 1);
    } else if (list.length > 0 && repeatMode === 'context') {
      playQueueItem(0);
    } else {
      player.nextTrack();
    }
  };

  const prevTrack = () => {
    if (!player) return;
    sfx?.select?.();
    const list = effectiveQueue;
    if (repeatMode === 'track' && list.length > 0 && queueIndex >= 0) {
      playQueueItem(queueIndex);
    } else if (list.length > 0 && queueIndex > 0) {
      playQueueItem(queueIndex - 1);
    } else if (list.length > 0 && repeatMode === 'context') {
      playQueueItem(list.length - 1);
    } else {
      player.previousTrack();
    }
  };

  const toggleShuffle = async () => {
    const targetDevice = selectedDevice || deviceId;
    if (!token) return;
    sfx?.select?.();
    try {
      await toggleShuffleMutation.mutateAsync({ state: !isShuffle, device_id: targetDevice || undefined });
      setIsShuffle(!isShuffle);
    } catch (e: any) { }
  };

  const toggleRepeat = async () => {
    const targetDevice = selectedDevice || deviceId;
    if (!token) return;
    sfx?.select?.();
    const nextMode: 'off' | 'context' | 'track' = 
      repeatMode === 'off' ? 'context' : repeatMode === 'context' ? 'track' : 'off';

    const prevMode = repeatMode;
    setRepeatMode(nextMode);

    try {
      await toggleRepeatMutation.mutateAsync({ state: nextMode, device_id: targetDevice || undefined });
    } catch (e: any) {
      console.error('Failed to toggle repeat mode:', e);
      setRepeatMode(prevMode);
    }
  };

  const updatePositionFromPointer = (clientX: number) => {
    if (!progressBarRef.current || duration === 0) return;
    const bounds = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    setPosition(percent * duration);
    return percent;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!player || duration === 0) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePositionFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !player || duration === 0) return;
    updatePositionFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !player || duration === 0) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    const percent = updatePositionFromPointer(e.clientX);
    if (percent !== undefined) {
      player.seek(percent * duration);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
  const vibeCards = [
    { title: "gym", subtitle: "get in the zone", icon: "♬", tone: "from-[#FFD1E5] to-[#FF7DB8]" },
    { title: "late night", subtitle: "for the night owls", icon: "☾", tone: "from-[#DCD5FF] to-[#B7A9FF]" },
    { title: "comfort", subtitle: "hugs in audio form", icon: "♡", tone: "from-[#FFE0EB] to-[#FFA6C8]" },
    { title: "crying", subtitle: "it's okay to feel", icon: "☁", tone: "from-[#DDEBFF] to-[#B9CBFF]" },
    { title: "party", subtitle: "turn it up", icon: "✦", tone: "from-[#FFC3D8] to-[#FF7FB2]" },
    { title: "study", subtitle: "focus mode", icon: "▭", tone: "from-[#FFE5C7] to-[#FFC48B]" },
  ];

  return (
      <>
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --base-color: ${palette?.vibrant || '#C2185B'};
            --color-bg: ${palette?.computed?.bg || 'color-mix(in srgb, var(--base-color) 8%, #ffffff)'};
            --color-light: ${palette?.computed?.light || 'color-mix(in srgb, var(--base-color) 15%, #ffffff)'};
            --color-muted: ${palette?.computed?.muted || 'color-mix(in srgb, var(--base-color) 35%, #ffffff)'};
            --color-vibrant: var(--base-color);
            --color-dark: ${palette?.computed?.dark || 'color-mix(in srgb, var(--base-color) 40%, #000000)'};
          }
        `}} />
        <div 
          className="w-full h-[100dvh] flex flex-col bg-[var(--color-bg)]/95 text-[var(--color-dark)] font-sans relative overflow-hidden"
        >

        {isSessionExpired && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-light)]/80 backdrop-blur-sm">
            <div className="bg-white rounded-none border-4 border-[var(--color-vibrant)] shadow-[8px_8px_0px_#FF87BE] p-8 flex flex-col items-center gap-4 max-w-xs text-center">
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FFF0F7]/75 backdrop-blur-sm px-4">
            <div className="bg-white/95 rounded-3xl border-2 border-[var(--color-muted)] shadow-[0_18px_45px_rgba(255,105,180,0.25)] p-8 flex flex-col items-center gap-4 max-w-sm text-center">
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
        <div className="flex h-14 border-b-2 border-[var(--color-muted)] items-center px-4 justify-between shrink-0 bg-[#FFE7F1]/95 backdrop-blur">
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
          <div className="w-64 border-r-2 border-[var(--color-muted)] flex flex-col shrink-0 bg-[#FFFFFF]/90 hidden md:flex">
            <div className="h-28 border-2 border-[var(--color-muted)] bg-[#FFF0F7] flex items-center gap-3 justify-center m-4 rounded-2xl shrink-0">
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
              <div className="px-4 py-2 flex justify-between items-center text-[var(--color-dark)] shrink-0 border-t border-[#FFD9EA]">
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
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} alt={p.name} className="w-8 h-8 rounded object-cover shadow-sm shrink-0 border border-[var(--color-muted)]" />
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
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6 relative bg-[var(--color-light)]">
            {activeTab === 'home' && (
              <div className="flex flex-col gap-6">
                <section className="relative min-h-[260px] overflow-hidden rounded-[24px] border-2 border-[#FFB2D2] bg-[var(--color-light)] shadow-[0_14px_32px_rgba(255,105,180,0.18)]">
                  <img src={heroArt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" fetchPriority="high" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFD9EA]/95 via-[#FFD9EA]/75 to-[#FFD9EA]/25" />
                  <div className="relative z-10 flex min-h-[260px] items-center px-8 py-8">
                    <div className="max-w-lg">
                      <p className="font-pixel text-xs sm:text-sm font-bold tracking-widest text-[var(--color-dark)] uppercase">GOOD EVENING</p>
                      <h2 className="mt-2 font-pixel text-4xl sm:text-5xl font-extrabold leading-tight text-[var(--color-dark)] drop-shadow-[0_2px_0_#FFFFFF]">Let&apos;s listen together ♡</h2>
                      <p className="mt-3 font-pixel text-base sm:text-lg font-medium text-[var(--color-dark)]">What are we listening to today?</p>
                      <button
                        onClick={() => {
                          const tracksToPlay = birthdayMixTracks.length > 0 ? birthdayMixTracks : (likedData?.tracks || []);
                          if (tracksToPlay.length > 0) {
                            playTracks(tracksToPlay.map((t: any) => t.uri), tracksToPlay);
                          } else {
                            setActiveTab('mix');
                          }
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-vibrant)] px-6 py-2.5 font-pixel text-base font-bold text-white shadow-md transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] will-change-transform"
                      >
                        ▶ Play Mix
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
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-5">
                    {homePlaylists.map((playlist: any, idx: number) => (
                      <button
                        key={`${playlist.id || 'playlist'}-${idx}`}
                        onClick={() => { setActiveTab('playlists'); setSelectedPlaylistId(playlist.id); }}
                        className="group overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-white/95 text-left shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-muted)] hover:shadow-[0_12px_24px_rgba(255,105,180,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
                      >
                        {playlist.images?.[0]?.url ? (
                          <img src={playlist.images[0].url} alt={playlist.name} className="aspect-[4/3] w-full object-cover" />
                        ) : (
                          <div className="aspect-[4/3] w-full bg-[var(--color-light)]" />
                        )}
                        <div className="p-3">
                          <div className="truncate font-pixel text-base font-bold text-[var(--color-dark)] group-hover:text-[var(--color-dark)] transition-colors">{playlist.name}</div>
                          <div className="font-pixel text-xs text-[var(--color-dark)] font-medium">{(playlist.items?.total ?? playlist.tracks?.total ?? playlist.total_tracks ?? (Array.isArray(playlist.items) ? playlist.items.length : (Array.isArray(playlist.tracks?.items) ? playlist.tracks.items.length : (Array.isArray(playlist.tracks) ? playlist.tracks.length : 0))))} songs</div>
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
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
                    {vibeCards.map((vibe) => (
                      <button
                        key={vibe.title}
                        onClick={() => setActiveTab('vibes')}
                        className="overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
                      >
                        <div className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${vibe.tone} text-5xl text-white drop-shadow-sm`}>
                          {vibe.icon}
                        </div>
                        <div className="p-3">
                          <div className="font-pixel text-base font-bold text-[var(--color-dark)]">{vibe.title}</div>
                          <div className="font-pixel text-xs text-[var(--color-dark)] font-medium">{vibe.subtitle}</div>
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
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
                    {(recentHomeTracks.length ? recentHomeTracks : likedHomeTracks).map((track: any, idx: number) => (
                      <button
                        key={`${track.id || track.uri || 'track'}-${idx}`}
                        onClick={() => playTrack(track.uri)}
                        className="group overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-white/95 text-left shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
                      >
                        {track.album?.images?.[0]?.url ? (
                          <img src={track.album.images[0].url} alt={track.name} className="aspect-square w-full object-cover" />
                        ) : (
                          <div className="aspect-square w-full bg-[var(--color-light)]" />
                        )}
                        <div className="p-3">
                          <div className="truncate font-pixel text-base font-bold text-[var(--color-dark)] group-hover:text-[var(--color-dark)] transition-colors">{track.name}</div>
                          <div className="truncate font-pixel text-xs text-[var(--color-dark)] font-medium">{track.artists?.map((a: any) => a.name).join(', ')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
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
          <div 
            className="w-[380px] lg:w-[400px] xl:w-[420px] 2xl:w-[440px] border-l-2 border-[var(--color-muted)] flex flex-col shrink-0 bg-[var(--color-light)]"
            
          >
            <div className="flex flex-col p-5 pb-3 relative shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-vibrant)] text-lg">♥</span>
                  <span className="font-pixel text-[var(--color-dark)] text-sm font-bold">Now Playing</span>
                </div>
                {currentTrack && (
                  <button
                    onClick={() => {
                      setQueueModalTab(rightPanelTab);
                      setIsQueueModalOpen(true);
                    }}
                    className="font-pixel text-xs text-[var(--color-dark)] hover:text-white bg-white hover:bg-[var(--color-vibrant)] border border-[var(--color-muted)] px-3 py-1 rounded-full flex items-center gap-1 transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out shadow-xs font-bold active:scale-95 will-change-transform"
                    title="Open Queue & History Tuner"
                  >
                    <span>⤢</span> Expand
                  </button>
                )}
              </div>
              
              {currentTrack ? (
                <div className="flex flex-col">
                  {/* Art, Vinyl & Frequencies */}
                  <div className="relative w-full aspect-square mb-3 flex items-center justify-center overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-[var(--color-light)] shadow-[0_8px_24px_var(--color-muted)]">
                    {/* Audio Visualizer Frequencies */}
                    {!isPaused && (
                      <div className="absolute bottom-0 left-0 w-full h-1/2 flex items-end justify-center gap-1 opacity-40 px-2 z-0">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className="w-full bg-gradient-to-t from-[var(--color-muted)] to-[var(--color-muted)] animate-pulse rounded-t-full" style={{ height: `${20 + ((i * 17) % 80)}%`, animationDuration: `${0.2 + ((i * 13) % 50) / 100}s` }} />
                        ))}
                      </div>
                    )}
                    {/* Record */}
                    <div className="relative w-4/5 h-4/5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group cursor-pointer hover:scale-[1.08] z-10 will-change-transform">
                      <img
                        src={currentTrack.album?.images?.[0]?.url || (typeof currentTrack.album?.images?.[0] === 'string' ? currentTrack.album.images[0] : '') || '/soundscape_ref/finalui.png'}
                        alt="Album Cover"
                        className={`w-full h-full object-cover rounded-full shadow-[0_8px_24px_rgba(255,105,180,0.5)] border-4 border-[#FFFFFF] origin-center ${!isPaused ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-gradient-to-br from-[var(--color-light)] to-[var(--color-muted)] rounded-full border-2 border-[#FFFFFF] shadow-inner" />
                    </div>
                  </div>
                  
                  {/* Track Info */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col overflow-hidden flex-1">
                      <h3 className="font-pixel text-xl font-bold text-[var(--color-dark)] truncate" title={currentTrack.name}>{currentTrack.name}</h3>
                      <p className="font-pixel text-xs text-[var(--color-dark)] font-medium truncate" title={currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}>
                        {currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <button onClick={toggleSaveTrack} className="text-xl transition-transform hover:scale-110 active:scale-95" title={isSaved ? "Remove from Library" : "Save to Library"} aria-label={isSaved ? "Remove from Library" : "Save to Library"}>
                        {isSaved ? <span className="text-[var(--color-vibrant)]">♥</span> : <span className="text-[var(--color-dark)] hover:text-[var(--color-vibrant)]">♡</span>}
                      </button>
                      <button className="text-xl text-[var(--color-dark)] hover:text-[var(--color-dark)] pb-2 font-bold" aria-label="Track options">...</button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full flex flex-col gap-1 mt-1 group/slider">
                    <div
                      ref={progressBarRef}
                      role="slider"
                      aria-label="Playback progress"
                      aria-valuemin={0}
                      aria-valuemax={duration}
                      aria-valuenow={position}
                      tabIndex={0}
                      className="w-full h-3 relative flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-vibrant)]"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                    >
                      <div className="absolute left-0 right-0 h-full overflow-hidden rounded-full pointer-events-none scale-y-[0.666] group-hover/slider:scale-y-100 transition-transform duration-300 ease-out origin-center bg-black/10 dark:bg-white/10">
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-full bg-[var(--color-dark)] rounded-full origin-left will-change-transform" 
                          style={{ 
                            transform: `scaleX(${duration > 0 ? position / duration : 0})`,
                            transition: isDragging ? 'none' : 'transform 0.1s linear'
                          }} 
                        />
                      </div>
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-full pointer-events-none will-change-transform"
                        style={{ 
                          transform: `translateX(${duration > 0 ? (position / duration) * 100 - 100 : -100}%)`,
                          transition: isDragging ? 'none' : 'transform 0.1s linear'
                        }}
                      >
                        <img
                          src="/hampter/hello_kitty_pin.png"
                          alt="Kitty Pin"
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 max-w-none object-contain translate-x-1/2 z-10 drop-shadow-md group-hover/slider:scale-125 transition-transform duration-300"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between w-full mt-1">
                      <span className="font-pixel text-xs text-[var(--color-dark)] font-bold">{formatTime(position)}</span>
                      <span className="font-pixel text-xs text-[var(--color-dark)] font-bold">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-3 px-2">
                    <button
                      onClick={toggleShuffle}
                      className={`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${isShuffle ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'}`}
                      disabled={!isReady && !token}
                      aria-label="Shuffle"
                      title="Shuffle"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                    </button>
                    <button
                      onClick={prevTrack}
                      className="text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
                      disabled={!isReady && !token}
                      aria-label="Previous track"
                      title="Previous"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                    </button>
                    <button
                      onClick={togglePlay}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] disabled:opacity-50 shadow-[0_4px_14px_var(--color-vibrant)] will-change-transform ${!isPremium ? 'bg-[#1DB954] hover:bg-[#1ed760]' : 'bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)]'}`}
                      disabled={!isReady && !token && isPremium}
                      aria-label={!isPremium ? "Open in Spotify" : isPaused ? "Play" : "Pause"}
                      title={!isPremium ? "Open in Spotify" : isPaused ? "Play" : "Pause"}
                    >
                      {!isPremium ? <span className="font-pixel text-[10px] leading-tight text-center px-1 font-bold">OPEN IN<br/>SPOTIFY</span> : isPaused ? <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>}
                    </button>
                    <button
                      onClick={nextTrack}
                      className="text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
                      disabled={!isReady && !token}
                      aria-label="Next track"
                      title="Next"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                    <button
                      onClick={toggleRepeat}
                      className={`relative transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${repeatMode !== 'off' ? 'text-[var(--color-vibrant)] drop-shadow-[0_2px_4px_var(--color-vibrant)]' : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'}`}
                      disabled={!isReady && !token}
                      aria-label="Repeat mode"
                      title={repeatMode === 'off' ? 'Enable Repeat' : repeatMode === 'context' ? 'Repeat: All (Click for Repeat 1)' : 'Repeat: One (Click to turn off)'}
                    >
                      {repeatMode === 'track' ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                        </svg>
                      )}
                      {repeatMode === 'context' && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--color-vibrant)] rounded-full" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col mb-4">
                  <div className="relative w-full aspect-square mb-4 flex items-center justify-center">
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[#1F2937] rounded-full border-[6px] border-[#374151] flex items-center justify-center shadow-lg" style={{ right: '-10%' }}>
                       <div className="w-1/3 h-1/3 bg-[var(--color-light)] rounded-full border-2 border-[#111827] flex items-center justify-center">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                       </div>
                    </div>
                    <div className="w-4/5 h-4/5 bg-[var(--color-light)] rounded-2xl shadow-[0_8px_24px_var(--color-muted)] relative z-10 border-2 border-[var(--color-muted)] flex items-center justify-center">
                      <span className="text-4xl text-[var(--color-vibrant)]">♪</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col flex-1">
                      <h3 className="font-pixel text-xl font-bold text-[var(--color-dark)]">No track loaded</h3>
                      <p className="font-pixel text-xs text-[var(--color-dark)] font-medium">Select a playlist to begin playback</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <button className="text-xl text-[var(--color-dark)]">♡</button>
                      <button className="text-xl text-[var(--color-dark)] pb-2 font-bold">...</button>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-1 mt-2">
                    <div className="w-full h-1.5 bg-[var(--color-light)] rounded-full"></div>
                    <div className="flex justify-between w-full">
                      <span className="font-pixel text-xs text-[var(--color-dark)] font-bold">0:00</span>
                      <span className="font-pixel text-xs text-[var(--color-dark)] font-bold">0:00</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 px-2">
                    <button className="text-[var(--color-dark)]" aria-label="Shuffle disabled"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg></button>
                    <button className="text-[var(--color-dark)]" aria-label="Previous disabled"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
                    <button className="w-12 h-12 bg-[var(--color-light)] rounded-full flex items-center justify-center text-white/80" aria-label="Play disabled"><svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></button>
                    <button className="text-[var(--color-dark)]" aria-label="Next disabled"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                    <button className="text-[var(--color-dark)]" aria-label="Repeat disabled"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg></button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden px-4 pb-4">
              {/* Tab Switcher & Bow */}
              <div className="flex items-center justify-between bg-[var(--color-light)] rounded-full p-1 mb-2.5 shrink-0 border border-[var(--color-muted)]">
                <div className="flex flex-1 gap-1">
                  <button
                    onClick={() => setRightPanelTab('queue')}
                    className={`flex-1 font-pixel text-xs py-1.5 rounded-full flex items-center justify-center gap-1 transition-all font-bold ${
                      rightPanelTab === 'queue'
                        ? 'bg-[var(--color-vibrant)] text-white shadow-xs'
                        : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
                    }`}
                  >
                    <span>♥</span> Queue ({queue.length})
                  </button>
                  <button
                    onClick={() => setRightPanelTab('recent')}
                    className={`flex-1 font-pixel text-xs py-1.5 rounded-full flex items-center justify-center gap-1 transition-all font-bold ${
                      rightPanelTab === 'recent'
                        ? 'bg-[var(--color-vibrant)] text-white shadow-xs'
                        : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
                    }`}
                  >
                    <span>🕒</span> Recent
                  </button>
                </div>
                <span className="text-base px-2 select-none" title="Hello Kitty">🎀</span>
              </div>
              
              {/* Header with Title and Clear / Expand */}
              <div className="flex items-center justify-between mb-1.5 shrink-0 px-1">
                <span className="font-pixel text-xs text-[var(--color-dark)] font-bold tracking-wide">
                  {rightPanelTab === 'queue' ? '+ Up Next' : '🕒 Recently Played'}
                </span>
                <div className="flex items-center gap-2">
                  {rightPanelTab === 'queue' && effectiveQueue.length > 0 && (
                    <button
                      onClick={() => clearQueue()}
                      className="font-pixel text-xs text-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors font-bold"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setQueueModalTab(rightPanelTab);
                      setIsQueueModalOpen(true);
                    }}
                    className="font-pixel text-xs text-[var(--color-dark)] hover:text-white bg-white hover:bg-[var(--color-vibrant)] border border-[var(--color-muted)] px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out shadow-xs font-bold active:scale-95 will-change-transform"
                    title="Open large pop-up screen to tune queue & history"
                  >
                    <span>⤢</span> Expand
                  </button>
                </div>
              </div>

              {/* Tracks List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
                {rightPanelTab === 'queue' ? (
                  effectiveQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center px-2 py-4">
                      <div className="text-xl mb-1">🌸</div>
                      <div className="text-[var(--color-dark)] font-pixel text-xs font-bold">QUEUE IS EMPTY</div>
                      <p className="text-[var(--color-dark)] font-pixel text-xs mt-0.5 font-medium">Play or add tracks to build your list</p>
                      <button
                        onClick={() => {
                          setQueueModalTab('recent');
                          setIsQueueModalOpen(true);
                        }}
                        className="mt-2 font-pixel text-xs text-[var(--color-dark)] bg-white border border-[var(--color-muted)] px-3 py-1 rounded-full hover:bg-[var(--color-light)] transition-all font-bold shadow-xs"
                      >
                        Browse History ➔
                      </button>
                    </div>
                  ) : (
                    effectiveQueue.map((item: any, idx: number) => (
                      <div
                        key={`${item.track?.id || item.track?.uri || 'queue'}-${idx}`}
                        draggable={queue.length > 0}
                        onDragStart={(e) => {
                          if (queue.length === 0) return;
                          setDraggedQueueIndex(idx);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          if (queue.length === 0) return;
                          e.preventDefault();
                          setDragOverQueueIndex(idx);
                        }}
                        onDragEnd={() => {
                          setDraggedQueueIndex(null);
                          setDragOverQueueIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (queue.length > 0 && draggedQueueIndex !== null && draggedQueueIndex !== idx) {
                            reorderQueue(draggedQueueIndex, idx);
                          }
                          setDraggedQueueIndex(null);
                          setDragOverQueueIndex(null);
                        }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--color-light)] transition-colors group cursor-pointer border ${
                          dragOverQueueIndex === idx
                            ? draggedQueueIndex !== null && draggedQueueIndex < idx
                              ? 'border-b-[var(--color-vibrant)] border-b-2'
                              : 'border-t-[var(--color-vibrant)] border-t-2'
                            : 'border-transparent'
                        } ${draggedQueueIndex === idx ? 'opacity-50' : 'opacity-100'}`}
                        onClick={() => playQueueItem(idx)}
                      >
                        <span className={`font-pixel text-xs w-4 text-center shrink-0 font-bold ${idx === queueIndex ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'}`}>
                          {idx + 1}
                        </span>
                        {item.track?.album?.images?.[0]?.url ? (
                          <img src={item.track.album.images[0].url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-2xs border border-[var(--color-muted)]" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] border border-[var(--color-muted)] shrink-0 shadow-2xs flex items-center justify-center text-[var(--color-dark)] text-xs font-bold">♪</div>
                        )}
                        <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                          <span className={`font-pixel text-sm font-bold truncate ${idx === queueIndex ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'}`}>
                            {item.track?.name}
                          </span>
                          <span className="font-pixel text-sm text-[var(--color-dark)] font-medium truncate">
                            {item.track?.artists?.map((a: any) => a.name).join(', ')}
                          </span>
                        </div>
                        <span className="font-pixel text-xs text-[var(--color-dark)] font-bold shrink-0">
                          {formatTime(item.track?.duration_ms || 0)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (queue.length > 0) {
                              removeFromQueue(idx);
                            }
                          }}
                          className={`text-[var(--color-dark)] hover:text-[var(--color-dark)] px-1 py-0.5 rounded shrink-0 font-bold text-xs ${queue.length > 0 ? 'opacity-0 group-hover:opacity-100' : 'hidden'}`}
                          aria-label="Remove from queue"
                          title="Remove from queue"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )
                ) : (
                  /* Recently Played in right sidebar */
                  recentTracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center px-2 py-4">
                      <div className="text-xl mb-1">🕒</div>
                      <div className="text-[var(--color-dark)] font-pixel text-xs font-bold">NO RECENT TRACKS</div>
                      <p className="text-[var(--color-dark)] font-pixel text-xs mt-0.5 font-medium">Play some tunes to see them here</p>
                    </div>
                  ) : (
                    recentTracks.slice(0, 15).map((item: any, idx: number) => {
                      const track = item.track;
                      if (!track) return null;
                      return (
                        <div
                          key={`${track.id}-${idx}`}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--color-light)] transition-colors group cursor-pointer"
                          onClick={() => {
                            if (item.context?.uri) playContextTrack(item.context.uri, track.uri);
                            else playTrack(track.uri, undefined, track);
                          }}
                        >
                          <span className="font-pixel text-xs w-4 text-center shrink-0 text-[var(--color-dark)] font-bold">
                            {idx + 1}
                          </span>
                          {track.album?.images?.[0]?.url ? (
                            <img src={track.album.images[0].url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-2xs border border-[var(--color-muted)]" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] border border-[var(--color-muted)] shrink-0 shadow-2xs flex items-center justify-center text-[var(--color-dark)] text-xs font-bold">♪</div>
                          )}
                          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                            <span className="font-pixel text-sm font-bold text-[var(--color-dark)] truncate">
                              {track.name}
                            </span>
                            <span className="font-pixel text-sm text-[var(--color-dark)] font-medium truncate">
                              {track.artists?.map((a: any) => a.name).join(', ')}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToQueue(track, item.context?.uri);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[var(--color-dark)] bg-white border border-[var(--color-muted)] hover:bg-[var(--color-vibrant)] hover:text-white px-2.5 py-1 rounded-full font-pixel text-xs font-bold transition-all shadow-xs shrink-0"
                            title="Add to queue"
                          >
                            + Queue
                          </button>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          </div>

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
      </>
  );
}
