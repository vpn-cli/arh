"use client";

import React, { useEffect, useState } from "react";
import { redirectToSpotifyAuth, logoutSpotify } from "@/lib/spotifyAuth";
import { useSpotifySession, usePlaylists, useDevices, useBirthdayMix, useTrackSavedStatus, useSpotifyMutations } from "@/hooks/useSpotify";
import { useQueryClient } from '@tanstack/react-query';
import { useLikedTracks } from "@/hooks/useLikedTracks";
import { TrackList } from "./TrackList";
import { SearchResults } from "./SearchResults";
import { PlaylistDetail } from "./PlaylistDetail";
import { PlaylistCard } from "./PlaylistCard";
import { AlbumDetail } from "./AlbumDetail";
import { ArtistDetail } from "./ArtistDetail";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

const sfx: any = { select: () => {}, hover: () => {}, pop: () => {}, move: () => {}, error: () => {} };

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
    position, setPosition,
    duration, setDuration,
    error, setError
  } = useSpotifyPlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = React.useRef<HTMLDivElement>(null);

  // New Feature States
  const [activeTab, setActiveTab] = useState<'library' | 'mix' | 'playlists' | 'search' | 'album' | 'artist'>('library');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  
  
  
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [mixSearch, setMixSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  
  
  
  const [isGeneratingMix, setIsGeneratingMix] = useState(false);

  
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [libraryPage, setLibraryPage] = useState(0);
  
  const { data: playlists = [], isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError } = usePlaylists({ enabled: activeTab === 'playlists' });
  const { data: likedData, isLoading: isLikedLoading, isError: isLikedError, error: likedError } = useLikedTracks(libraryPage, 50, { enabled: activeTab === 'library' });
  const { data: devices = [], refetch: fetchDevices } = useDevices();
  const { data: birthdayMixTracks = [], isLoading: isMixLoading, isError: isMixError, error: mixError } = useBirthdayMix({ enabled: activeTab === 'mix' });
  
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalSearch), 500);
    return () => clearTimeout(t);
  }, [globalSearch]);
  
  const { data: isSaved = false } = useTrackSavedStatus(currentTrack?.id);
  const { play, toggleSave: toggleSaveMutation, toggleShuffle: toggleShuffleMutation } = useSpotifyMutations();
  


  

  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  useEffect(() => {
    const pError = playlistsError as any;
    const mError = mixError as any;
    const lError = likedError as any;
    if (pError?.status === 429 && pError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(pError.retryAfter);
    } else if (mError?.status === 429 && mError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(mError.retryAfter);
    } else if (lError?.status === 429 && lError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(lError.retryAfter);
    }
  }, [playlistsError, mixError, rateLimitTimer]);

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
    } catch (e: any) {}
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

  const togglePlay = () => {
    if (!player) return;
    sfx?.select?.();
    player.togglePlay();
  };

  const nextTrack = () => {
    if (!player) return;
    sfx?.select?.();
    player.nextTrack();
  };

  const prevTrack = () => {
    if (!player) return;
    sfx?.select?.();
    player.previousTrack();
  };

  const toggleShuffle = async () => {
    if (!token || !deviceId) return;
    sfx?.select?.();
    try {
      await toggleShuffleMutation.mutateAsync({ state: !isShuffle, device_id: deviceId });
      setIsShuffle(!isShuffle);
    } catch (e: any) {}
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

  if (!token) {
    return (
      <div className="w-full h-full min-h-[400px] bg-[#FFFFFF] rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_30px_rgba(255,182,193,0.3)] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 mb-6 relative animate-bounce">
          <div className="absolute inset-0 bg-[#FFB6C1] rounded-full opacity-50 blur-xl" />
          <div className="w-full h-full bg-[#FF69B4] rounded-full border-4 border-[#FFFFFF] shadow-lg flex items-center justify-center text-4xl text-white">
            ♪
          </div>
        </div>

        <h2 className="font-pixel text-3xl text-[#D81B60] mb-4">MUSIC WORLD</h2>
        <p className="font-retro text-[#7A2871] text-sm mb-8 max-w-md mx-auto leading-relaxed">
          CONNECT YOUR PREMIUM ACCOUNT TO SYNC PLAYLISTS & ENABLE PLAYBACK
        </p>

        <button
          onClick={() => {
            if (isLocalhost) {
              window.location.href = window.location.href.replace('localhost', '127.0.0.1');
            } else {
              redirectToSpotifyAuth();
            }
          }}
          className="group relative px-8 py-4 bg-gradient-to-r from-[#1DB954] to-[#1ed760] rounded-full font-pixel text-white shadow-[0_6px_20px_rgba(29,185,84,0.4)] hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.44-.48.18-1.02-.06-1.141-.54-.12-.48.06-1.021.54-1.141 4.26-1.26 9.6-0.6 13.5 1.86.42.24.54.78.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          {isLocalhost ? 'CLICK TO FIX URL' : 'LOGIN TO SPOTIFY'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 h-[650px] sm:h-[580px] relative">

      {/* Re-Login Popup Overlay */}
      {isSessionExpired && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FFE4E1]/80 backdrop-blur-sm rounded-3xl">
          <div className="bg-white rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_40px_rgba(255,105,180,0.4)] p-8 flex flex-col items-center gap-4 max-w-xs text-center">
            <div className="text-5xl animate-bounce">🔑</div>
            <h3 className="font-pixel text-lg text-[#D81B60] leading-snug">SESSION EXPIRED</h3>
            <p className="font-retro text-[10px] text-[#9B4F96] leading-relaxed">
              Your music is still playing! But the controls need a fresh login to keep working.
            </p>
            <button
              onClick={() => redirectToSpotifyAuth()}
              className="w-full mt-2 bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-white font-pixel text-sm py-3 px-6 rounded-full shadow-[0_4px_15px_rgba(29,185,84,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.44-.48.18-1.02-.06-1.141-.54-.12-.48.06-1.021.54-1.141 4.26-1.26 9.6-.6 13.5 1.86.42.24.54.78.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              RE-LOGIN TO SPOTIFY
            </button>
          </div>
        </div>
      )}

      {/* Sidebar: Tabs and Content */}
      <div className="w-full sm:w-1/3 bg-[#FFFFFF] rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_30px_rgba(255,182,193,0.3)] p-4 flex flex-col h-full z-10">
        
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between mb-4 border-b-2 border-[#FFE4E1] pb-2 shrink-0">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('library')}
              className={`font-pixel text-[10px] px-2 py-1 rounded-md transition-colors ${activeTab === 'library' ? 'bg-[#FFB6C1] text-[#FFFFFF]' : 'text-[#FFB6C1] hover:bg-[#FFE4E1]'}`}
            >
              LIKED
            </button>
            <button 
              onClick={() => { setActiveTab('playlists'); setSelectedPlaylistId(null); }}
              className={`font-pixel text-[10px] px-2 py-1 rounded-md transition-colors ${activeTab === 'playlists' ? 'bg-[#FFB6C1] text-[#FFFFFF]' : 'text-[#FFB6C1] hover:bg-[#FFE4E1]'}`}
            >
              PLAYLISTS
            </button>
            <button 
              onClick={() => setActiveTab('mix')}
              className={`font-pixel text-[10px] px-2 py-1 rounded-md transition-colors ${activeTab === 'mix' ? 'bg-[#FFB6C1] text-[#FFFFFF]' : 'text-[#FFB6C1] hover:bg-[#FFE4E1]'}`}
            >
              MIX
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={`font-pixel text-[10px] px-2 py-1 rounded-md transition-colors ${activeTab === 'search' ? 'bg-[#FFB6C1] text-[#FFFFFF]' : 'text-[#FFB6C1] hover:bg-[#FFE4E1]'}`}
            >
              SEARCH
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await logoutSpotify();
                queryClient.invalidateQueries({ queryKey: ['spotifySession'] });
              }}
              className="text-[#FFFFFF] text-[9px] bg-[#9B4F96] hover:bg-[#7A2871] transition-colors px-2 py-1 rounded-full shadow-sm cursor-pointer active:scale-95 font-pixel"
              title="Logout / Re-Login"
            >
              LOGOUT
            </button>
            <button 
              onClick={() => {}}
              className="text-[#FFFFFF] text-[9px] bg-[#D81B60] hover:bg-[#C2185B] transition-colors px-2 py-1 rounded-full shadow-sm cursor-pointer active:scale-95"
              title="Refresh!"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2 relative">
          {activeTab === 'playlists' && (
            selectedPlaylistId ? (
              <PlaylistDetail
                playlistId={selectedPlaylistId}
                onBack={() => setSelectedPlaylistId(null)}
                onPlayPlaylist={playPlaylist}
                onPlayTrack={(uri, contextUri) => {
                  if (contextUri) playContextTrack(contextUri, uri);
                  else playTrack(uri);
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
                <input 
                  type="text"
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  placeholder="Filter playlists..."
                  className="w-full bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-xl px-2 py-2 mb-2 font-retro text-[10px] text-[#7A2871] focus:outline-none focus:border-[#FF69B4] shrink-0"
                />
                {(() => {
                  if (isPlaylistsError && (playlistsError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[#FF4500] font-pixel text-xs text-center px-4">RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((playlistsError as any)?.retryAfter ?? 60)} SECONDS.</div>;
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

          {activeTab === 'library' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <span className="font-pixel text-[10px] text-[#D81B60]">LIKED SONGS</span>
                <div className="flex gap-2">
                  <button onClick={() => setLibraryPage(p => Math.max(0, p - 1))} disabled={libraryPage === 0} className="text-[10px] text-[#7A2871] disabled:opacity-50 hover:text-[#D81B60] cursor-pointer">◀</button>
                  <span className="text-[10px] text-[#7A2871]">{libraryPage + 1}</span>
                  <button onClick={() => setLibraryPage(p => p + 1)} disabled={!likedData?.next} className="text-[10px] text-[#7A2871] disabled:opacity-50 hover:text-[#D81B60] cursor-pointer">▶</button>
                </div>
              </div>
              <button 
                onClick={() => playTracks(likedData?.tracks?.map((t:any) => t.uri) || [])}
                disabled={!likedData?.tracks?.length}
                className={`w-full mb-3 shrink-0 bg-gradient-to-r from-[#FF99B9] to-[#FF69B4] text-white py-3 rounded-xl shadow-[0_4px_12px_rgba(255,105,180,0.4)] transition-all flex flex-col items-center justify-center gap-1 ${!likedData?.tracks?.length ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
              >
                <span className="font-pixel text-sm font-bold tracking-widest">
                  ✨ PLAY LIKED ✨
                </span>
              </button>
              {(() => {
                if (isLikedError && (likedError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[#FF4500] font-pixel text-xs text-center px-4">RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((likedError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                return <TrackList tracks={likedData?.tracks || []} isLoading={isLikedLoading} onPlayTrack={playTrack} emptyMessage="NO LIKED SONGS" />;
              })()}
            </div>
          )}

          {activeTab === 'mix' && (
            <>
              <input 
                type="text"
                value={mixSearch}
                onChange={(e) => setMixSearch(e.target.value)}
                placeholder="Filter birthday mix..."
                className="w-full bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-xl px-2 py-2 mb-2 font-retro text-[10px] text-[#7A2871] focus:outline-none focus:border-[#FF69B4] shrink-0"
              />
              <button 
                onClick={() => playTracks(birthdayMixTracks.map(t => t.uri))}
                disabled={birthdayMixTracks.length === 0}
                className={`w-full mb-3 shrink-0 bg-gradient-to-r from-[#FF99B9] to-[#FF69B4] text-white py-3 rounded-xl shadow-[0_4px_12px_rgba(255,105,180,0.4)] transition-all flex flex-col items-center justify-center gap-1 ${birthdayMixTracks.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
              >
                <span className="font-pixel text-sm font-bold tracking-widest">
                  ✨ PLAY ENTIRE MIX ✨
                </span>
              </button>
              {(() => {
                if (isMixError && (mixError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[#FF4500] font-pixel text-xs text-center px-4">RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((mixError as any)?.retryAfter ?? 60)} SECONDS.</div>;
                if (isMixLoading) return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs animate-pulse">GENERATING MIX...</div>;
                if (birthdayMixTracks.length === 0) return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs">NO MIX GENERATED</div>;
                
                const filteredMix = birthdayMixTracks.filter((t: any) => t.name.toLowerCase().includes(mixSearch.toLowerCase()) || t.artists.some((a:any) => a.name.toLowerCase().includes(mixSearch.toLowerCase())));
                if (filteredMix.length === 0) return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs">NO MATCHES FOUND</div>;
                
                return <TrackList tracks={filteredMix} isLoading={isMixLoading} onPlayTrack={playTrack} />;
              })()}
            </>
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
            />
          )}
        </div>
      </div>

      {/* Main Player Area */}
      <div className="w-full sm:w-2/3 bg-gradient-to-b from-[#FFE4E1] via-[#FFF0F5] to-[#FFC0CB] rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_30px_rgba(255,182,193,0.3)] flex flex-col items-center justify-center text-center relative overflow-hidden h-full p-6">

        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,182,193,0.4)_50%,transparent_75%)] bg-[length:40px_40px] opacity-50" />

        {/* Decorative Doodles (Optional) */}
        <div className="absolute top-10 left-10 text-[#FF69B4] font-pixel text-xl opacity-20 rotate-[-15deg]">★</div>
        <div className="absolute bottom-20 right-10 text-[#FF69B4] font-pixel text-2xl opacity-20 rotate-[20deg]">♪</div>

        {/* Background Audio Visualizer Bars */}
        {currentTrack && !isPaused && (
          <div className="absolute bottom-0 left-0 w-full h-1/4 flex items-end justify-center gap-2 opacity-30 px-8 z-0">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="w-full bg-gradient-to-t from-[#FF69B4] to-[#FFB6C1] animate-pulse rounded-t-full" style={{ height: `${20 + ((i * 17) % 80)}%`, animationDuration: `${0.2 + ((i * 13) % 50) / 100}s` }} />
            ))}
          </div>
        )}

            {/* Top Right Status */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">

              <div className="flex items-center gap-2 bg-[#FFFFFF]/90 px-3 py-1.5 rounded-full border-2 border-[#FFB6C1] shadow-sm h-full">
                <div className={`w-2 h-2 rounded-full border border-[#FFFFFF] shadow-sm ${isReady ? 'bg-[#32CD32] shadow-[0_0_8px_#32CD32]' : 'bg-[#FFB6C1] animate-pulse'}`} />
                <span className="font-retro text-[8px] text-[#7A2871] font-bold uppercase shrink-0">{!isReady ? "INIT..." : error ? "ERR" : isPaused ? "PAUSED" : "PLAYING"}</span>
              </div>
            </div>

        {currentTrack ? (
          <div className="relative z-10 flex flex-col items-center w-full h-full justify-center gap-6">

            {/* Record */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 transition-transform duration-500 group cursor-pointer hover:scale-105 mt-6">
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.album.name}
                className={`w-full h-full object-cover rounded-full shadow-[0_15px_40px_rgba(255,105,180,0.5)] border-8 border-[#FFFFFF] origin-center ${!isPaused ? 'animate-[spin_10s_linear_infinite]' : ''}`}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#FFE4E1] to-[#FFB6C1] rounded-full border-4 border-[#FFFFFF] shadow-inner" />
            </div>

            {/* Title & Artist */}
            <div className="flex flex-col items-center w-full px-4 max-w-lg mt-2 shrink-0">
              <h3 className="font-pixel text-xl sm:text-2xl text-[#D81B60] grid grid-cols-[3rem_1fr_3rem] items-center gap-2 w-full drop-shadow-sm shrink-0">
                <button onClick={toggleSaveTrack} className="text-3xl transition-transform hover:scale-110 active:scale-95 flex justify-center" title={isSaved ? "Remove from Library" : "Save to Library"}>
                  {isSaved ? <span className="text-[#D81B60]">♥</span> : <span className="text-[#FFB6C1] hover:text-[#FF69B4]">♡</span>}
                </button>
                <div className="overflow-hidden">
                  <span className="block font-pixel text-xl sm:text-2xl text-[#D81B60] text-center w-full truncate" title={currentTrack.name}>
                    {currentTrack.name}
                  </span>
                </div>
                <div className="w-full" /> {/* Spacer to balance the grid */}
              </h3>
              <div className="w-full text-center mt-1 px-4 sm:px-8">
                <p className="font-pixel text-xs sm:text-sm text-[#9B4F96] truncate w-full min-h-[1.5rem]" title={currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}>
                  {currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md flex items-center gap-4 group/slider px-4 mt-2">
              <span className="font-retro text-[10px] text-[#D81B60] font-bold w-10 text-right">{formatTime(position)}</span>
              <div
                ref={progressBarRef}
                className="flex-1 h-2 group-hover/slider:h-4 transition-all duration-300 bg-[#FFFFFF] rounded-full border-2 border-[#FFB6C1] shadow-inner relative flex items-center cursor-pointer touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className={`h-full bg-gradient-to-r from-[#FF99B9] to-[#FF69B4] relative rounded-full pointer-events-none ${isDragging ? 'transition-none' : 'transition-all duration-100 ease-linear'}`}
                  style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
                >
                  <img
                    src="/hampter/hello_kitty_pin.png"
                    alt="Kitty Pin"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 max-w-none object-contain translate-x-1/2 transition-all duration-300 z-10 drop-shadow-md group-hover/slider:scale-125"
                  />
                </div>
              </div>
              <span className="font-retro text-[10px] text-[#D81B60] font-bold w-10 text-left">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-8 mt-4 bg-[#FFFFFF]/60 px-8 py-3 rounded-full border-2 border-[#FFB6C1] shadow-sm backdrop-blur-sm z-10">
              <button
                onClick={toggleShuffle}
                className={`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${isShuffle ? 'text-[#FF69B4] drop-shadow-[0_2px_4px_rgba(255,105,180,0.4)]' : 'text-[#9B4F96] opacity-60 hover:opacity-100'}`}
                disabled={!isReady}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                </svg>
              </button>

              <button onClick={prevTrack} className="text-[#FF69B4] hover:text-[#D81B60] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 drop-shadow-sm" disabled={!isReady}>
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 bg-gradient-to-br from-[#FF69B4] to-[#D81B60] rounded-full flex items-center justify-center text-white border-4 border-[#FFFFFF] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_6px_15px_rgba(216,27,96,0.4)]"
                disabled={!isReady}
              >
                {isPaused ? (
                  <svg className="w-7 h-7 fill-current ml-1 drop-shadow-md" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                ) : (
                  <svg className="w-7 h-7 fill-current drop-shadow-md" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                )}
              </button>

              <button onClick={nextTrack} className="text-[#FF69B4] hover:text-[#D81B60] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 drop-shadow-sm" disabled={!isReady}>
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>
            </div>

            {/* Cast Devices */}
            <div className="mt-3 flex items-center justify-center w-full max-w-xs z-10">
              {devices.length > 0 ? (
                <div className="flex items-center gap-2 w-full bg-[#FFFFFF]/60 px-3 py-1.5 rounded-full border border-[#FFB6C1] shadow-sm">
                  <svg className="w-4 h-4 fill-[#D81B60] opacity-80 shrink-0" viewBox="0 0 24 24">
                    <path d="M1 9V7c0-1.1.9-2 2-2h18c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H11v-2h10V7H3v2H1zm0 11v-3c2.76 0 5 2.24 5 5H1zm0-7v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z"/>
                  </svg>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="flex-1 bg-transparent font-retro text-[8px] text-[#7A2871] focus:outline-none appearance-none cursor-pointer truncate"
                    title="Select Cast Device"
                  >
                    <option value="" disabled>Select Device...</option>
                    {devices.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <button 
                  onClick={() => fetchDevices()}
                  className="bg-[#FFFFFF]/60 hover:bg-[#FFF0F5] transition-colors border border-[#FFB6C1] rounded-full px-4 py-1.5 font-retro text-[8px] text-[#7A2871] shadow-sm flex items-center gap-2"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  LOAD DEVICES
                </button>
              )}
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center opacity-80 z-10">
            <span className="text-6xl mb-6 font-pixel text-[#FFFFFF] drop-shadow-lg">♪</span>
            <h2 className="font-pixel text-2xl text-[#D81B60] mb-2">NO TRACK LOADED</h2>
            <p className="font-retro text-[10px] font-bold tracking-widest text-[#7A2871] opacity-90">SELECT A PLAYLIST TO BEGIN PLAYBACK</p>
          </div>
        )}
      </div>
    </div>
  );
}
