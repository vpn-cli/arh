"use client";

import React, { useState } from "react";
import { useLikedTracks } from "@/hooks/useLikedTracks";
import { TrackList } from "../TrackList";
import { PlayIcon } from "../icons";
import { SectionHeader } from "../SectionHeader";
import { Pagination } from "../Pagination";

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

  const totalPages = Math.max(1, Math.ceil((likedData?.total || 0) / 50));
  const currentPage = libraryPage + 1;

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="Liked Songs"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setLibraryPage(p - 1)}
              />
            )}
            <button
              type="button"
              onClick={() => playTracks(likedData?.tracks?.map((t: any) => t.uri) || [], likedData?.tracks || [])}
              disabled={!likedData?.tracks?.length}
              className="mw-btn-primary"
            >
              <PlayIcon size={14} />
              <span>Play liked songs</span>
            </button>
          </div>
        }
      />

      {(() => {
        if (isLikedError && (likedError as any)?.status === 429) {
          return (
            <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-caption font-bold text-center px-4">
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
