"use client";

import React, { useEffect, useState } from "react";
import { redirectToSpotifyAuth, logoutSpotify } from "@/lib/spotifyAuth";
import { useSpotifySession, usePlaylists, useDevices, useBirthdayMix, useTrackSavedStatus, useSpotifyMutations, useRecentlyPlayed } from "@/hooks/useSpotify";
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
import { usePlaylistMutations } from "@/hooks/usePlaylistMutations";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

const sfx: any = { select: () => { }, hover: () => { }, pop: () => { }, move: () => { }, error: () => { } };

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

export default function SpotifyPlayerUI() {
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
    queue, queueIndex, setQueueIndex, addToQueue, removeFromQueue, clearQueue, reorderQueue
  } = useSpotifyPlayerStore();

  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const [dragOverQueueIndex, setDragOverQueueIndex] = useState<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = React.useRef<HTMLDivElement>(null);

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

  const { data: playlists = [], isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError } = usePlaylists({ enabled: true });
  const { data: likedData, isLoading: isLikedLoading, isError: isLikedError, error: likedError } = useLikedTracks(libraryPage, 50, { enabled: activeTab === 'library' || activeTab === 'home' });
  const { data: devices = [], refetch: fetchDevices } = useDevices();
  const { data: birthdayMixTracks = [], isLoading: isMixLoading, isError: isMixError, error: mixError } = useBirthdayMix({ enabled: activeTab === 'mix' });
  const { data: recentTracks = [], isLoading: isRecentLoading, isError: isRecentError, error: recentError } = useRecentlyPlayed({ enabled: activeTab === 'recent' || activeTab === 'home' });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalSearch), 500);
    return () => clearTimeout(t);
  }, [globalSearch]);

  const { data: isSaved = false } = useTrackSavedStatus(currentTrack?.id);
  const { play, toggleSave: toggleSaveMutation, toggleShuffle: toggleShuffleMutation, toggleRepeat: toggleRepeatMutation } = useSpotifyMutations();





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

      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
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
      });

      spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => setError(message));
      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => setError(message));
      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => setError(message));
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


  const playTrack = async (uri: string) => {
    console.log('[DEBUG] playTrack called with uri:', uri);
    if (!token) return;
    sfx?.select?.();
    const targetDevice = selectedDevice || deviceId;
    try {
      await play.mutateAsync({ uris: [uri], device_id: targetDevice || undefined });
    } catch (e: any) {
      alert(e.message || 'Error playing track');
    }
  };

  const playTracks = async (uris: string[]) => {
    if (!token) return;
    sfx?.select?.();
    const targetDevice = selectedDevice || deviceId;
    try {
      await play.mutateAsync({ uris, device_id: targetDevice || undefined });
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

  const playPlaylist = async (uri: string) => {
    if (!token) return;
    sfx?.select?.();
    const targetDevice = selectedDevice || deviceId;
    try {
      await play.mutateAsync({ context_uri: uri, device_id: targetDevice || undefined });
    } catch (e: any) {
      alert(e.message || 'Error playing playlist');
    }
  };

  const playContextTrack = async (contextUri: string, trackUri: string) => {
    if (!token) return;
    sfx?.select?.();
    const targetDevice = selectedDevice || deviceId;
    try {
      await play.mutateAsync({ context_uri: contextUri, offset: { uri: trackUri }, device_id: targetDevice || undefined });
    } catch (e: any) {
      alert(e.message || 'Error playing track in context');
    }
  };

  const playQueueItem = async (index: number) => {
    if (index < 0 || index >= queue.length) return;
    const item = queue[index];
    setQueueIndex(index);
    if (item.contextUri) {
      await playContextTrack(item.contextUri, item.track.uri);
    } else {
      await playTrack(item.track.uri);
    }
  };

  const togglePlay = () => {
    if (!player) return;
    sfx?.select?.();
    player.togglePlay();
  };

  const nextTrack = () => {
    if (!player) return;
    sfx?.select?.();
    if (repeatMode === 'track' && queue.length > 0 && queueIndex >= 0) {
      playQueueItem(queueIndex);
    } else if (queue.length > 0 && queueIndex < queue.length - 1) {
      playQueueItem(queueIndex + 1);
    } else if (queue.length > 0 && repeatMode === 'context') {
      playQueueItem(0);
    } else {
      player.nextTrack();
    }
  };

  const prevTrack = () => {
    if (!player) return;
    sfx?.select?.();
    if (repeatMode === 'track' && queue.length > 0 && queueIndex >= 0) {
      playQueueItem(queueIndex);
    } else if (queue.length > 0 && queueIndex > 0) {
      playQueueItem(queueIndex - 1);
    } else if (queue.length > 0 && repeatMode === 'context') {
      playQueueItem(queue.length - 1);
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
  const recentHomeTracks = recentTracks.map((item: any) => item.track).filter(Boolean).slice(0, 6);
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
      <div className="w-full h-[calc(100dvh-5rem)] min-h-[720px] flex flex-col bg-[#FFF7FB]/95 text-[#FF4F9A] rounded-[22px] border-2 border-[#FF74B3] shadow-[0_18px_45px_rgba(255,105,180,0.22)] font-sans relative overflow-hidden">

        {isSessionExpired && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FFE4E1]/80 backdrop-blur-sm">
            <div className="bg-white rounded-none border-4 border-[#FF69B4] shadow-[8px_8px_0px_#FFB6C1] p-8 flex flex-col items-center gap-4 max-w-xs text-center">
              <div className="text-5xl animate-bounce">🔑</div>
              <h3 className="font-pixel text-lg text-[#D81B60] leading-snug">SESSION EXPIRED</h3>
              <p className="font-retro text-[10px] text-[#9B4F96] leading-relaxed">
                Your music is still playing! But the controls need a fresh login to keep working.
              </p>
              <button
                onClick={() => redirectToSpotifyAuth()}
                className="w-full mt-2 bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-white font-pixel text-sm py-3 px-6 rounded-full shadow-[0_4px_15px_rgba(29,185,84,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                RE-LOGIN TO SPOTIFY
              </button>
            </div>
          </div>
        )}

        {!token && !isSessionExpired && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FFF0F7]/75 backdrop-blur-sm px-4">
            <div className="bg-white/95 rounded-3xl border-2 border-[#FF74B3] shadow-[0_18px_45px_rgba(255,105,180,0.25)] p-8 flex flex-col items-center gap-4 max-w-sm text-center">
              <img src="/hampter/hello_kitty_pin.png" alt="" className="w-16 h-16 object-contain" />
              <h3 className="font-pixel text-2xl text-[#D81B60] leading-snug">KAWAII_PLAYER.EXE</h3>
              <p className="font-pixel text-sm text-[#7A2871] leading-relaxed">
                Connect Spotify to load your playlists, queue, and soundscape controls.
              </p>
              <button
                onClick={() => redirectToSpotifyAuth()}
                className="w-full mt-2 bg-[#FF4F9A] text-white font-pixel text-lg py-3 px-6 rounded-full shadow-[0_8px_22px_rgba(255,79,154,0.35)] hover:scale-105 active:scale-95 transition-all"
              >
                Connect Spotify
              </button>
              {isLocalhost && (
                <button
                  onClick={() => logoutSpotify()}
                  className="font-pixel text-xs text-[#9B4F96] hover:text-[#D81B60]"
                >
                  Reset local session
                </button>
              )}
            </div>
          </div>
        )}

        {/* KawaiiWindowHeader */}
        <div className="flex h-14 border-b-2 border-[#FF74B3] items-center px-4 justify-between shrink-0 bg-[#FFE7F1]/90 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFB6C1]" />
            <div className="w-3 h-3 rounded-full bg-[#FFDAB9]" />
            <div className="w-3 h-3 rounded-full bg-[#98FB98]" />
            <img src="/hampter/hello_kitty_pin.png" alt="" className="w-9 h-9 object-contain hidden sm:block" />
            <span className="font-pixel text-lg ml-1 text-[#FF4F9A] hidden md:inline-block">KAWAII_PLAYER.EXE</span>
            <span className="font-pixel text-lg text-[#FF4F9A] hidden md:inline-block">♥</span>
          </div>
          <div className="flex-1 max-w-md mx-4 relative">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setActiveTab('search'); }}
              placeholder="Search songs, artists, playlists..."
              className="w-full bg-white/85 border-2 border-[#FF74B3] rounded-full px-10 py-2 font-pixel text-sm text-[#7A2871] focus:outline-none focus:border-[#D81B60] transition-colors"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF4F9A]">⌕</span>
          </div>
          <div className="flex items-center gap-4 text-[#FF69B4] font-bold text-lg">
            <button className="hover:scale-110">_</button>
            <button className="hover:scale-110">□</button>
            <button className="hover:scale-110">×</button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 overflow-hidden min-h-0 relative">

          {/* Left Sidebar */}
          <div className="w-64 border-r-2 border-[#FF9BC9] flex flex-col shrink-0 bg-[#FFFFFF]/80 hidden md:flex">
            <div className="h-28 border-2 border-[#FFC1DA] bg-[#FFF0F7] flex items-center gap-3 justify-center m-4 rounded-2xl shrink-0">
              <img src="/hampter/hello_kitty_pin.png" alt="" className="w-16 h-16 object-contain" />
              <div>
                <div className="font-pixel text-lg text-[#FF4F9A]">KAWAII</div>
                <div className="font-pixel text-xs text-[#7A2871]">vibes • memories</div>
              </div>
            </div>

            <div className="flex flex-col gap-1 px-4 py-2 shrink-0">
              <button onClick={() => setActiveTab('home')} className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors ${activeTab === 'home' ? 'bg-[#FFD6E6] text-[#FF4F9A] font-bold' : 'text-[#5D1687] hover:bg-[#FFF0F5]'}`}><span className="w-5 text-xl">⌂</span><span className="text-lg">Home</span></button>
              <button onClick={() => setActiveTab('playlists')} className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors ${activeTab === 'playlists' ? 'bg-[#FFD6E6] text-[#FF4F9A] font-bold' : 'text-[#5D1687] hover:bg-[#FFF0F5]'}`}><span className="w-5 text-xl">♫</span><span className="text-lg">Playlists</span></button>
              <button onClick={() => setActiveTab('vibes')} className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors ${activeTab === 'vibes' ? 'bg-[#FFD6E6] text-[#FF4F9A] font-bold' : 'text-[#5D1687] hover:bg-[#FFF0F5]'}`}><span className="w-5 text-xl">✦</span><span className="text-lg">Vibes</span></button>
              <button onClick={() => setActiveTab('search')} className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors ${activeTab === 'search' ? 'bg-[#FFD6E6] text-[#FF4F9A] font-bold' : 'text-[#5D1687] hover:bg-[#FFF0F5]'}`}><span className="w-5 text-xl">⌕</span><span className="text-lg">Search</span></button>
              <button onClick={() => setActiveTab('library')} className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors ${activeTab === 'library' ? 'bg-[#FFD6E6] text-[#FF4F9A] font-bold' : 'text-[#5D1687] hover:bg-[#FFF0F5]'}`}><span className="w-5 text-xl">▥</span><span className="text-lg">Library</span></button>
              <button onClick={() => setActiveTab('memories')} className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors ${activeTab === 'memories' ? 'bg-[#FFD6E6] text-[#FF4F9A] font-bold' : 'text-[#5D1687] hover:bg-[#FFF0F5]'}`}><span className="w-5 text-xl">▣</span><span className="text-lg">Memories</span></button>
              <button onClick={() => setActiveTab('frequencies')} className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl transition-colors ${activeTab === 'frequencies' ? 'bg-[#FFD6E6] text-[#FF4F9A] font-bold' : 'text-[#5D1687] hover:bg-[#FFF0F5]'}`}><span className="w-5 text-xl">≋</span><span className="text-lg">Frequencies</span></button>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden mt-2">
              <div className="px-4 py-2 flex justify-between items-center text-[#FF69B4] shrink-0">
                <span className="font-pixel text-[10px]">Your Playlists</span>
                <button onClick={() => setIsCreatingPlaylist(true)} className="hover:scale-110 font-bold">+</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                {playlists.slice(0, 15).map((p: any) => (
                  <div key={p.id} onClick={() => { setActiveTab('playlists'); setSelectedPlaylistId(p.id); }} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-[#FFE4E1] rounded-lg px-2 transition-colors">
                    {p.images?.[0] ? <img src={p.images[0].url} className="w-8 h-8 rounded object-cover shadow-sm shrink-0" /> : <div className="w-8 h-8 bg-[#FFB6C1] rounded shadow-sm flex items-center justify-center text-white text-xs shrink-0">♪</div>}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-[#7A2871] truncate">{p.name}</span>
                      <span className="text-[10px] text-[#FF69B4]">{p.tracks?.total || 0} songs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6 relative bg-[#FFF0F5]">
            {activeTab === 'home' && (
              <div className="flex flex-col gap-6">
                <section className="relative min-h-[260px] overflow-hidden rounded-[24px] border-2 border-[#FFB2D2] bg-[#FFE1EF] shadow-[0_14px_32px_rgba(255,105,180,0.18)]">
                  <img src={heroArt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFD9EA]/95 via-[#FFD9EA]/70 to-[#FFD9EA]/20" />
                  <div className="relative z-10 flex min-h-[260px] items-center px-8 py-8">
                    <div className="max-w-lg">
                      <p className="font-pixel text-lg text-[#7A2871]/70">GOOD EVENING</p>
                      <h2 className="mt-2 font-pixel text-5xl leading-none text-[#FF4F9A] drop-shadow-[0_3px_0_#FFFFFF]">Let&apos;s listen together ♡</h2>
                      <p className="mt-3 font-pixel text-xl text-[#7A2871]">What are we listening to today?</p>
                      <button
                        onClick={() => {
                          const uris = likedHomeTracks.map((track: any) => track.uri).filter(Boolean);
                          if (uris.length) playTracks(uris);
                          else setActiveTab('playlists');
                        }}
                        className="mt-6 rounded-full border-2 border-[#FF74B3] bg-white/85 px-6 py-2 font-pixel text-lg text-[#FF4F9A] shadow-sm transition hover:scale-105 active:scale-95"
                      >
                        ▶ Play Mix
                      </button>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-pixel text-2xl text-[#FF4F9A]">♥ Continue Listening</h3>
                    <button onClick={() => setActiveTab('playlists')} className="font-pixel text-sm text-[#7A2871] hover:text-[#FF4F9A]">See all →</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-5">
                    {homePlaylists.map((playlist: any) => (
                      <button
                        key={playlist.id}
                        onClick={() => { setActiveTab('playlists'); setSelectedPlaylistId(playlist.id); }}
                        className="group overflow-hidden rounded-2xl border-2 border-[#FFC1DA] bg-white/90 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#FF74B3] hover:shadow-[0_12px_24px_rgba(255,105,180,0.18)]"
                      >
                        {playlist.images?.[0]?.url ? (
                          <img src={playlist.images[0].url} alt={playlist.name} className="aspect-[4/3] w-full object-cover" />
                        ) : (
                          <div className="aspect-[4/3] w-full bg-[#FFE1EF]" />
                        )}
                        <div className="p-3">
                          <div className="truncate font-pixel text-lg text-[#5D1687]">{playlist.name}</div>
                          <div className="font-pixel text-sm text-[#9B4F96]">{playlist.tracks?.total || 0} songs</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-pixel text-2xl text-[#FF4F9A]">♥ Vibes</h3>
                    <button onClick={() => setActiveTab('vibes')} className="font-pixel text-sm text-[#7A2871] hover:text-[#FF4F9A]">See all →</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
                    {vibeCards.map((vibe) => (
                      <button
                        key={vibe.title}
                        onClick={() => setActiveTab('vibes')}
                        className="overflow-hidden rounded-2xl border-2 border-[#FFC1DA] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-[#FF74B3]"
                      >
                        <div className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${vibe.tone} text-5xl text-white drop-shadow-sm`}>
                          {vibe.icon}
                        </div>
                        <div className="p-3">
                          <div className="font-pixel text-lg text-[#FF4F9A]">{vibe.title}</div>
                          <div className="font-pixel text-sm text-[#7A2871]">{vibe.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-pixel text-2xl text-[#FF4F9A]">◷ Recently Played</h3>
                    <button onClick={() => setActiveTab('recent')} className="font-pixel text-sm text-[#7A2871] hover:text-[#FF4F9A]">See all →</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
                    {(recentHomeTracks.length ? recentHomeTracks : likedHomeTracks).map((track: any) => (
                      <button
                        key={track.id || track.uri}
                        onClick={() => playTrack(track.uri)}
                        className="group overflow-hidden rounded-2xl border-2 border-[#FFC1DA] bg-white/90 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#FF74B3]"
                      >
                        {track.album?.images?.[0]?.url ? (
                          <img src={track.album.images[0].url} alt={track.name} className="aspect-square w-full object-cover" />
                        ) : (
                          <div className="aspect-square w-full bg-[#FFE1EF]" />
                        )}
                        <div className="p-3">
                          <div className="truncate font-pixel text-lg text-[#5D1687]">{track.name}</div>
                          <div className="truncate font-pixel text-sm text-[#9B4F96]">{track.artists?.map((a: any) => a.name).join(', ')}</div>
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
                  onPlayPlaylist={playPlaylist}
                  onPlayTrack={(uri, contextUri) => {
                    if (contextUri) playContextTrack(contextUri, uri);
                    else playTrack(uri);
                  }}
                  onAddToQueue={addToQueue}
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
                      // Spotify's API for reorder: 
                      // range_start: index of the first item to move
                      // insert_before: position where the items should be inserted.
                      // To move an item down, insert_before must be greater than the current index, 
                      // and since it inserts BEFORE that index, if you move item 1 to position 2, insert_before = 3.
                      const insertBefore = endIndex > startIndex ? endIndex + 1 : endIndex;
                      await reorderItems.mutateAsync({ playlistId: selectedPlaylistId, range_start: startIndex, insert_before: insertBefore });
                    }
                  }}
                  onShufflePlay={async (uri) => {
                    if (!isShuffle) {
                      await toggleShuffle();
                    }
                    playPlaylist(uri);
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
                      className="flex-1 bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-xl px-2 py-2 font-retro text-[10px] text-[#7A2871] focus:outline-none focus:border-[#FF69B4]"
                    />
                    <button
                      onClick={() => setIsCreatingPlaylist(true)}
                      className="bg-[#FF69B4] text-white px-3 py-2 rounded-xl font-retro text-[10px] font-bold hover:scale-105 active:scale-95 transition-transform"
                      title="Create Playlist"
                    >
                      + NEW
                    </button>
                  </div>
                  {(() => {
                    if (isPlaylistsError && (playlistsError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[#FF4500] font-pixel text-xs text-center px-4">RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((playlistsError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                    if (isPlaylistsLoading) return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs animate-pulse">LOADING LIBRARY...</div>;
                    if (playlists.length === 0) return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs">NO PLAYLISTS FOUND</div>;

                    const filteredPlaylists = playlists.filter((p: any) => p.name.toLowerCase().includes(playlistSearch.toLowerCase()));
                    if (filteredPlaylists.length === 0) return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs">NO MATCHES FOUND</div>;

                    return filteredPlaylists.map((p: any) => (
                      <PlaylistCard key={p.id} playlist={p} onClick={() => setSelectedPlaylistId(p.id)} />
                    ));
                  })()}
                </>
              )
            )}

            {activeTab === 'recent' && (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <span className="font-pixel text-[10px] text-[#D81B60]">RECENTLY PLAYED</span>
                </div>
                {(() => {
                  if (isRecentError && (recentError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[#FF4500] font-pixel text-xs text-center px-4">RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((recentError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                  return <TrackList tracks={recentTracks.map((item: any) => item.track)} isLoading={isRecentLoading} onPlayTrack={playTrack} onAddToQueue={addToQueue} onAddToPlaylist={(uri) => setAddingTrackUri(uri)} onAddMemory={(track) => { setMemoryEditorEntity(track); setMemoryEditorType('track'); }} emptyMessage="NO RECENTLY PLAYED TRACKS" />;
                })()}
              </div>
            )}

            {activeTab === 'library' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <span className="font-pixel text-[10px] text-[#D81B60]">LIKED SONGS</span>
                  <div className="flex gap-2">
                    <button onClick={() => setLibraryPage(p => Math.max(0, p - 1))} disabled={libraryPage === 0} className="text-[10px] text-[#7A2871] disabled:opacity-50 hover:text-[#D81B60] cursor-pointer">ΓùÇ</button>
                    <span className="text-[10px] text-[#7A2871]">{libraryPage + 1}</span>
                    <button onClick={() => setLibraryPage(p => p + 1)} disabled={!likedData?.next} className="text-[10px] text-[#7A2871] disabled:opacity-50 hover:text-[#D81B60] cursor-pointer">Γû╢</button>
                  </div>
                </div>
                <button
                  onClick={() => playTracks(likedData?.tracks?.map((t: any) => t.uri) || [])}
                  disabled={!likedData?.tracks?.length}
                  className={`w-full mb-3 shrink-0 bg-gradient-to-r from-[#FF99B9] to-[#FF69B4] text-white py-3 rounded-xl shadow-[0_4px_12px_rgba(255,105,180,0.4)] transition-all flex flex-col items-center justify-center gap-1 ${!likedData?.tracks?.length ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                >
                  <span className="font-pixel text-sm font-bold tracking-widest">
                    Γ£¿ PLAY LIKED Γ£¿
                  </span>
                </button>
                {(() => {
                  if (isLikedError && (likedError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[#FF4500] font-pixel text-xs text-center px-4">RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((likedError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                  return <TrackList tracks={likedData?.tracks || []} isLoading={isLikedLoading} onPlayTrack={playTrack} onAddToQueue={addToQueue} onAddToPlaylist={(uri) => setAddingTrackUri(uri)} onAddMemory={(track) => { setMemoryEditorEntity(track); setMemoryEditorType('track'); }} emptyMessage="NO LIKED SONGS" />;
                })()}
              </div>
            )}

            {activeTab === 'mix' && (
              <MixSection
                onPlayTrack={playTrack}
                onPlayTracks={playTracks}
                onAddToQueue={addToQueue}
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
                onAddToQueue={addToQueue}
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
                onAddToQueue={addToQueue}
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
                onAddToQueue={addToQueue}
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
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search Spotify..."
                  className="w-full bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-xl px-2 py-2 mb-3 font-retro text-[10px] text-[#7A2871] focus:outline-none focus:border-[#FF69B4] shrink-0"
                />
                <SearchResults
                  query={debouncedSearch}
                  onPlayTrack={playTrack}
                  onAddToQueue={addToQueue}
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
                onPlayTrack={(uri, contextUri) => {
                  if (contextUri) playContextTrack(contextUri, uri);
                  else playTrack(uri);
                }}
                onAddToQueue={addToQueue}
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
                onPlayTrack={(uri, contextUri) => {
                  if (contextUri) playContextTrack(contextUri, uri);
                  else playTrack(uri);
                }}
                onAddToQueue={addToQueue}
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
          <div className="w-[320px] border-l-2 border-[#FF9BC9] flex flex-col shrink-0 bg-[#FFF0F5] hidden xl:flex">
            <div className="flex flex-col p-5 relative shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#FF4F9A] text-lg">♥</span>
                <span className="font-pixel text-[#FF4F9A] text-sm">Now Playing</span>
              </div>
              
              {currentTrack ? (
                <div className="flex flex-col">
                  {/* Art, Vinyl & Frequencies */}
                  <div className="relative w-full aspect-square mb-4 flex items-center justify-center overflow-hidden rounded-2xl border-2 border-[#FFC1DA] bg-[#FFE1EF] shadow-[0_8px_24px_rgba(255,105,180,0.3)]">
                    {/* Audio Visualizer Frequencies */}
                    {!isPaused && (
                      <div className="absolute bottom-0 left-0 w-full h-1/2 flex items-end justify-center gap-1 opacity-40 px-2 z-0">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className="w-full bg-gradient-to-t from-[#FF69B4] to-[#FFB6C1] animate-pulse rounded-t-full" style={{ height: `${20 + ((i * 17) % 80)}%`, animationDuration: `${0.2 + ((i * 13) % 50) / 100}s` }} />
                        ))}
                      </div>
                    )}
                    {/* Record */}
                    <div className="relative w-4/5 h-4/5 transition-transform duration-500 group cursor-pointer hover:scale-105 z-10">
                      <img
                        src={currentTrack.album.images[0].url}
                        alt="Album Cover"
                        className={`w-full h-full object-cover rounded-full shadow-[0_8px_24px_rgba(255,105,180,0.5)] border-4 border-[#FFFFFF] origin-center ${!isPaused ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-gradient-to-br from-[#FFE4E1] to-[#FFB6C1] rounded-full border-2 border-[#FFFFFF] shadow-inner" />
                    </div>
                  </div>
                  
                  {/* Track Info */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col overflow-hidden flex-1">
                      <h3 className="font-pixel text-xl text-[#5D1687] truncate" title={currentTrack.name}>{currentTrack.name}</h3>
                      <p className="font-pixel text-xs text-[#9B4F96] truncate" title={currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}>
                        {currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <button onClick={toggleSaveTrack} className="text-xl transition-transform hover:scale-110 active:scale-95" title={isSaved ? "Remove from Library" : "Save to Library"}>
                        {isSaved ? <span className="text-[#FF4F9A]">♥</span> : <span className="text-[#FF9BC9] hover:text-[#FF4F9A]">♡</span>}
                      </button>
                      <button className="text-xl text-[#FF9BC9] hover:text-[#FF4F9A] pb-2">...</button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full flex flex-col gap-1 mt-2 group/slider">
                    <div ref={progressBarRef} className="w-full h-2 group-hover/slider:h-3 transition-all duration-300 bg-[#FFE1EF] rounded-full relative flex items-center cursor-pointer" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
                      <div className="h-full bg-[#FF4F9A] relative rounded-full pointer-events-none" style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}>
                        <img
                          src="/hampter/hello_kitty_pin.png"
                          alt="Kitty Pin"
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 max-w-none object-contain translate-x-1/2 transition-all duration-300 z-10 drop-shadow-md group-hover/slider:scale-125"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between w-full mt-1">
                      <span className="font-pixel text-[10px] text-[#9B4F96]">{formatTime(position)}</span>
                      <span className="font-pixel text-[10px] text-[#9B4F96]">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-4 px-2">
                    <button onClick={toggleShuffle} className={`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${isShuffle ? 'text-[#FF4F9A]' : 'text-[#FF9BC9] hover:text-[#FF4F9A]'}`} disabled={!isReady}>
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                    </button>
                    <button onClick={prevTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                    </button>
                    <button onClick={togglePlay} className="w-12 h-12 bg-[#FF4F9A] rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(255,79,154,0.4)]" disabled={!isReady}>
                      {isPaused ? <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>}
                    </button>
                    <button onClick={nextTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                    <button
                      onClick={toggleRepeat}
                      className={`relative transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${repeatMode !== 'off' ? 'text-[#FF4F9A] drop-shadow-[0_2px_4px_rgba(255,79,154,0.4)]' : 'text-[#FF9BC9] hover:text-[#FF4F9A]'}`}
                      disabled={!isReady}
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
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF4F9A] rounded-full" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col mb-4">
                  <div className="relative w-full aspect-square mb-4 flex items-center justify-center">
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-black rounded-full border-[6px] border-gray-800 flex items-center justify-center shadow-lg" style={{ right: '-10%' }}>
                       <div className="w-1/3 h-1/3 bg-[#FFB6C1] rounded-full border-2 border-black flex items-center justify-center">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                       </div>
                    </div>
                    <div className="w-4/5 h-4/5 bg-[#FFE1EF] rounded-2xl shadow-[0_8px_24px_rgba(255,105,180,0.3)] relative z-10 border-2 border-[#FFC1DA] flex items-center justify-center">
                      <span className="text-4xl text-[#FF9BC9]">♪</span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col flex-1">
                      <h3 className="font-pixel text-xl text-[#5D1687]">No track loaded</h3>
                      <p className="font-pixel text-xs text-[#9B4F96]">Select a playlist to begin playback</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <button className="text-xl text-[#FF9BC9]">♡</button>
                      <button className="text-xl text-[#FF9BC9] pb-2">...</button>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-1 mt-2">
                    <div className="w-full h-1.5 bg-[#FFE1EF] rounded-full"></div>
                    <div className="flex justify-between w-full">
                      <span className="font-pixel text-[10px] text-[#9B4F96]">0:00</span>
                      <span className="font-pixel text-[10px] text-[#9B4F96]">0:00</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 px-2">
                    <button className="text-[#FF9BC9]"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg></button>
                    <button className="text-[#FF9BC9]"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
                    <button className="w-12 h-12 bg-[#FF9BC9] rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></button>
                    <button className="text-[#FF9BC9]"><svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                    <button className="text-[#FF9BC9]"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg></button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden px-5 pb-5">
              <div className="flex bg-[#FFE1EF] rounded-full p-1 mb-4 shrink-0">
                <button className="flex-1 bg-[#FF4F9A] text-white font-pixel text-sm py-1.5 rounded-full flex items-center justify-center gap-1">
                  <span>♥</span> Queue
                </button>
                <button className="flex-1 text-[#9B4F96] font-pixel text-sm py-1.5 rounded-full flex items-center justify-center hover:text-[#5D1687]">
                  Recently Played
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-3 shrink-0">
                <span className="font-pixel text-sm text-[#5D1687]">+ Up Next</span>
                <button onClick={() => clearQueue()} className="font-pixel text-xs text-[#9B4F96] hover:text-[#FF4F9A]">Clear</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 opacity-70">
                    <div className="text-[#FF9BC9] font-pixel text-xs text-center">QUEUE IS EMPTY</div>
                  </div>
                ) : (
                  queue.map((item, idx) => (
                    <div
                      key={`${item.track.id}-${idx}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedQueueIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverQueueIndex(idx);
                      }}
                      onDragEnd={() => {
                        setDraggedQueueIndex(null);
                        setDragOverQueueIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedQueueIndex !== null && draggedQueueIndex !== idx) {
                          reorderQueue(draggedQueueIndex, idx);
                        }
                        setDraggedQueueIndex(null);
                        setDragOverQueueIndex(null);
                      }}
                      className={`flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFE1EF] transition-colors group cursor-pointer ${dragOverQueueIndex === idx ? (draggedQueueIndex !== null && draggedQueueIndex < idx ? 'border-b-[#D81B60] border-b-2' : 'border-t-[#D81B60] border-t-2') : ''} ${draggedQueueIndex === idx ? 'opacity-50' : 'opacity-100'}`}
                      onClick={() => playQueueItem(idx)}
                    >
                      <span className={`font-pixel text-xs w-3 text-right shrink-0 ${idx === queueIndex ? 'text-[#FF4F9A]' : 'text-[#9B4F96]'}`}>{idx + 1}</span>
                      {item.track.album?.images?.[0]?.url ? (
                        <img src={item.track.album.images[0].url} className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#FFC1DA] shrink-0 shadow-sm" />
                      )}
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className={`font-pixel text-xs truncate ${idx === queueIndex ? 'text-[#FF4F9A]' : 'text-[#5D1687]'}`}>{item.track.name}</span>
                        <span className="font-pixel text-[10px] text-[#9B4F96] truncate">{item.track.artists?.map((a: any) => a.name).join(', ')}</span>
                      </div>
                      <span className="font-pixel text-[10px] text-[#9B4F96] shrink-0">{formatTime(item.track.duration_ms)}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeFromQueue(idx); }} className="opacity-0 group-hover:opacity-100 text-[#FF9BC9] hover:text-[#FF4F9A] p-1 shrink-0 font-bold">
                        ...
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Persistent Player Footer */}
        <div className="h-20 border-t-[3px] border-[#FF9BC9] flex items-center px-6 shrink-0 bg-[#FFF0F5] justify-between relative overflow-hidden">
          <div className="flex items-center w-72 shrink-0 z-10">
            {currentTrack ? (
              <div className="flex items-center gap-3 w-full">
                <img src={currentTrack.album.images[0].url} className="w-12 h-12 rounded-lg object-cover shadow-sm border border-[#FFC1DA]" />
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="font-pixel text-sm text-[#5D1687] truncate">{currentTrack.name}</span>
                  <span className="font-pixel text-xs text-[#9B4F96] truncate">{currentTrack.artists?.[0]?.name}</span>
                </div>
                <button onClick={toggleSaveTrack} className="text-xl transition-transform hover:scale-110 active:scale-95 px-2">
                  {isSaved ? <span className="text-[#FF4F9A]">♥</span> : <span className="text-[#FF9BC9] hover:text-[#FF4F9A]">♡</span>}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full opacity-60">
                <div className="w-12 h-12 rounded-lg bg-[#FFC1DA]" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-pixel text-sm text-[#5D1687] truncate">No track loaded</span>
                  <span className="font-pixel text-xs text-[#9B4F96] truncate">Select a playlist</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex justify-center z-10">
            <div className="flex items-center gap-6">
              <button onClick={toggleShuffle} className={`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${isShuffle ? 'text-[#FF4F9A]' : 'text-[#FF9BC9] hover:text-[#FF4F9A]'}`} disabled={!isReady}>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
              </button>
              <button onClick={prevTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </button>
              <button onClick={togglePlay} className="w-12 h-12 bg-[#FF4F9A] rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-md" disabled={!isReady}>
                {isPaused ? <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>}
              </button>
              <button onClick={nextTrack} className="text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" disabled={!isReady}>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>
              <button
                onClick={toggleRepeat}
                className={`relative transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${repeatMode !== 'off' ? 'text-[#FF4F9A] drop-shadow-[0_2px_4px_rgba(255,79,154,0.4)]' : 'text-[#FF9BC9] hover:text-[#FF4F9A]'}`}
                disabled={!isReady}
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
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF4F9A] rounded-full" />
                )}
              </button>
            </div>
          </div>
          
          <div className="w-72 shrink-0 flex items-center justify-end gap-4 text-[#FF9BC9] z-10">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <div className="w-24 h-2 bg-[#FFE1EF] rounded-full relative cursor-pointer group/vol">
              <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-[#FF4F9A] rounded-full">
                <img
                  src="/hampter/hello_kitty_pin.png"
                  alt="Volume Pin"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 max-w-none object-contain translate-x-1/2 transition-all duration-300 z-10 drop-shadow-md group-hover/vol:scale-125"
                />
              </div>
            </div>
            <button className="hover:text-[#FF4F9A] ml-2"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/></svg></button>
            <button className="hover:text-[#FF4F9A]"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
          </div>
        </div>

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
  );
}
