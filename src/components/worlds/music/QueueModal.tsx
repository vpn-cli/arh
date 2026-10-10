"use client";

import React, { useState } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { useRecentlyPlayed, usePlayerQueue } from '@/hooks/useSpotify';
import { formatTime } from './playback/playbackHelpers';
import {
  CloseIcon,
  SearchIcon,
  ShuffleIcon,
  MusicNoteIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlayIcon,
  PlusIcon,
  ChevronRightIcon,
} from './icons';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'queue' | 'recent';
  onPlayTrack: (uri: string, contextUri?: string) => void;
  onAddToPlaylist?: (uri: string) => void;
}

export function QueueModal({
  isOpen,
  onClose,
  initialTab = 'queue',
  onPlayTrack,
  onAddToPlaylist,
}: QueueModalProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'recent'>(initialTab);
  const [searchFilter, setSearchFilter] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const {
    queue,
    queueIndex,
    currentTrack,
    setQueueIndex,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    addToQueue,
    setQueue,
  } = useSpotifyPlayerStore();

  const { data: recentTracks = [], isLoading: isRecentLoading } = useRecentlyPlayed({
    enabled: isOpen,
  });

  const { data: playerQueueData, isLoading: isPlayerQueueLoading } = usePlayerQueue({
    enabled: isOpen,
  });

  const effectiveQueue = React.useMemo(() => {
    if (queue && queue.length > 0) return queue;
    if (playerQueueData?.queue && playerQueueData.queue.length > 0) {
      return playerQueueData.queue.map((t: any) => ({ track: t, contextUri: undefined }));
    }
    return [];
  }, [queue, playerQueueData]);

  if (!isOpen) return null;

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const ensureQueueInitialized = () => {
    if (queue.length === 0 && effectiveQueue.length > 0) {
      setQueue(effectiveQueue);
      return effectiveQueue;
    }
    return queue;
  };

  const handleShuffleQueue = () => {
    const currentList = ensureQueueInitialized();
    if (currentList.length <= 1) return;
    const newQueue = [...currentList];
    const upcoming = newQueue.slice(queueIndex + 1);
    for (let i = upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }
    const combined = [...newQueue.slice(0, queueIndex + 1), ...upcoming];
    setQueue(combined);
  };

  const handleMoveUp = (index: number) => {
    ensureQueueInitialized();
    if (index > 0) reorderQueue(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    ensureQueueInitialized();
    if (index < effectiveQueue.length - 1) reorderQueue(index, index + 1);
  };

  const filteredQueue = effectiveQueue.filter((item: any) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const name = item.track?.name?.toLowerCase() || '';
    const artist = item.track?.artists?.map((a: any) => a.name).join(' ').toLowerCase() || '';
    return name.includes(q) || artist.includes(q);
  });

  const filteredRecent = (recentTracks as any[]).filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const name = item.track?.name?.toLowerCase() || '';
    const artist = item.track?.artists?.map((a: any) => a.name).join(' ').toLowerCase() || '';
    return name.includes(q) || artist.includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border-[3px] border-[var(--color-muted)] rounded-3xl w-full max-w-4xl max-h-[82vh] flex flex-col shadow-[0_24px_64px_rgba(255,79,154,0.35)] overflow-hidden transition-colors duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[var(--color-muted)] flex items-center justify-between bg-white/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-light)] border border-[var(--color-muted)] flex items-center justify-center text-title shadow-xs transition-colors duration-500">
              🎀
            </div>
            <div>
              <h2 className="font-pixel text-title text-[var(--color-dark)] font-bold tracking-wide flex items-center gap-2">
                Playback Queue & History Tuner
                <span className="text-caption bg-[var(--color-vibrant)] text-[var(--on-vibrant)] px-2.5 py-0.5 rounded-full font-normal transition-colors duration-500">
                  {activeTab === 'queue' ? `${effectiveQueue.length} Tracks` : `${recentTracks.length} Recent`}
                </span>
              </h2>
              <p className="font-pixel text-caption text-[var(--color-dark)]">
                Tune your queue order, drag to arrange, or replay songs from recent sessions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[var(--color-light)] hover:bg-[var(--color-vibrant)] hover:text-[var(--on-vibrant)] text-[var(--color-dark)] transition-all flex items-center justify-center font-bold active:scale-95 shadow-xs border border-[var(--color-muted)]"
            title="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Toolbar & Tabs */}
        <div className="px-6 py-2.5 border-b border-[var(--color-muted)] bg-[var(--color-light)]/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Segmented Switcher */}
          <div className="flex items-center bg-[var(--color-light)] p-1 rounded-full border border-[var(--color-light)]">
            <button
              onClick={() => setActiveTab('queue')}
              className={`font-pixel text-meta min-h-[32px] px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-bold ${
                activeTab === 'queue'
                  ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-xs'
                  : 'text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-muted)]/40'
              }`}
            >
              <span className="text-meta">♥</span> Up Next ({effectiveQueue.length})
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`font-pixel text-meta min-h-[32px] px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-bold ${
                activeTab === 'recent'
                  ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-xs'
                  : 'text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-muted)]/40'
              }`}
            >
              <span className="text-caption">🕒</span> Recently Played ({recentTracks.length})
            </button>
          </div>

          {/* Search Filter & Quick Actions */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search tracks or artists..."
                className="bg-white border border-[var(--color-muted)] focus:border-[var(--color-vibrant)] rounded-full px-3 py-1.5 pl-7 text-meta text-[var(--color-dark)] placeholder-[var(--color-dark)] opacity-80 outline-none font-pixel w-60 transition-all shadow-2xs"
              />
              <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:opacity-100 w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded-full"
                  aria-label="Clear filter"
                >
                  <CloseIcon size={12} />
                </button>
              )}
            </div>

            {activeTab === 'queue' && effectiveQueue.length > 0 && (
              <>
                <button
                  onClick={handleShuffleQueue}
                  className="bg-white hover:bg-[var(--color-light)] border border-[var(--color-light)] text-[var(--color-dark)] hover:text-[var(--color-dark)] font-pixel text-meta min-h-[32px] px-3.5 py-1.5 rounded-full transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out flex items-center gap-1.5 font-bold shadow-2xs active:scale-95"
                  title="Randomize upcoming tracks in queue"
                >
                  <ShuffleIcon size={12} /> Shuffle Queue
                </button>
                <button
                  onClick={() => clearQueue()}
                  className="bg-white hover:bg-[var(--color-light)] border border-[var(--color-light)] text-[var(--color-dark)] hover:text-[var(--color-vibrant)] font-pixel text-meta min-h-[32px] px-3.5 py-1.5 rounded-full transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out font-bold shadow-2xs active:scale-95"
                  title="Remove all tracks from queue"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2">
          {activeTab === 'queue' ? (
            <>
              {/* Now Playing Banner */}
              {currentTrack && (
                <div className="bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-2xl p-3 flex items-center justify-between shadow-sm mb-3 transition-colors duration-500">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {currentTrack.album?.images?.[0]?.url ? (
                      <img
                        src={currentTrack.album.images[0].url}
                        alt={currentTrack.name}
                        className="w-13 h-13 rounded-xl object-cover border-2 border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-xl bg-[var(--color-muted)] flex items-center justify-center text-white shadow-sm shrink-0">
                        <MusicNoteIcon size={24} />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-pixel text-caption font-bold uppercase tracking-wider text-[var(--color-dark)] bg-white border border-[var(--color-light)] px-2.5 py-0.5 rounded-full shadow-2xs">
                          Now Playing
                        </span>
                        <span className="flex gap-0.5 items-end h-3">
                          <span className="w-1 h-3 bg-[var(--color-dark)] rounded-full animate-pulse" />
                          <span className="w-1 h-1.5 bg-[var(--color-dark)] rounded-full animate-pulse delay-75" />
                          <span className="w-1 h-3.5 bg-[var(--color-dark)] rounded-full animate-pulse delay-150" />
                        </span>
                      </div>
                      <span className="font-pixel text-body font-bold text-[var(--color-dark)] truncate tracking-wide">
                        {currentTrack.name}
                      </span>
                      <span className="font-pixel text-caption text-[var(--color-dark)] truncate font-medium">
                        {currentTrack.artists?.map((a: any) => a.name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="font-pixel text-body text-[var(--color-dark)] font-bold pr-3 shrink-0">
                    {formatTime(currentTrack.duration_ms)}
                  </span>
                </div>
              )}

              {/* Up Next List */}
              {isPlayerQueueLoading && effectiveQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-light)] border-2 border-[var(--color-muted)] flex items-center justify-center text-title mb-2 animate-bounce">
                    🎵
                  </div>
                  <h3 className="font-pixel text-body font-bold text-[var(--color-dark)]">Loading Upcoming Tracks...</h3>
                  <p className="font-pixel text-meta text-[var(--color-dark)] max-w-sm mt-1">Fetching live queue from Spotify</p>
                </div>
              ) : effectiveQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-light)] border-2 border-[var(--color-muted)] flex items-center justify-center text-heading mb-2 shadow-inner">
                    🌸
                  </div>
                  <h3 className="font-pixel text-body font-bold text-[var(--color-dark)]">Queue is Empty</h3>
                  <p className="font-pixel text-caption text-[var(--color-dark)] max-w-sm mt-1">
                    Play a playlist, album, mix, or click the options menu on any track to add it to your queue!
                  </p>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="py-12 text-center font-pixel text-body text-[var(--color-dark)]">
                  No songs match &quot;{searchFilter}&quot;
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-caption font-pixel font-bold text-[var(--color-dark)] tracking-wider uppercase px-2 flex justify-between items-center mb-1.5">
                    <span>Up Next ({filteredQueue.length} tracks)</span>
                    <span className="text-caption text-[var(--color-dark)] font-medium lowercase">Drag items or use arrows to reorder</span>
                  </div>

                  {filteredQueue.map((item: any, idx: number) => {
                    const originalIndex = effectiveQueue.indexOf(item);
                    const isCurrentlyActive = originalIndex === queueIndex;

                    return (
                      <div
                        key={`${item.track?.id}-${originalIndex}`}
                        draggable
                        onDragStart={(e) => {
                          setDraggedIdx(originalIndex);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverIdx(originalIndex);
                        }}
                        onDragEnd={() => {
                          setDraggedIdx(null);
                          setDragOverIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedIdx !== null && draggedIdx !== originalIndex) {
                            reorderQueue(draggedIdx, originalIndex);
                          }
                          setDraggedIdx(null);
                          setDragOverIdx(null);
                        }}
                        className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl mw-row ${
                          isCurrentlyActive
                            ? 'bg-[var(--color-light)] border-[var(--color-vibrant)] shadow-xs'
                            : 'bg-white border-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:shadow-2xs'
                        } ${
                          dragOverIdx === originalIndex
                            ? draggedIdx !== null && draggedIdx < originalIndex
                              ? 'border-b-2 border-b-[var(--color-vibrant)]'
                              : 'border-t-2 border-t-[var(--color-vibrant)]'
                            : ''
                        } ${draggedIdx === originalIndex ? 'opacity-40' : 'opacity-100'}`}
                      >
                        {/* Drag Handle & Reorder Controls */}
                        <div className="flex items-center gap-1 shrink-0 text-[var(--color-text-muted)]">
                          <span
                            className="cursor-grab active:cursor-grabbing hover:opacity-100 p-0.5 font-bold text-body select-none transition-opacity"
                            title="Drag to reorder"
                          >
                            ⋮⋮
                          </span>
                          <span
                            className={`font-pixel text-caption font-bold w-7 text-center ${
                              isCurrentlyActive ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'
                            }`}
                          >
                            {originalIndex + 1}
                          </span>
                        </div>

                        {/* Album Artwork */}
                        {item.track?.album?.images?.[0]?.url ? (
                          <img
                            src={item.track.album.images[0].url}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-[var(--color-muted)]"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[var(--color-muted)] shrink-0 flex items-center justify-center text-[var(--color-vibrant)] text-body transition-colors duration-500">
                            <MusicNoteIcon size={18} />
                          </div>
                        )}

                        {/* Title & Artist */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span
                            className={`font-pixel text-body font-bold truncate ${
                              isCurrentlyActive ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'
                            }`}
                          >
                            {item.track?.name || 'Unknown Track'}
                          </span>
                          <span className="font-pixel text-caption text-[var(--color-dark)] truncate mt-0.5">
                            {item.track?.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}
                          </span>
                        </div>

                        {/* Duration */}
                        <span className="font-pixel text-caption text-[var(--color-text-muted)] font-bold shrink-0">
                          {formatTime(item.track?.duration_ms)}
                        </span>

                        {/* Reorder Up/Down arrows */}
                        <div className="flex flex-col mw-row-action">
                          <button
                            onClick={() => handleMoveUp(originalIndex)}
                            disabled={originalIndex === 0}
                            className="mw-btn text-[var(--color-dark)] hover:text-[var(--color-dark)] disabled:opacity-20 text-meta w-6 h-6 min-w-[24px] min-h-[24px] leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded flex items-center justify-center"
                            title="Move Up"
                            aria-label={`Move ${item.track?.name} up`}
                          >
                            <ChevronUpIcon size={12} />
                          </button>
                          <button
                            onClick={() => handleMoveDown(originalIndex)}
                            disabled={originalIndex === queue.length - 1}
                            className="mw-btn text-[var(--color-dark)] hover:text-[var(--color-dark)] disabled:opacity-20 text-meta w-6 h-6 min-w-[24px] min-h-[24px] leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded flex items-center justify-center"
                            title="Move Down"
                            aria-label={`Move ${item.track?.name} down`}
                          >
                            <ChevronDownIcon size={12} />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setQueueIndex(originalIndex);
                              if (item.contextUri) {
                                onPlayTrack(item.track.uri, item.contextUri);
                              } else {
                                onPlayTrack(item.track.uri);
                              }
                            }}
                            className="mw-btn w-8 h-8 rounded-full bg-[var(--color-light)] hover:bg-[var(--color-vibrant)] hover:text-[var(--on-vibrant)] text-[var(--color-dark)] flex items-center justify-center text-meta shadow-2xs"
                            title="Play this track"
                          >
                            <PlayIcon size={13} />
                          </button>
                          {onAddToPlaylist && item.track?.uri && (
                            <button
                              onClick={() => onAddToPlaylist(item.track.uri)}
                              className="mw-btn w-8 h-8 rounded-full bg-[var(--color-light)] hover:bg-[var(--color-vibrant)] hover:text-[var(--on-vibrant)] text-[var(--color-dark)] flex items-center justify-center text-body font-bold shadow-2xs"
                              title="Add to Playlist"
                            >
                              <PlusIcon size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              ensureQueueInitialized();
                              removeFromQueue(originalIndex);
                            }}
                            className="mw-btn w-8 h-8 rounded-full hover:bg-rose-100 text-[var(--color-dark)] hover:text-rose-600 flex items-center justify-center text-meta"
                            title="Remove from Queue"
                          >
                            <CloseIcon size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Recently Played View */
            <div className="space-y-1">
              <div className="text-caption font-pixel font-bold text-[var(--color-dark)] tracking-wider uppercase px-2 flex justify-between items-center mb-1.5">
                <span>Recent Sessions ({filteredRecent.length} tracks)</span>
                <span className="text-caption text-[var(--color-dark)] font-medium lowercase">History from your Spotify listening</span>
              </div>

              {isRecentLoading ? (
                <div className="py-20 text-center font-pixel text-body text-[var(--color-dark)] animate-pulse">
                  Loading recently played songs...
                </div>
              ) : filteredRecent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-light)] border-2 border-[var(--color-muted)] flex items-center justify-center text-heading mb-2 shadow-inner">
                    🕰️
                  </div>
                  <h3 className="font-pixel text-body font-bold text-[var(--color-dark)]">
                    {searchFilter ? 'No Matches Found' : 'No History Yet'}
                  </h3>
                  <p className="font-pixel text-caption text-[var(--color-dark)] max-w-sm mt-1">
                    {searchFilter ? `No history matches "${searchFilter}"` : "Once you start listening, your recent tracks will appear here so you can easily replay them ~"}
                  </p>
                </div>
              ) : (
                filteredRecent.map((item: any, idx: number) => {
                  const track = item.track;
                  if (!track) return null;

                  return (
                    <div
                      key={`${track.id}-${item.played_at || idx}`}
                      className="group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl mw-row bg-white border border-[var(--color-muted)] hover:bg-[var(--color-bg)] shadow-2xs"
                    >
                      <span className="font-pixel text-caption font-bold text-[var(--color-dark)] w-7 text-center shrink-0">
                        {idx + 1}
                      </span>

                      {track.album?.images?.[0]?.url ? (
                        <img
                          src={track.album.images[0].url}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-[var(--color-muted)]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[var(--color-muted)] shrink-0 flex items-center justify-center text-[var(--color-dark)] text-body font-bold">
                          <MusicNoteIcon size={18} />
                        </div>
                      )}

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-pixel text-body font-bold text-[var(--color-dark)] truncate">
                          {track.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-pixel text-caption text-[var(--color-dark)] truncate">
                            {track.artists?.map((a: any) => a.name).join(', ')}
                          </span>
                          {item.played_at && (
                            <span className="font-pixel text-caption text-[var(--color-dark)] bg-[var(--color-light)] px-2 py-0.5 rounded-full shrink-0 font-medium">
                              {formatRelativeTime(item.played_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="font-pixel text-caption text-[var(--color-text-muted)] font-bold shrink-0">
                        {formatTime(track.duration_ms)}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onPlayTrack(track.uri, item.context?.uri)}
                          className="mw-btn w-8 h-8 rounded-full bg-[var(--color-light)] hover:bg-[var(--color-vibrant)] hover:text-[var(--on-vibrant)] text-[var(--color-dark)] flex items-center justify-center text-meta shadow-2xs"
                          title="Play Track"
                        >
                          <PlayIcon size={13} />
                        </button>
                        <button
                          onClick={() => addToQueue(track, item.context?.uri)}
                          className="mw-btn min-h-[30px] px-3 py-1 rounded-full bg-white hover:bg-[var(--color-light)] border border-[var(--color-muted)] text-[var(--color-dark)] font-pixel text-meta font-bold shadow-2xs flex items-center gap-1"
                          title="Add to Up Next Queue"
                        >
                          <PlusIcon size={11} /> Queue
                        </button>
                        {onAddToPlaylist && (
                          <button
                            onClick={() => onAddToPlaylist(track.uri)}
                            className="mw-btn w-8 h-8 rounded-full bg-[var(--color-light)] hover:bg-[var(--color-vibrant)] hover:text-[var(--on-vibrant)] text-[var(--color-dark)] flex items-center justify-center text-body font-bold shadow-2xs"
                            title="Add to Playlist"
                          >
                            <PlusIcon size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-[var(--color-muted)] bg-white/70 flex items-center justify-between font-pixel text-caption text-[var(--color-dark)] shrink-0">
          <div className="flex items-center gap-2">
            <span>✨ Kawaii Hint:</span>
            <span className="text-[var(--color-dark)]">
              {activeTab === 'queue'
                ? 'Songs will play sequentially in order from top to bottom.'
                : 'Click "+ Queue" on any song to add it straight to your playback line.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-pixel text-caption font-bold text-[var(--color-vibrant)] hover:underline transition-colors inline-flex items-center gap-1"
          >
            Back to Player <ChevronRightIcon size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
