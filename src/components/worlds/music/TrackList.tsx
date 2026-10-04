import React, { useState } from 'react';
import { TrackRow } from './TrackRow';

interface TrackListProps {
  tracks: any[];
  onPlayTrack: (uri: string, contextUri?: string) => void;
  onAddToQueue?: (track: any) => void;
  onAddToPlaylist?: (uri: string) => void;
  onRemoveFromPlaylist?: (uri: string) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  variant?: 'default' | 'compact';
}

export function TrackList({ tracks, onPlayTrack, onAddToQueue, onAddToPlaylist, onRemoveFromPlaylist, onReorder, emptyMessage = "NO TRACKS FOUND", isLoading = false, variant = 'default' }: TrackListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs animate-pulse">LOADING...</div>;
  }
  
  if (tracks.length === 0) {
    return <div className="flex items-center justify-center h-20 text-[#FFB6C1] font-pixel text-xs">{emptyMessage}</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
      {tracks.map((t, i) => (
        <div
          key={t.id + i}
          draggable={!!onReorder}
          onDragStart={(e) => {
            if (onReorder) {
              setDraggedIndex(i);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
              e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
            }
          }}
          onDragOver={(e) => {
            if (onReorder && draggedIndex !== null) {
              e.preventDefault();
              setDragOverIndex(i);
            }
          }}
          onDragLeave={() => {
            if (onReorder) setDragOverIndex(null);
          }}
          onDrop={(e) => {
            if (onReorder && draggedIndex !== null) {
              e.preventDefault();
              onReorder(draggedIndex, i);
              setDraggedIndex(null);
              setDragOverIndex(null);
            }
          }}
          onDragEnd={() => {
            if (onReorder) {
              setDraggedIndex(null);
              setDragOverIndex(null);
            }
          }}
          className={`${dragOverIndex === i ? (draggedIndex !== null && draggedIndex < i ? 'border-b-[#D81B60] border-b-2' : 'border-t-[#D81B60] border-t-2') : ''} ${draggedIndex === i ? 'opacity-50' : 'opacity-100'} transition-all flex items-center group`}
        >
          {onReorder && (
            <div className="px-1 text-[#FFB6C1] hover:text-[#FF69B4] cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 shrink-0">
              ⠿
            </div>
          )}
          <div className="flex-1 min-w-0">
            <TrackRow index={i} track={t} onPlay={onPlayTrack} onAddToQueue={onAddToQueue} onAddToPlaylist={onAddToPlaylist} onRemoveFromPlaylist={onRemoveFromPlaylist} variant={variant} />
          </div>
        </div>
      ))}
    </div>
  );
}
