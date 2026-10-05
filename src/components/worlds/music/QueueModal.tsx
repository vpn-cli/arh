"use client";

import React, { useState } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { useRecentlyPlayed, usePlayerQueue } from '@/hooks/useSpotify';

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

  const formatTime = (ms: number) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
        className="bg-[#FFF5F8] border-[3px] border-[#FF9BC9] rounded-3xl w-full max-w-4xl h-[82vh] max-h-[760px] flex flex-col shadow-[0_24px_64px_rgba(255,79,154,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[#FFC1DA] flex items-center justify-between bg-white/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE1EF] border border-[#FF9BC9] flex items-center justify-center text-xl shadow-xs">
              🎀
            </div>
            <div>
              <h2 className="font-pixel text-xl text-[#5D1687] font-bold tracking-wide flex items-center gap-2">
                Playback Queue & History Tuner
                <span className="text-xs bg-[#FF4F9A] text-white px-2.5 py-0.5 rounded-full font-normal">
                  {activeTab === 'queue' ? `${effectiveQueue.length} Tracks` : `${recentTracks.length} Recent`}
                </span>
              </h2>
              <p className="font-pixel text-xs text-[#7A2871]">
                Tune your queue order, drag to arrange, or replay songs from recent sessions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FFE1EF] hover:bg-[#FF4F9A] hover:text-white text-[#5D1687] transition-all flex items-center justify-center font-bold text-lg active:scale-95 shadow-xs border border-[#FFC1DA]"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Toolbar & Tabs */}
        <div className="px-6 py-2.5 border-b border-[#FFD0E2] bg-[#FFF0F5]/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Segmented Switcher */}
          <div className="flex items-center bg-[#FFE4F0] p-1 rounded-full border border-[#FFCADF]">
            <button
              onClick={() => setActiveTab('queue')}
              className={`font-pixel text-xs px-3.5 py-1 rounded-full transition-all flex items-center gap-1.5 font-bold ${
                activeTab === 'queue'
                  ? 'bg-[#FF4F9A] text-white shadow-xs'
                  : 'text-[#8C3A7A] hover:text-[#5D1687] hover:bg-[#FFD6E8]/40'
              }`}
            >
              <span className="text-[11px]">♥</span> Up Next ({effectiveQueue.length})
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`font-pixel text-xs px-3.5 py-1 rounded-full transition-all flex items-center gap-1.5 font-bold ${
                activeTab === 'recent'
                  ? 'bg-[#FF4F9A] text-white shadow-xs'
                  : 'text-[#8C3A7A] hover:text-[#5D1687] hover:bg-[#FFD6E8]/40'
              }`}
            >
              <span className="text-[11px]">🕒</span> Recently Played ({recentTracks.length})
            </button>
          </div>

          {/* Search Filter & Quick Actions */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search tracks or artists..."
                className="bg-white border border-[#FFC1DA] focus:border-[#FF4F9A] rounded-full px-3 py-1 pl-7 text-[11px] text-[#5D1687] placeholder-[#A05596] outline-none font-pixel w-52 transition-all shadow-2xs"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#A05596]">🔍</span>
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#A05596] hover:text-[#5D1687]"
                >
                  ✕
                </button>
              )}
            </div>

            {activeTab === 'queue' && effectiveQueue.length > 0 && (
              <>
                <button
                  onClick={handleShuffleQueue}
                  className="bg-white hover:bg-[#FFE1EF] border border-[#FFCADF] text-[#7A2871] hover:text-[#5D1687] font-pixel text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1 font-bold shadow-2xs active:scale-95"
                  title="Randomize upcoming tracks in queue"
                >
                  <span>🔀</span> Shuffle Queue
                </button>
                <button
                  onClick={() => clearQueue()}
                  className="bg-white hover:bg-[#FFE1EF] border border-[#FFCADF] text-[#7A2871] hover:text-[#FF4F9A] font-pixel text-xs px-3 py-1 rounded-full transition-all font-bold shadow-2xs active:scale-95"
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
                <div className="bg-gradient-to-r from-[#FFE1EF] via-[#FFF3F8] to-[#FFE8F3] border-2 border-[#FF87BE] rounded-2xl p-3 flex items-center justify-between shadow-sm mb-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {currentTrack.album?.images?.[0]?.url ? (
                      <img
                        src={currentTrack.album.images[0].url}
                        alt={currentTrack.name}
                        className="w-13 h-13 rounded-xl object-cover border-2 border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-xl bg-[#FFB6C1] flex items-center justify-center text-xl text-white shadow-sm shrink-0">
                        ♪
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-pixel text-xs font-bold uppercase tracking-wider text-[#881337] bg-white border border-[#FFCADF] px-2.5 py-0.5 rounded-full shadow-2xs">
                          Now Playing
                        </span>
                        <span className="flex gap-0.5 items-end h-3">
                          <span className="w-1 h-3 bg-[#881337] rounded-full animate-pulse" />
                          <span className="w-1 h-1.5 bg-[#881337] rounded-full animate-pulse delay-75" />
                          <span className="w-1 h-3.5 bg-[#881337] rounded-full animate-pulse delay-150" />
                        </span>
                      </div>
                      <span className="font-pixel text-base font-bold text-[#4A0E4E] truncate tracking-wide">
                        {currentTrack.name}
                      </span>
                      <span className="font-pixel text-xs text-[#7A2871] truncate font-medium">
                        {currentTrack.artists?.map((a: any) => a.name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="font-pixel text-sm text-[#881337] font-bold pr-3 shrink-0">
                    {formatTime(currentTrack.duration_ms)}
                  </span>
                </div>
              )}

              {/* Up Next List */}
              {isPlayerQueueLoading && effectiveQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FFE1EF] border-2 border-[#FFC1DA] flex items-center justify-center text-xl mb-2 animate-bounce">
                    🎵
                  </div>
                  <h3 className="font-pixel text-sm font-bold text-[#5D1687]">Loading Upcoming Tracks...</h3>
                  <p className="font-pixel text-xs text-[#7A2871] max-w-sm mt-1">Fetching live queue from Spotify</p>
                </div>
              ) : effectiveQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#FFE1EF] border-2 border-[#FFC1DA] flex items-center justify-center text-2xl mb-2 shadow-inner">
                    🌸
                  </div>
                  <h3 className="font-pixel text-base font-bold text-[#5D1687]">Queue is Empty</h3>
                  <p className="font-pixel text-xs text-[#7A2871] max-w-sm mt-1">
                    Play a playlist, album, mix, or click the options menu on any track to add it to your queue!
                  </p>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="py-12 text-center font-pixel text-sm text-[#7A2871]">
                  No songs match &quot;{searchFilter}&quot;
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-pixel font-bold text-[#881337] tracking-wider uppercase px-2 flex justify-between items-center mb-1.5">
                    <span>Up Next ({filteredQueue.length} tracks)</span>
                    <span className="text-xs text-[#7A2871] font-medium lowercase">Drag items or use arrows to reorder</span>
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
                        className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all border ${
                          isCurrentlyActive
                            ? 'bg-[#FFE1EF] border-[#FF4F9A] shadow-xs'
                            : 'bg-white hover:bg-[#FFF5F9] border-[#FFD0E2] hover:border-[#FF9BC9] hover:shadow-2xs'
                        } ${
                          dragOverIdx === originalIndex
                            ? draggedIdx !== null && draggedIdx < originalIndex
                              ? 'border-b-2 border-b-[#FF4F9A]'
                              : 'border-t-2 border-t-[#FF4F9A]'
                            : ''
                        } ${draggedIdx === originalIndex ? 'opacity-40' : 'opacity-100'}`}
                      >
                        {/* Drag Handle & Reorder Controls */}
                        <div className="flex items-center gap-1 shrink-0 text-[#A05596]">
                          <span
                            className="cursor-grab active:cursor-grabbing hover:text-[#5D1687] p-0.5 font-bold text-sm select-none"
                            title="Drag to reorder"
                          >
                            ⋮⋮
                          </span>
                          <span
                            className={`font-pixel text-xs font-bold w-5 text-center ${
                              isCurrentlyActive ? 'text-[#FF4F9A]' : 'text-[#7A2871]'
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
                            className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-[#FFD0E2]"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#FFD0E2] shrink-0 flex items-center justify-center text-[#FF4F9A] text-sm">
                            ♪
                          </div>
                        )}

                        {/* Title & Artist */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span
                            className={`font-pixel text-sm font-bold truncate ${
                              isCurrentlyActive ? 'text-[#FF4F9A]' : 'text-[#4A0E4E]'
                            }`}
                          >
                            {item.track?.name || 'Unknown Track'}
                          </span>
                          <span className="font-pixel text-xs text-[#7A2871] truncate mt-0.5">
                            {item.track?.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}
                          </span>
                        </div>

                        {/* Duration */}
                        <span className="font-pixel text-xs text-[#82297D] font-bold shrink-0">
                          {formatTime(item.track?.duration_ms)}
                        </span>

                        {/* Reorder Up/Down arrows */}
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMoveUp(originalIndex)}
                            disabled={originalIndex === 0}
                            className="text-[#7A2871] hover:text-[#881337] disabled:opacity-20 text-xs p-1 leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337] rounded"
                            title="Move Up"
                            aria-label={`Move ${item.track?.name} up`}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveDown(originalIndex)}
                            disabled={originalIndex === queue.length - 1}
                            className="text-[#7A2871] hover:text-[#881337] disabled:opacity-20 text-xs p-1 leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337] rounded"
                            title="Move Down"
                            aria-label={`Move ${item.track?.name} down`}
                          >
                            ▼
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
                            className="w-8 h-8 rounded-full bg-[#FFE1EF] hover:bg-[#FF4F9A] hover:text-white text-[#5D1687] flex items-center justify-center text-xs transition-all active:scale-95 shadow-2xs"
                            title="Play this track"
                          >
                            ▶
                          </button>
                          {onAddToPlaylist && item.track?.uri && (
                            <button
                              onClick={() => onAddToPlaylist(item.track.uri)}
                              className="w-8 h-8 rounded-full bg-[#FFE1EF] hover:bg-[#FF4F9A] hover:text-white text-[#5D1687] flex items-center justify-center text-sm font-bold transition-all active:scale-95 shadow-2xs"
                              title="Add to Playlist"
                            >
                              +
                            </button>
                          )}
                          <button
                            onClick={() => {
                              ensureQueueInitialized();
                              removeFromQueue(originalIndex);
                            }}
                            className="w-8 h-8 rounded-full hover:bg-rose-100 text-[#7A2871] hover:text-rose-600 flex items-center justify-center text-xs transition-all active:scale-95"
                            title="Remove from Queue"
                          >
                            ✕
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
              <div className="text-xs font-pixel font-bold text-[#881337] tracking-wider uppercase px-2 flex justify-between items-center mb-1.5">
                <span>Recent Sessions ({filteredRecent.length} tracks)</span>
                <span className="text-xs text-[#7A2871] font-medium lowercase">History from your Spotify listening</span>
              </div>

              {isRecentLoading ? (
                <div className="py-20 text-center font-pixel text-sm text-[#8C3A7A] animate-pulse">
                  Loading recently played songs...
                </div>
              ) : filteredRecent.length === 0 ? (
                <div className="py-16 text-center font-pixel text-sm text-[#7A2871]">
                  {searchFilter ? `No history matches "${searchFilter}"` : 'No recently played tracks found.'}
                </div>
              ) : (
                filteredRecent.map((item: any, idx: number) => {
                  const track = item.track;
                  if (!track) return null;

                  return (
                    <div
                      key={`${track.id}-${item.played_at || idx}`}
                      className="group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#FFF5F9] border border-[#FFD0E2] hover:border-[#FF9BC9] transition-all shadow-2xs"
                    >
                      <span className="font-pixel text-xs font-bold text-[#8C3A7A] w-5 text-center shrink-0">
                        {idx + 1}
                      </span>

                      {track.album?.images?.[0]?.url ? (
                        <img
                          src={track.album.images[0].url}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-[#FFD0E2]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#FFD0E2] shrink-0 flex items-center justify-center text-[#881337] text-sm font-bold">
                          ♪
                        </div>
                      )}

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-pixel text-sm font-bold text-[#4A0E4E] truncate">
                          {track.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-pixel text-xs text-[#7A2871] truncate">
                            {track.artists?.map((a: any) => a.name).join(', ')}
                          </span>
                          {item.played_at && (
                            <span className="font-pixel text-xs text-[#7A2871] bg-[#FFE1EF] px-2 py-0.5 rounded-full shrink-0 font-medium">
                              {formatRelativeTime(item.played_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="font-pixel text-xs text-[#82297D] font-bold shrink-0">
                        {formatTime(track.duration_ms)}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onPlayTrack(track.uri, item.context?.uri)}
                          className="w-8 h-8 rounded-full bg-[#FFE1EF] hover:bg-[#FF4F9A] hover:text-white text-[#5D1687] flex items-center justify-center text-xs transition-all active:scale-95 shadow-2xs"
                          title="Play Track"
                        >
                          ▶
                        </button>
                        <button
                          onClick={() => addToQueue(track, item.context?.uri)}
                          className="px-3 py-1 rounded-full bg-white hover:bg-[#FFE1EF] border border-[#FFB6C1] text-[#5D1687] font-pixel text-xs font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1"
                          title="Add to Up Next Queue"
                        >
                          <span>+</span> Queue
                        </button>
                        {onAddToPlaylist && (
                          <button
                            onClick={() => onAddToPlaylist(track.uri)}
                            className="w-8 h-8 rounded-full bg-[#FFE1EF] hover:bg-[#FF4F9A] hover:text-white text-[#5D1687] flex items-center justify-center text-sm font-bold transition-all active:scale-95 shadow-2xs"
                            title="Add to Playlist"
                          >
                            +
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
        <div className="px-6 py-3 border-t border-[#FFD0E2] bg-white/70 flex items-center justify-between font-pixel text-xs text-[#7A2871] shrink-0">
          <div className="flex items-center gap-2">
            <span>✨ Kawaii Hint:</span>
            <span className="text-[#5D1687]">
              {activeTab === 'queue'
                ? 'Songs will play sequentially in order from top to bottom.'
                : 'Click "+ Queue" on any song to add it straight to your playback line.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-pixel text-xs font-bold text-[#FF4F9A] hover:underline"
          >
            Back to Player ➔
          </button>
        </div>
      </div>
    </div>
  );
}
