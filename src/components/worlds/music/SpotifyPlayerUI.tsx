"use client";

import React, { useEffect, useState } from "react";
import { getAccessToken, redirectToSpotifyAuth, logoutSpotify } from "@/lib/spotifyAuth";
import { sfx } from "@/lib/audio";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

export default function SpotifyPlayerUI() {
  const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize
  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  // Update position every second if playing using player.getCurrentState()
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (player && !isPaused) {
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
  }, [player, isPaused]);

  // Load SDK and initialize
  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: "Kawaii Web Player",
        getOAuthToken: (cb: (token: string) => void) => { if (token) cb(token); },
        volume: 0.5
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        setIsReady(false);
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

    return () => {
      if (player) player.disconnect();
    };
  }, [token]);

  // Fetch Playlists
  useEffect(() => {
    if (!token) return;
    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.items) setPlaylists(data.items);
    })
    .catch(err => console.error(err));
  }, [token]);

  const playPlaylist = async (uri: string) => {
    if (!token || !deviceId) return;
    sfx?.select?.();
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ context_uri: uri })
      });
    } catch (e) {
      console.error(e);
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
      const newState = !isShuffle;
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newState}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsShuffle(newState);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || duration === 0) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    const newPosition = percent * duration;
    player.seek(newPosition);
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
          onClick={() => redirectToSpotifyAuth()}
          className="group relative px-8 py-4 bg-gradient-to-r from-[#1DB954] to-[#1ed760] rounded-full font-pixel text-white shadow-[0_6px_20px_rgba(29,185,84,0.4)] hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.44-.48.18-1.02-.06-1.141-.54-.12-.48.06-1.021.54-1.141 4.26-1.26 9.6-0.6 13.5 1.86.42.24.54.78.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          {isLocalhost ? 'URL MISMATCH' : 'LOGIN TO SPOTIFY'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      
      {/* Top Section: Playlists + Visualizer */}
      <div className="w-full flex flex-col sm:flex-row gap-6 h-[460px]">
        
        {/* Playlists Sidebar */}
        <div className="w-full sm:w-1/3 bg-[#FFFFFF] rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_30px_rgba(255,182,193,0.3)] p-4 flex flex-col h-full">
          <h4 className="font-pixel text-sm text-[#D81B60] tracking-widest mb-4 flex items-center justify-between border-b-2 border-[#FFE4E1] pb-3 shrink-0">
            <span>YOUR PLAYLISTS</span>
            <button 
              onClick={() => logoutSpotify()}
              className="text-[#FFFFFF] text-[10px] bg-[#D81B60] hover:bg-[#C2185B] transition-colors px-3 py-1 rounded-full shadow-sm cursor-pointer active:scale-95"
              title="Click to re-authenticate and fix missing track counts!"
            >
              RE-SYNC
            </button>
          </h4>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2 relative">
            {playlists.length === 0 ? (
              <div className="text-center mt-10 text-[#9B4F96] font-retro text-[8px] animate-pulse">
                LOADING LIBRARY...
              </div>
            ) : (
              playlists.map((pl: any) => (
                <button
                  key={pl.id}
                  onClick={() => playPlaylist(pl.uri)}
                  className="relative w-full text-left p-2 rounded-2xl hover:bg-[#FFF0F5] transition-all duration-300 flex items-center gap-3 group border-2 border-transparent hover:border-[#FF69B4] hover:shadow-[0_4px_15px_rgba(255,105,180,0.2)] hover:-translate-y-1 bg-white mb-1.5 shrink-0"
                >
                  {/* Cute hover sparkle decoration */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 text-[#FF69B4] font-pixel text-lg drop-shadow-sm">
                    ♬
                  </div>

                  {pl.images?.[0] ? (
                    <img src={pl.images[0].url} alt={pl.name} className="w-10 h-10 rounded-xl object-cover border-2 border-[#FFE4E1] group-hover:border-[#FF69B4] group-hover:scale-105 transition-all shadow-sm z-10 relative" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#FFE4E1] flex items-center justify-center text-lg border-2 border-[#FFB6C1] group-hover:border-[#FF69B4] group-hover:scale-105 transition-all font-pixel text-[#FF69B4] shadow-sm z-10 relative">♪</div>
                  )}
                  <div className="flex-1 overflow-hidden z-10 relative pr-6">
                    <div className="font-pixel text-sm text-[#7A2871] group-hover:text-[#D81B60] transition-colors line-clamp-1 uppercase">{pl.name}</div>
                    <div className="font-retro text-[9px] text-[#D81B60] mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {(() => {
                        const count = pl.tracks?.total ?? pl.tracks?.length ?? pl.items?.total ?? pl.items?.length;
                        if (count !== undefined && count !== null) {
                          return `♡ ${count} TRACKS`;
                        }
                        return `♡ PLAYLIST`;
                      })()}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Player Area (Visualizer) */}
        <div className="w-full sm:w-2/3 bg-[#FFFFFF] rounded-3xl border-4 border-[#FFB6C1] shadow-[0_10px_30px_rgba(255,182,193,0.3)] p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden h-full">
          {/* Subtle animated background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,182,193,0.1)_50%,transparent_75%)] bg-[length:40px_40px] opacity-50" />
          
          {/* Background Audio Visualizer Bars (fake but cute) */}
          {currentTrack && !isPaused && (
            <div className="absolute bottom-0 left-0 w-full h-1/3 flex items-end justify-center gap-1 opacity-20 px-4">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-full bg-[#FF69B4] animate-pulse rounded-t-full" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.2 + Math.random() * 0.5}s` }} />
              ))}
            </div>
          )}

          {currentTrack ? (
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 transition-transform duration-500 z-10 group cursor-pointer hover:scale-105">
              <img 
                src={currentTrack.album.images[0].url} 
                alt={currentTrack.album.name} 
                className={`w-full h-full object-cover rounded-full shadow-[0_15px_40px_rgba(255,105,180,0.4)] border-8 border-[#FFE4E1] ${!isPaused ? 'animate-[spin_10s_linear_infinite]' : ''}`} 
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#FFFFFF] rounded-full border-4 border-[#FFB6C1] shadow-inner" />
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-80 z-10">
              <span className="text-6xl mb-6 font-pixel text-[#FFB6C1] drop-shadow-md">♪</span>
              <h2 className="font-pixel text-2xl text-[#D81B60] mb-2">NO TRACK LOADED</h2>
              <p className="font-retro text-[10px] font-bold tracking-widest text-[#7A2871] opacity-90">SELECT A PLAYLIST TO BEGIN PLAYBACK</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Full Width Playback Controls */}
      <div className="w-full bg-gradient-to-r from-[#FFE4E1] via-[#FFF0F5] to-[#FFE4E1] border-4 border-[#FFB6C1] rounded-3xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between shadow-[0_10px_25px_rgba(255,182,193,0.4)] relative shrink-0 overflow-hidden mt-2">
        
        {/* Decorative subtle grid background */}
        <div 
          className="absolute inset-0 opacity-[0.2] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#FFB6C1 2px, transparent 2px)",
            backgroundSize: "16px 16px"
          }}
        />

        {/* Left: Track Info & Album Art */}
        <div className="relative z-10 flex items-center gap-4 w-full sm:w-[30%] mb-4 sm:mb-0">
          {currentTrack ? (
            <>
              <img 
                src={currentTrack.album.images[0].url} 
                alt="Album Art" 
                className="w-14 h-14 rounded-xl border-2 border-[#FFB6C1] shadow-sm object-cover shrink-0" 
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-pixel text-sm text-[#C2185B] line-clamp-1 truncate">{currentTrack.name}</span>
                <span className="font-retro text-[9px] text-[#7A2871] font-bold line-clamp-1 truncate">
                  {currentTrack.artists ? currentTrack.artists.map((a: any) => a.name).join(", ") : "Unknown Artist"}
                </span>
              </div>
            </>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#FFB6C1]/30 border-2 border-[#FFB6C1] shadow-sm flex items-center justify-center shrink-0">
              <span className="text-[#FF69B4] text-xl">♪</span>
            </div>
          )}
        </div>

        {/* Center: Playback Controls & Progress Bar */}
        <div className="relative z-20 flex flex-col items-center gap-2 w-full sm:w-[40%] max-w-md">
          {/* Controls Row */}
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleShuffle} 
              className={`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${isShuffle ? 'text-[#FF69B4] drop-shadow-[0_2px_4px_rgba(255,105,180,0.4)]' : 'text-[#9B4F96] opacity-60 hover:opacity-100'}`}
              disabled={!isReady}
              title={isShuffle ? "Shuffle On" : "Shuffle Off"}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>

            <button 
              onClick={prevTrack} 
              className="text-[#FF69B4] hover:text-[#D81B60] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 drop-shadow-sm"
              disabled={!isReady}
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            
            <button 
              onClick={togglePlay} 
              className={`w-10 h-10 bg-gradient-to-br from-[#FF69B4] to-[#D81B60] rounded-full flex items-center justify-center text-white border-2 border-[#FFFFFF] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(216,27,96,0.4)]`}
              disabled={!isReady}
            >
              {isPaused ? (
                <svg className="w-5 h-5 fill-current ml-1 drop-shadow-md" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              ) : (
                <svg className="w-5 h-5 fill-current drop-shadow-md" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              )}
            </button>
            
            <button 
              onClick={nextTrack} 
              className="text-[#FF69B4] hover:text-[#D81B60] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 drop-shadow-sm"
              disabled={!isReady}
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full flex items-center gap-3 group/slider cursor-pointer" onClick={handleSeek}>
            <span className="font-retro text-[8px] text-[#7A2871] font-bold w-8 text-right opacity-80">{currentTrack ? formatTime(position) : "-:--"}</span>
            <div className="flex-1 h-2 bg-[#FFFFFF] rounded-full overflow-hidden border-2 border-[#FFB6C1] shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-[#FF99B9] to-[#FF69B4] transition-all duration-100 ease-linear relative rounded-r-full"
                style={{ width: `${currentTrack && duration > 0 ? (position / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-[#FF69B4] translate-x-1.5 opacity-0 group-hover/slider:opacity-100 transition-opacity shadow-sm" />
              </div>
            </div>
            <span className="font-retro text-[8px] text-[#7A2871] font-bold w-8 text-left opacity-80">{currentTrack ? formatTime(duration) : "-:--"}</span>
          </div>
        </div>

        {/* Right: Status / Spacer */}
        <div className="relative z-10 hidden sm:flex justify-end w-[30%]">
          <div className="flex items-center gap-2 bg-[#FFFFFF]/90 px-4 py-2 rounded-full border-2 border-[#FFB6C1] shadow-sm">
            <div className={`w-2 h-2 rounded-full border border-[#FFFFFF] shadow-sm ${isReady ? 'bg-[#32CD32] shadow-[0_0_8px_#32CD32]' : 'bg-[#FFB6C1] animate-pulse'}`} />
            <span className="font-retro text-[8px] sm:text-[9px] text-[#7A2871] tracking-widest font-bold uppercase whitespace-nowrap">
              {!isReady ? "INIT..." : error ? "ERR" : currentTrack ? (isPaused ? "PAUSED" : "NOW PLAYING") : "READY"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
