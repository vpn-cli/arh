/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { usePlaylists, useBirthdayMix, useRecentlyPlayed } from "@/hooks/useSpotify";
import { useLikedTracks } from "@/hooks/useLikedTracks";
import { VIBES } from "@/config/vibes";
import { useResolvedVibes } from "../hooks/useResolvedVibes";
import { PlayIcon, PauseIcon, ChevronRightIcon, MusicNoteIcon } from "../icons";

export interface HomeTabProps {
  token: string | null;
  onNavigate: (tab: any) => void;
  onOpenPlaylist: (id: string) => void;
  playTrack: (uri: string, contextUri?: string, track?: any) => void;
  playTracks: (uris: string[], tracks?: any[]) => void;
  togglePlay: () => void;
}

export const HomeTab = React.memo(function HomeTab({
  token,
  onNavigate,
  onOpenPlaylist,
  playTrack,
  playTracks,
  togglePlay,
}: HomeTabProps) {
  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);

  const { data: playlists = [] } = usePlaylists({ enabled: true });
  const { data: birthdayMixTracks = [] } = useBirthdayMix({ enabled: true });
  const { data: likedData } = useLikedTracks(0, 50, { enabled: true });
  const { data: recentTracks = [] } = useRecentlyPlayed({ enabled: true });

  const { resolvedVibes, handleVibeClick } = useResolvedVibes(token, onOpenPlaylist);


  const heroArt = currentTrack?.album?.images?.[0]?.url || playlists[0]?.images?.[0]?.url || "/soundscape_ref/finalui.png";

  const recentHomeTracks = useMemo(() => {
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
  }, [recentTracks]);

  const likedHomeTracks = useMemo(() => (likedData?.tracks || []).slice(0, 6), [likedData?.tracks]);
  const homePlaylists = useMemo(() => playlists.slice(0, 6), [playlists]);

  return (
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
                    onNavigate('mix');
                  }
                }
              }}
              className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-vibrant)] px-5 sm:px-6 py-2 sm:py-2.5 font-pixel text-sm sm:text-base font-bold text-white shadow-md mw-btn group"
            >
              <span>{currentTrack ? (isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />) : <PlayIcon size={16} />}</span>
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
          <button onClick={() => onNavigate('playlists')} className="mw-btn font-pixel text-xs sm:text-sm font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] inline-flex items-center gap-1">
            See all <ChevronRightIcon size={14} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {homePlaylists.map((playlist: any, idx: number) => (
            <button
              key={`${playlist.id || 'playlist'}-${idx}`}
              onClick={() => onOpenPlaylist(playlist.id)}
              className="w-[160px] sm:w-[180px] shrink-0 group overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-[var(--color-bg)]/95 text-left mw-card"
            >
              {playlist.images && playlist.images.length >= 4 ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden grid grid-cols-2 grid-rows-2 bg-[var(--color-light)]">
                  {playlist.images.slice(0, 4).map((img: any, i: number) => (
                    <img key={i} src={img.url || img} alt="" className="w-full h-full object-cover" />
                  ))}
                  <div className="absolute bottom-2 right-2 mw-card-play pointer-events-none">
                    <PlayIcon size={18} className="text-white ml-0.5" />
                  </div>
                </div>
              ) : playlist.images?.[0] ? (
                <div className="relative aspect-[4/3] w-full">
                  <img src={(playlist.images[1] || playlist.images[0]).url || playlist.images[0]} loading="lazy" alt={playlist.name} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute bottom-2 right-2 mw-card-play pointer-events-none">
                    <PlayIcon size={18} className="text-white ml-0.5" />
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[4/3] w-full bg-[var(--color-light)] flex items-center justify-center font-bold text-2xl text-[var(--color-muted)]">
                  <MusicNoteIcon size={28} className="text-[var(--color-muted)]" />
                  <div className="absolute bottom-2 right-2 mw-card-play pointer-events-none">
                    <PlayIcon size={18} className="text-white ml-0.5" />
                  </div>
                </div>
              )}
              <div className="p-3">
                <div className="truncate font-pixel text-base font-bold text-[var(--color-dark)] mw-card-title">{playlist.name}</div>
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
          <button onClick={() => onNavigate('vibes')} className="mw-btn font-pixel text-xs sm:text-sm font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] inline-flex items-center gap-1">
            See all <ChevronRightIcon size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
          {VIBES.filter(vibe => resolvedVibes[vibe.id] !== null).map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => handleVibeClick(vibe.id)}
              className="group relative overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-white text-left aspect-square mw-card"
            >
              <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${vibe.tone} text-4xl sm:text-5xl text-white drop-shadow-sm`}>
                {vibe.emoji}
              </div>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 p-3 flex flex-col justify-end pr-12">
                <div className="font-pixel text-sm sm:text-base font-bold text-white drop-shadow-md mw-card-title">{vibe.label}</div>
              </div>
              <div className="absolute bottom-2 right-2 mw-card-play pointer-events-none">
                <PlayIcon size={18} className="text-white ml-0.5" />
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
          <button onClick={() => onNavigate('recent')} className="mw-btn font-pixel text-xs sm:text-sm font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] inline-flex items-center gap-1">
            See all <ChevronRightIcon size={14} />
          </button>
        </div>
        {recentHomeTracks.length === 0 && likedHomeTracks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[var(--color-muted)] bg-[var(--color-light)]/50">
            <p className="font-pixel text-sm text-[var(--color-dark)] font-bold opacity-70">Nothing here yet! Start playing some tunes ~</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(recentHomeTracks.length ? recentHomeTracks : likedHomeTracks).map((track: any, idx: number) => (
              <button
                key={`${track.id || track.uri || 'track'}-${idx}`}
                onClick={() => playTrack(track.uri)}
                className="group flex items-center gap-3.5 overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-[var(--color-bg)]/95 text-left p-3 shadow-2xs hover:border-[var(--color-dark)]/40 hover:shadow-md transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] h-full"
              >
                <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-xs bg-[var(--color-light)]">
                  {track.album?.images?.[0]?.url ? (
                    <img
                      src={(track.album.images[1] || track.album.images[0]).url}
                      loading="lazy"
                      alt={track.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[var(--color-muted)] flex items-center justify-center">
                      <MusicNoteIcon size={20} className="text-[var(--color-dark)] opacity-60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <PlayIcon size={20} className="text-white drop-shadow-sm ml-0.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="truncate font-pixel text-[15px] font-bold text-[var(--color-dark)] leading-snug">
                    {track.name}
                  </div>
                  <div className="truncate font-pixel text-[13px] text-[var(--color-dark)] font-medium opacity-80 mt-0.5">
                    {track.artists?.map((a: any) => a.name).join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});
