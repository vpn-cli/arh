"use client";

import React, { useState, useMemo, memo } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { useRecentlyPlayed, usePlayerQueue } from '@/hooks/useSpotify';
import { formatTime } from '../playback/playbackHelpers';
import { ChevronRightIcon, MusicNoteIcon, CloseIcon, PlusIcon } from '../icons';

export interface QueuePanelProps {
  onExpand: (tab: 'queue' | 'recent') => void;
  playQueueItem: (index: number) => Promise<void>;
  playTrack: (uri: string, contextUri?: string, trackObj?: unknown) => Promise<void>;
  playContextTrack: (contextUri: string, trackUri: string) => Promise<void>;
  handleAddToQueue: (trackOrUri: unknown, contextUri?: string) => Promise<void>;
  token: string | null;
}

interface QueueTrackArtist {
  name: string;
}

interface QueueTrackImage {
  url: string;
}

interface QueueTrackAlbum {
  images?: QueueTrackImage[];
}

interface QueueTrackInfo {
  id?: string;
  uri?: string;
  name?: string;
  duration_ms?: number;
  album?: QueueTrackAlbum;
  artists?: QueueTrackArtist[];
}

interface QueueEntry {
  track?: QueueTrackInfo;
  contextUri?: string;
  context?: { uri?: string };
}

export const QueuePanel = memo(function QueuePanel({
  onExpand,
  playQueueItem,
  playTrack,
  playContextTrack,
  handleAddToQueue,
  token,
}: QueuePanelProps) {
  const [rightPanelTab, setRightPanelTab] = useState<'queue' | 'recent'>('queue');
  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);
  const [dragOverQueueIndex, setDragOverQueueIndex] = useState<number | null>(null);

  const queue = useSpotifyPlayerStore((s) => s.queue);
  const queueIndex = useSpotifyPlayerStore((s) => s.queueIndex);
  const clearQueue = useSpotifyPlayerStore((s) => s.clearQueue);
  const reorderQueue = useSpotifyPlayerStore((s) => s.reorderQueue);
  const removeFromQueue = useSpotifyPlayerStore((s) => s.removeFromQueue);
  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);

  const { data: playerQueueData } = usePlayerQueue({ enabled: !!token });
  const { data: recentTracks = [] } = useRecentlyPlayed({
    enabled: !currentTrack || rightPanelTab === 'recent',
  });

  const effectiveQueue = useMemo<QueueEntry[]>(() => {
    if (queue && queue.length > 0) return queue as QueueEntry[];
    if (playerQueueData?.queue && playerQueueData.queue.length > 0) {
      return playerQueueData.queue.map((t: QueueTrackInfo) => ({ track: t, contextUri: undefined }));
    }
    return [];
  }, [queue, playerQueueData]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden px-4 pb-4">
      {/* Tab Switcher & Bow */}
      <div className="flex items-center justify-between bg-[var(--color-light)] rounded-full p-1 mb-2.5 shrink-0 border border-[var(--color-muted)]">
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setRightPanelTab('queue')}
            className={`flex-1 font-pixel text-meta min-h-[32px] py-1 rounded-full flex items-center justify-center gap-1 transition-all font-bold ${
              rightPanelTab === 'queue'
                ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-xs'
                : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
            }`}
          >
            <span>♥</span> Queue ({queue.length})
          </button>
          <button
            onClick={() => setRightPanelTab('recent')}
            className={`flex-1 font-pixel text-meta min-h-[32px] py-1 rounded-full flex items-center justify-center gap-1 transition-all font-bold ${
              rightPanelTab === 'recent'
                ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-xs'
                : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
            }`}
          >
            <span>🕒</span> Recent
          </button>
        </div>
        <span className="text-body px-2 select-none" title="Hello Kitty">
          🎀
        </span>
      </div>

      {/* Header with Title and Clear / Expand */}
      <div className="flex items-center justify-between mb-1.5 shrink-0 px-1">
        <span className="font-pixel text-caption text-[var(--color-dark)] font-bold tracking-wide">
          {rightPanelTab === 'queue' ? '+ Up Next' : '🕒 Recently Played'}
        </span>
        <div className="flex items-center gap-2">
          {rightPanelTab === 'queue' && effectiveQueue.length > 0 && (
            <button
              onClick={() => clearQueue()}
              className="font-pixel text-meta min-h-[24px] px-2 py-0.5 rounded flex items-center justify-center text-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors font-bold"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => onExpand(rightPanelTab)}
            className="font-pixel text-meta min-h-[28px] text-[var(--color-dark)] hover:text-[var(--on-vibrant)] bg-white hover:bg-[var(--color-vibrant)] border border-[var(--color-muted)] px-2.5 py-1 rounded-full flex items-center gap-1 transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out shadow-xs font-bold active:scale-95 will-change-transform"
            title="Open large pop-up screen to tune queue & history"
          >
            <span>⤢</span> Expand
          </button>
        </div>
      </div>

      {/* Tracks List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
        {rightPanelTab === 'queue' ? (
          effectiveQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-2 py-4">
              <div className="text-title mb-1">🌸</div>
              <div className="text-[var(--color-dark)] font-pixel text-meta font-bold">QUEUE IS EMPTY</div>
              <p className="text-[var(--color-dark)] font-pixel text-caption mt-0.5 font-medium">
                Play or add tracks to build your list
              </p>
              <button
                onClick={() => onExpand('recent')}
                className="mt-2 font-pixel text-meta min-h-[28px] text-[var(--color-dark)] bg-white border border-[var(--color-muted)] px-3 py-1 rounded-full hover:bg-[var(--color-light)] transition-all font-bold shadow-xs inline-flex items-center gap-1"
              >
                Browse History <ChevronRightIcon size={12} />
              </button>
            </div>
          ) : (
            effectiveQueue.map((item, idx: number) => (
              <div
                key={`${item.track?.id || item.track?.uri || 'queue'}-${idx}`}
                draggable={queue.length > 0}
                onDragStart={(e) => {
                  if (queue.length === 0) return;
                  setDraggedQueueIndex(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (queue.length === 0) return;
                  e.preventDefault();
                  setDragOverQueueIndex(idx);
                }}
                onDragEnd={() => {
                  setDraggedQueueIndex(null);
                  setDragOverQueueIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (queue.length > 0 && draggedQueueIndex !== null && draggedQueueIndex !== idx) {
                    reorderQueue(draggedQueueIndex, idx);
                  }
                  setDraggedQueueIndex(null);
                  setDragOverQueueIndex(null);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl mw-row group cursor-pointer ${
                  dragOverQueueIndex === idx
                    ? draggedQueueIndex !== null && draggedQueueIndex < idx
                      ? 'border-b-[var(--color-vibrant)] border-b-2'
                      : 'border-t-[var(--color-vibrant)] border-t-2'
                    : ''
                } ${draggedQueueIndex === idx ? 'opacity-50' : 'opacity-100'}`}
                onClick={() => playQueueItem(idx)}
              >
                <span
                  className={`font-pixel text-caption w-6 text-center shrink-0 font-bold ${
                    idx === queueIndex ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'
                  }`}
                >
                  {idx + 1}
                </span>
                {item.track?.album?.images?.[0]?.url ? (
                  <img
                    src={(item.track.album.images[2] || item.track.album.images[0]).url}
                    loading="lazy"
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-2xs border border-[var(--color-muted)]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] border border-[var(--color-muted)] shrink-0 shadow-2xs flex items-center justify-center text-[var(--color-dark)]">
                    <MusicNoteIcon size={14} />
                  </div>
                )}
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <span
                    className={`font-pixel text-body font-bold truncate ${
                      idx === queueIndex ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'
                    }`}
                  >
                    {item.track?.name}
                  </span>
                  <span className="font-pixel text-body text-[var(--color-dark)] font-medium truncate">
                    {item.track?.artists?.map((a: { name: string }) => a.name).join(', ')}
                  </span>
                </div>
                <span className="font-pixel text-caption text-[var(--color-dark)] font-bold shrink-0">
                  {formatTime(item.track?.duration_ms || 0)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (queue.length > 0) {
                      removeFromQueue(idx);
                    }
                  }}
                  className={`mw-btn mw-row-action text-[var(--color-dark)] hover:text-[var(--color-dark)] w-6 h-6 min-w-[24px] min-h-[24px] rounded shrink-0 flex items-center justify-center ${
                    queue.length > 0 ? '' : 'hidden'
                  }`}
                  aria-label="Remove from queue"
                  title="Remove from queue"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            ))
          )
        ) : recentTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-2 py-4">
            <div className="text-title mb-1">🕒</div>
            <div className="text-[var(--color-dark)] font-pixel text-caption font-bold">NO RECENT TRACKS</div>
            <p className="text-[var(--color-dark)] font-pixel text-caption mt-0.5 font-medium">
              Play some tunes to see them here
            </p>
          </div>
        ) : (
          recentTracks.slice(0, 15).map((item: QueueEntry, idx: number) => {
            const track = item.track;
            if (!track) return null;
            return (
              <div
                key={`${track.id}-${idx}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl mw-row group cursor-pointer"
                onClick={() => {
                  if (item.context?.uri) playContextTrack(item.context.uri, track.uri || '');
                  else playTrack(track.uri || '', undefined, track);
                }}
              >
                <span className="font-pixel text-caption w-6 text-center shrink-0 text-[var(--color-dark)] font-bold">
                  {idx + 1}
                </span>
                {track.album?.images?.[0]?.url ? (
                  <img
                    src={(track.album.images[2] || track.album.images[0]).url}
                    loading="lazy"
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-2xs border border-[var(--color-muted)]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] border border-[var(--color-muted)] shrink-0 shadow-2xs flex items-center justify-center text-[var(--color-dark)]">
                    <MusicNoteIcon size={14} />
                  </div>
                )}
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <span className="font-pixel text-body font-bold text-[var(--color-dark)] truncate">
                    {track.name}
                  </span>
                  <span className="font-pixel text-body text-[var(--color-dark)] font-medium truncate">
                    {track.artists?.map((a: { name: string }) => a.name).join(', ')}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToQueue(track, item.context?.uri);
                  }}
                  className="mw-btn mw-row-action text-[var(--color-dark)] bg-white border border-[var(--color-muted)] hover:bg-[var(--color-vibrant)] hover:text-[var(--on-vibrant)] min-h-[28px] px-2.5 py-1 rounded-full font-pixel text-meta font-bold shadow-xs shrink-0 flex items-center gap-1"
                  title="Add to queue"
                >
                  <PlusIcon size={11} /> Queue
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

QueuePanel.displayName = 'QueuePanel';
