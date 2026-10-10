"use client";

import React, { memo } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { ProgressBar, ProgressBarHandle } from './ProgressBar';
import { PlaybackControls } from './PlaybackControls';
import { QueuePanel } from './QueuePanel';
import { ChevronDownIcon, MusicNoteIcon } from '../icons';
import { PopOutPipButton } from '../pip/PopOutPipButton';
import { useMediaSession } from '../playback/useMediaSession';

export interface NowPlayingPanelProps {
  progressBarRef?: React.Ref<ProgressBarHandle>;
  showLyrics: boolean;
  onToggleLyrics: () => void;
  isSaved: boolean;
  toggleSaveTrack: () => Promise<void>;
  getPositionMs: () => number;
  onSeek: (positionMs: number) => void;
  onDragSeek: (newPosMs: number) => void;
  token: string | null;
  togglePlay: () => Promise<void>;
  prevTrack: () => void;
  nextTrack: () => void;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
  onExpandQueue: (tab: 'queue' | 'recent') => void;
  playQueueItem: (index: number) => Promise<void>;
  playTrack: (uri: string, contextUri?: string, trackObj?: unknown) => Promise<void>;
  playContextTrack: (contextUri: string, trackUri: string) => Promise<void>;
  handleAddToQueue: (trackOrUri: unknown, contextUri?: string) => Promise<void>;
}

export const NowPlayingPanel = memo(function NowPlayingPanel({
  progressBarRef,
  showLyrics,
  onToggleLyrics,
  isSaved,
  toggleSaveTrack,
  getPositionMs,
  onSeek,
  onDragSeek,
  token,
  togglePlay,
  prevTrack,
  nextTrack,
  toggleShuffle,
  toggleRepeat,
  onExpandQueue,
  playQueueItem,
  playTrack,
  playContextTrack,
  handleAddToQueue,
}: NowPlayingPanelProps) {
  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);

  useMediaSession({ togglePlay, prevTrack, nextTrack });

  return (
    <div className="mw-now-playing-panel w-[380px] lg:w-[400px] xl:w-[420px] 2xl:w-[440px] border-l-2 border-[var(--color-muted)] flex flex-col shrink-0 bg-[var(--color-light)]">
      <div className="flex flex-col p-5 pb-3 relative shrink-0">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[var(--color-vibrant)] text-title">♥</span>
            <span className="font-pixel text-[var(--color-dark)] text-body font-bold">Now Playing</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PopOutPipButton
              getPositionMs={getPositionMs}
              onSeek={onSeek}
              onDragSeek={onDragSeek}
              togglePlay={togglePlay}
              prevTrack={prevTrack}
              nextTrack={nextTrack}
              isSaved={isSaved}
              toggleSaveTrack={toggleSaveTrack}
              token={token}
            />
            {currentTrack && (
              <button
                onClick={onToggleLyrics}
                className={`font-pixel text-meta min-h-[32px] min-w-[32px] px-3.5 py-1 rounded-full flex items-center justify-center gap-1 transition-all duration-150 ease-in-out shadow-xs font-bold active:scale-95 border ${
                  showLyrics
                    ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] border-[var(--color-vibrant)]'
                    : 'text-[var(--color-dark)] hover:text-[var(--on-vibrant)] bg-white hover:bg-[var(--color-vibrant)] border-[var(--color-muted)]'
                }`}
                title="Toggle Lyrics"
                aria-label="Toggle Lyrics"
              >
                {showLyrics ? <ChevronDownIcon size={12} /> : <span>❝</span>} Lyrics
              </button>
            )}
            <button
              onClick={() => onExpandQueue('queue')}
              className="font-pixel text-meta min-h-[32px] min-w-[32px] px-3.5 py-1 rounded-full flex items-center justify-center gap-1.5 transition-all duration-150 ease-in-out shadow-xs font-bold active:scale-95 border border-[var(--color-muted)] bg-white hover:bg-[var(--color-vibrant)] text-[var(--color-dark)] hover:text-[var(--on-vibrant)]"
              title="Open Queue"
              aria-label="Open Queue"
            >
              <MusicNoteIcon size={12} />
              <span>Queue</span>
            </button>
          </div>
        </div>

        {currentTrack ? (
          <div className="flex flex-col">
            {/* Art, Vinyl & Frequencies */}
            <div className="relative w-full aspect-square mb-3 flex items-center justify-center overflow-hidden rounded-2xl border-2 border-[var(--color-muted)] bg-[var(--color-light)] shadow-[0_8px_24px_var(--color-muted)]">
              {/* Audio Visualizer Frequencies */}
              {!isPaused && (
                <div className="absolute bottom-0 left-0 w-full h-1/2 flex items-end justify-center gap-1 opacity-40 px-2 z-0">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-full bg-gradient-to-t from-[var(--color-muted)] to-[var(--color-muted)] animate-pulse rounded-t-full"
                      style={{
                        height: `${20 + ((i * 17) % 80)}%`,
                        animationDuration: `${0.2 + ((i * 13) % 50) / 100}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {/* Record */}
              <div className="relative w-4/5 h-4/5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group cursor-pointer hover:scale-[1.08] z-10">
                <img
                  src={
                    currentTrack.album?.images?.[0]?.url ||
                    (typeof currentTrack.album?.images?.[0] === 'string'
                      ? currentTrack.album.images[0]
                      : '') ||
                    '/soundscape_ref/finalui.png'
                  }
                  alt="Album Cover"
                  className={`w-full h-full object-cover rounded-full shadow-[0_8px_24px_rgba(255,105,180,0.5)] border-4 border-[#FFFFFF] origin-center ${
                    !isPaused ? 'animate-[spin_10s_linear_infinite]' : ''
                  }`}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-gradient-to-br from-[var(--color-light)] to-[var(--color-muted)] rounded-full border-2 border-[#FFFFFF] shadow-inner" />
              </div>
            </div>

            {/* Track Info */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col overflow-hidden flex-1">
                <h3
                  className="font-pixel text-title font-bold text-[var(--color-dark)] line-clamp-2"
                  title={currentTrack.name}
                >
                  {currentTrack.name}
                </h3>
                <p
                  className="font-pixel text-caption text-[var(--color-dark)] font-medium truncate"
                  title={
                    currentTrack.artists
                      ? currentTrack.artists.map((a: { name: string }) => a.name).join(', ')
                      : 'Unknown Artist'
                  }
                >
                  {currentTrack.artists
                    ? currentTrack.artists.map((a: { name: string }) => a.name).join(', ')
                    : 'Unknown Artist'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 ml-2">
                <button
                  onClick={toggleSaveTrack}
                  className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-title transition-transform hover:scale-110 active:scale-95"
                  title={isSaved ? 'Remove from Library' : 'Save to Library'}
                  aria-label={isSaved ? 'Remove from Library' : 'Save to Library'}
                >
                  {isSaved ? (
                    <span className="text-[var(--color-vibrant)]">♥</span>
                  ) : (
                    <span className="text-[var(--color-dark)] hover:text-[var(--color-vibrant)]">♡</span>
                  )}
                </button>
                <button
                  className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-title text-[var(--color-dark)] hover:text-[var(--color-dark)] pb-1 font-bold"
                  aria-label="Track options"
                >
                  ...
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <ProgressBar
              ref={progressBarRef}
              getPositionMs={getPositionMs}
              onSeek={onSeek}
              onDragSeek={onDragSeek}
            />

            {/* Controls */}
            <PlaybackControls
              token={token}
              togglePlay={togglePlay}
              prevTrack={prevTrack}
              nextTrack={nextTrack}
              toggleShuffle={toggleShuffle}
              toggleRepeat={toggleRepeat}
            />
          </div>
        ) : (
          <div className="flex flex-col mb-4">
            <div className="relative w-full aspect-square mb-4 flex items-center justify-center">
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[#1F2937] rounded-full border-[6px] border-[#374151] flex items-center justify-center shadow-lg"
                style={{ right: '-10%' }}
              >
                <div className="w-1/3 h-1/3 bg-[var(--color-light)] rounded-full border-2 border-[#111827] flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="w-4/5 h-4/5 bg-[var(--color-light)] rounded-2xl shadow-[0_8px_24px_var(--color-muted)] relative z-10 border-2 border-[var(--color-muted)] flex items-center justify-center">
                <MusicNoteIcon size={44} className="text-[var(--color-vibrant)]" />
              </div>
            </div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col flex-1">
                <h3 className="font-pixel text-title font-bold text-[var(--color-dark)]">No track loaded</h3>
                <p className="font-pixel text-caption text-[var(--color-dark)] font-medium">
                  Select a playlist to begin playback
                </p>
              </div>
              <div className="flex gap-2 shrink-0 ml-2">
                <button className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-title text-[var(--color-dark)]">♡</button>
                <button className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-title text-[var(--color-dark)] pb-1 font-bold">...</button>
              </div>
            </div>
            <div className="w-full flex flex-col gap-1 mt-2">
              <div className="w-full h-2.5 bg-[var(--color-muted)] rounded-full"></div>
              <div className="flex justify-between w-full">
                <span className="font-pixel text-caption text-[var(--color-dark)] font-bold">0:00</span>
                <span className="font-pixel text-caption text-[var(--color-dark)] font-bold">0:00</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 px-2">
              <button className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-[var(--color-dark)]" aria-label="Shuffle disabled">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                </svg>
              </button>
              <button className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-[var(--color-dark)]" aria-label="Previous disabled">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                className="w-12 h-12 min-w-[48px] min-h-[48px] bg-[var(--color-light)] rounded-full flex items-center justify-center text-white/80"
                aria-label="Play disabled"
              >
                <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-[var(--color-dark)]" aria-label="Next disabled">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
              <button className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-[var(--color-dark)]" aria-label="Repeat disabled">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <QueuePanel
        onExpand={onExpandQueue}
        playQueueItem={playQueueItem}
        playTrack={playTrack}
        playContextTrack={playContextTrack}
        handleAddToQueue={handleAddToQueue}
        token={token}
      />
    </div>
  );
});

NowPlayingPanel.displayName = 'NowPlayingPanel';
