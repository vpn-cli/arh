"use client";

import React, { useState } from "react";
import { useLikedTracks } from "@/hooks/useLikedTracks";
import { TrackList } from "../TrackList";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

export interface LibraryTabProps {
  playTrack: (uri: string, contextUri?: string, track?: any) => void;
  playTracks: (uris: string[], tracks?: any[]) => void;
  onAddToQueue: (track: any) => void;
  onAddToPlaylist: (uri: string) => void;
  onAddMemory: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  rateLimitTimer?: number | null;
}

export const LibraryTab = React.memo(function LibraryTab({
  playTrack,
  playTracks,
  onAddToQueue,
  onAddToPlaylist,
  onAddMemory,
  rateLimitTimer,
}: LibraryTabProps) {
  const [libraryPage, setLibraryPage] = useState(0);
  const { data: likedData, isLoading: isLikedLoading, isError: isLikedError, error: likedError } = useLikedTracks(libraryPage, 50, { enabled: true });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="font-pixel text-xs font-bold uppercase tracking-wider text-[var(--color-dark)]">LIKED SONGS</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLibraryPage(p => Math.max(0, p - 1))}
            disabled={libraryPage === 0}
            className="text-xs font-bold text-[var(--color-dark)] disabled:opacity-40 hover:text-[var(--color-dark)] cursor-pointer p-1 flex items-center justify-center"
            aria-label="Previous page"
          >
            <ChevronLeftIcon size={14} />
          </button>
          <span className="font-pixel text-xs font-bold text-[var(--color-dark)] px-1">{libraryPage + 1}</span>
          <button
            onClick={() => setLibraryPage(p => p + 1)}
            disabled={!likedData?.next}
            className="text-xs font-bold text-[var(--color-dark)] disabled:opacity-40 hover:text-[var(--color-dark)] cursor-pointer p-1 flex items-center justify-center"
            aria-label="Next page"
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
      <button
        onClick={() => playTracks(likedData?.tracks?.map((t: any) => t.uri) || [], likedData?.tracks || [])}
        disabled={!likedData?.tracks?.length}
        className={`w-full mb-3 shrink-0 bg-gradient-to-r from-[var(--color-vibrant)] to-[var(--color-vibrant)] hover:from-[var(--color-vibrant)] hover:to-[var(--color-dark)] text-white py-3 rounded-xl shadow-[0_4px_14px_var(--color-vibrant)] transition-all flex flex-col items-center justify-center gap-1 ${!likedData?.tracks?.length ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-95'}`}
      >
        <span className="font-pixel text-sm font-bold tracking-widest">
          ✦ PLAY LIKED ✦
        </span>
      </button>
      {(() => {
        if (isLikedError && (likedError as any)?.status === 429) {
          return (
            <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-xs font-bold text-center px-4">
              RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((likedError as any)?.retryAfter ?? 60)} SECONDS.
            </div>
          );
        }
        return (
          <TrackList
            tracks={likedData?.tracks || []}
            isLoading={isLikedLoading}
            onPlayTrack={playTrack}
            onAddToQueue={onAddToQueue}
            onAddToPlaylist={onAddToPlaylist}
            onAddMemory={(track) => onAddMemory(track, 'track')}
            emptyMessage="NO LIKED SONGS"
          />
        );
      })()}
    </div>
  );
});
