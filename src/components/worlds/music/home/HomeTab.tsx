/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo } from "react";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { usePlaylists, useBirthdayMix, useRecentlyPlayed } from "@/hooks/useSpotify";
import { useLikedTracks } from "@/hooks/useLikedTracks";
import { PlayIcon, ChevronRightIcon, MusicNoteIcon } from "../icons";
import { HeroSlideshow } from "./HeroSlideshow";

export interface HomeTabProps {
  token?: string | null;
  onNavigate: (tab: any) => void;
  onOpenPlaylist: (id: string) => void;
  playTrack: (uri: string, contextUri?: string, track?: any) => void;
  playTracks: (uris: string[], tracks?: any[]) => void;
  togglePlay: () => void;
}

export const HomeTab = React.memo(function HomeTab({
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

  // One-time cleanup: remove legacy resolved_vibe_* keys from localStorage
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("resolved_vibe_")) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore if localStorage is unavailable
    }
  }, []);


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
      <HeroSlideshow
        currentTrack={currentTrack}
        isPaused={isPaused}
        heroArt={heroArt}
        birthdayMixTracks={birthdayMixTracks}
        likedTracks={likedData?.tracks || []}
        onNavigate={onNavigate}
        playTracks={playTracks}
        togglePlay={togglePlay}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-title sm:text-heading font-bold text-[var(--color-dark)] flex items-center gap-2">
            <span className="text-[var(--color-vibrant)]">♥</span> Continue Listening
          </h3>
          <button onClick={() => onNavigate('playlists')} className="mw-btn font-pixel text-meta sm:text-body font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] inline-flex items-center gap-1">
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
                <div className="relative aspect-[4/3] w-full bg-[var(--color-light)] flex items-center justify-center font-bold text-heading text-[var(--color-muted)]">
                  <MusicNoteIcon size={28} className="text-[var(--color-muted)]" />
                  <div className="absolute bottom-2 right-2 mw-card-play pointer-events-none">
                    <PlayIcon size={18} className="text-white ml-0.5" />
                  </div>
                </div>
              )}
              <div className="p-3">
                <div className="truncate font-pixel text-body font-bold text-[var(--color-dark)] mw-card-title">{playlist.name}</div>
                <div className="font-pixel text-caption text-[var(--color-dark)] font-medium opacity-80">{(playlist.items?.total ?? playlist.tracks?.total ?? playlist.total_tracks ?? (Array.isArray(playlist.items) ? playlist.items.length : (Array.isArray(playlist.tracks?.items) ? playlist.tracks.items.length : (Array.isArray(playlist.tracks) ? playlist.tracks.length : 0))))} songs</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-title sm:text-heading font-bold text-[var(--color-dark)] flex items-center gap-2">
            <span className="text-[var(--color-vibrant)]">◷</span> Recently Played
          </h3>
          <button onClick={() => onNavigate('recent')} className="mw-btn font-pixel text-meta sm:text-body font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] inline-flex items-center gap-1">
            See all <ChevronRightIcon size={14} />
          </button>
        </div>
        {recentHomeTracks.length === 0 && likedHomeTracks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[var(--color-muted)] bg-[var(--color-light)]/50">
            <p className="font-pixel text-body text-[var(--color-dark)] font-bold text-[var(--color-text-muted)]">Nothing here yet! Start playing some tunes ~</p>
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
                      <MusicNoteIcon size={20} className="text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <PlayIcon size={20} className="text-white drop-shadow-sm ml-0.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="truncate font-pixel text-body font-bold text-[var(--color-dark)] leading-snug">
                    {track.name}
                  </div>
                  <div className="truncate font-pixel text-meta text-[var(--color-dark)] font-medium opacity-80 mt-0.5">
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
