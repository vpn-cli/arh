import React from 'react';
import { TrackRow } from './TrackRow';

interface TrackListProps {
  tracks: any[];
  onPlayTrack: (uri: string, contextUri?: string) => void;
  onAddToQueue?: (track: any) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  variant?: 'default' | 'compact';
}

export function TrackList({ tracks, onPlayTrack, onAddToQueue, emptyMessage = "NO TRACKS FOUND", isLoading = false, variant = 'default' }: TrackListProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs animate-pulse">LOADING...</div>;
  }
  
  if (tracks.length === 0) {
    return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs">{emptyMessage}</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
      {tracks.map((t, i) => (
        <TrackRow key={t.id + i} index={i} track={t} onPlay={onPlayTrack} onAddToQueue={onAddToQueue} variant={variant} />
      ))}
    </div>
  );
}
