"use client";

import React, { useMemo } from "react";
import { useRecentlyPlayed } from "@/hooks/useSpotify";
import { TrackList } from "../TrackList";

export interface RecentTabProps {
  playTrack: (uri: string, contextUri?: string, track?: any) => void;
  onAddToQueue: (track: any) => void;
  onAddToPlaylist: (uri: string) => void;
  onAddMemory: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  rateLimitTimer?: number | null;
}

export const RecentTab = React.memo(function RecentTab({
  playTrack,
  onAddToQueue,
  onAddToPlaylist,
  onAddMemory,
  rateLimitTimer,
}: RecentTabProps) {
  const { data: recentTracks = [], isLoading: isRecentLoading, isError: isRecentError, error: recentError } = useRecentlyPlayed({ enabled: true });

  const tracks = useMemo(() => {
    return recentTracks.map((item: any) => item.track).filter(Boolean);
  }, [recentTracks]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-2 shrink-0">
        <span className="font-pixel text-caption font-bold uppercase tracking-wider text-[var(--color-dark)]">RECENTLY PLAYED</span>
      </div>
      {(() => {
        if (isRecentError && (recentError as any)?.status === 429) {
          return (
            <div className="flex items-center justify-center h-20 text-[var(--color-dark)] font-pixel text-caption font-bold text-center px-4">
              RATE LIMITED BY SPOTIFY.<br />WAIT {rateLimitTimer || ((recentError as any)?.retryAfter ?? 60)} SECONDS.
            </div>
          );
        }
        return (
          <TrackList
            tracks={tracks}
            isLoading={isRecentLoading}
            onPlayTrack={playTrack}
            onAddToQueue={onAddToQueue}
            onAddToPlaylist={onAddToPlaylist}
            onAddMemory={(track) => onAddMemory(track, 'track')}
            emptyMessage="NO RECENTLY PLAYED TRACKS"
          />
        );
      })()}
    </div>
  );
});
