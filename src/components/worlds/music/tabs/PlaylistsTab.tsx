"use client";

import React, { useState } from "react";
import { usePlaylists } from "@/hooks/useSpotify";
import { MediaRow } from "../MediaRow";
import { PlaylistCover } from "../PlaylistCover";
import { PlusIcon } from "../icons";

export interface PlaylistsTabProps {
  onOpenPlaylist: (id: string) => void;
  onCreatePlaylist: () => void;
  rateLimitTimer?: number | null;
}

export const PlaylistsTab = React.memo(function PlaylistsTab({
  onOpenPlaylist,
  onCreatePlaylist,
  rateLimitTimer,
}: PlaylistsTabProps) {
  const [playlistSearch, setPlaylistSearch] = useState("");
  const { data: playlists = [], isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError } = usePlaylists({ enabled: true });

  return (
    <>
      <div className="flex gap-2 mb-2 shrink-0">
        <input
          type="text"
          value={playlistSearch}
          onChange={(e) => setPlaylistSearch(e.target.value)}
          placeholder="Filter playlists..."
          aria-label="Filter playlists"
          className="flex-1 bg-white border-2 border-[var(--color-muted)] rounded-xl px-3 py-2 font-pixel text-meta text-[var(--color-dark)] placeholder:text-[var(--color-dark)]/80 focus:outline-none focus:border-[var(--color-vibrant)] focus:ring-2 focus:ring-[var(--color-vibrant)]/20"
        />
        <button
          onClick={onCreatePlaylist}
          className="bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)] text-[var(--on-vibrant)] px-4 py-2 rounded-xl font-pixel text-caption font-bold hover:scale-105 active:scale-95 transition-transform shadow-xs flex items-center gap-1.5"
          title="Create Playlist"
        >
          <PlusIcon size={14} /> NEW
        </button>
      </div>
      {(() => {
        if (isPlaylistsError && (playlistsError as any)?.status === 429) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-caption font-bold text-center px-4">RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((playlistsError as any)?.retryAfter ?? 60)} SECONDS.</div>;
        if (isPlaylistsLoading) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-caption font-medium animate-pulse">LOADING LIBRARY...</div>;
        if (playlists.length === 0) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-caption font-medium">NO PLAYLISTS FOUND</div>;

        const filteredPlaylists = playlists.filter((p: any) => p.name.toLowerCase().includes(playlistSearch.toLowerCase()));
        if (filteredPlaylists.length === 0) return <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-caption font-medium">NO MATCHES FOUND</div>;

        return (
          <div className="flex flex-col gap-1.5">
            {filteredPlaylists.map((p: any, idx: number) => {
              const trackCount =
                p.items?.total ??
                p.tracks?.total ??
                p.total_tracks ??
                (Array.isArray(p.items)
                  ? p.items.length
                  : Array.isArray(p.tracks?.items)
                  ? p.tracks.items.length
                  : Array.isArray(p.tracks)
                  ? p.tracks.length
                  : undefined);

              const subtitle = `Playlist • ${p.owner?.display_name || 'Spotify'}${
                trackCount !== undefined ? ` • ${trackCount} tracks` : ''
              }`;

              return (
                <MediaRow
                  key={`${p.id || 'playlist'}-${idx}`}
                  title={p.name}
                  subtitle={subtitle}
                  imageSlot={<PlaylistCover images={p.images} size={56} />}
                  imageSize={56}
                  imageShape="rounded"
                  onClick={() => onOpenPlaylist(p.id)}
                />
              );
            })}
          </div>
        );
      })()}
    </>
  );
});
