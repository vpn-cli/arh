import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { trackChange, SNOOPY_STICKERS_ENABLED } from '../stickerConfig';
import './now-playing.css';

export interface VinylRecordProps {
  currentTrack: any;
  isPaused: boolean;
  onAddMemory?: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  likeTrigger?: number;
}

import {
  LIKE_REACTION_DURATION_MS,
  TRACK_CHANGE_SLIDE_IN_MS,
  TRACK_CHANGE_SLIDE_OUT_MS,
  TRACK_CHANGE_TOTAL_MS,
} from './vinylConstants';

export {
  LIKE_REACTION_DURATION_MS,
  TRACK_CHANGE_SLIDE_IN_MS,
  TRACK_CHANGE_SLIDE_OUT_MS,
  TRACK_CHANGE_TOTAL_MS,
} from './vinylConstants';

type SleevePhase = 'idle' | 'slide-in' | 'slide-out';

export const VinylRecord = memo(function VinylRecord({
  currentTrack,
  isPaused,
  onAddMemory,
  likeTrigger = 0,
}: VinylRecordProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayTrack, setDisplayTrack] = useState(currentTrack);
  const [sleevePhase, setSleevePhase] = useState<SleevePhase>('idle');
  const [currentTrackChangeSticker, setCurrentTrackChangeSticker] = useState<string | null>(null);
  const [isLikeReacting, setIsLikeReacting] = useState(false);
  const [isDocHidden, setIsDocHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const originTrackRef = useRef(currentTrack);
  const targetTrackRef = useRef(currentTrack);
  const trackChangeIndexRef = useRef(0);
  const isMidAnimationRef = useRef(false);
  const sleeveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const likeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevLikeTriggerRef = useRef(likeTrigger);

  // Tab hidden listener for pausing animations
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => setIsDocHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // prefers-reduced-motion listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Memory lookup using pre-loaded store data without fetching
  const memories = useMemoriesStore((s) => s.memories);
  const trackUri = currentTrack?.uri || (currentTrack?.id ? `spotify:track:${currentTrack.id}` : null);
  const currentMemory = useMemo(() => {
    if (!trackUri) return null;
    return memories.find((m) => m.spotifyUri === trackUri) || null;
  }, [memories, trackUri]);

  // Sleeve animation on track change: 500ms slide-in, 650ms slide-out (1150ms total)
  useEffect(() => {
    const next = currentTrack;
    if (!next?.id) return;

    if (originTrackRef.current?.id !== next.id && targetTrackRef.current?.id !== next.id) {
      setIsFlipped(false);
    }

    if (isMidAnimationRef.current) {
      if (next.id === targetTrackRef.current?.id) return;
      if (next.id === originTrackRef.current?.id) return;
      if (sleeveTimerRef.current) clearTimeout(sleeveTimerRef.current);
      isMidAnimationRef.current = false;
      setSleevePhase('idle');
      setCurrentTrackChangeSticker(null);
      setDisplayTrack(next);
      originTrackRef.current = next;
      targetTrackRef.current = next;
      return;
    }

    if (reducedMotion || (typeof document !== 'undefined' && document.hidden)) {
      if (sleeveTimerRef.current) clearTimeout(sleeveTimerRef.current);
      isMidAnimationRef.current = false;
      setSleevePhase('idle');
      setCurrentTrackChangeSticker(null);
      setDisplayTrack(next);
      originTrackRef.current = next;
      targetTrackRef.current = next;
      return;
    }

    if (originTrackRef.current?.id === next.id) {
      setDisplayTrack(next);
      return;
    }

    targetTrackRef.current = next;
    isMidAnimationRef.current = true;
    setIsFlipped(false);

    if (SNOOPY_STICKERS_ENABLED && trackChange.length > 0) {
      const sticker = trackChange[trackChangeIndexRef.current % trackChange.length];
      trackChangeIndexRef.current += 1;
      setCurrentTrackChangeSticker(sticker);
    } else {
      setCurrentTrackChangeSticker(null);
    }

    // Phase 1: Slide into sleeve (500ms)
    setSleevePhase('slide-in');

    sleeveTimerRef.current = setTimeout(() => {
      // Phase 2: Swap to new record and slide out from sleeve (650ms)
      setDisplayTrack(next);
      setSleevePhase('slide-out');

      sleeveTimerRef.current = setTimeout(() => {
        setSleevePhase('idle');
        setCurrentTrackChangeSticker(null);
        isMidAnimationRef.current = false;
        originTrackRef.current = next;
      }, TRACK_CHANGE_SLIDE_OUT_MS);
    }, TRACK_CHANGE_SLIDE_IN_MS);
  }, [currentTrack?.id, reducedMotion]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (sleeveTimerRef.current) clearTimeout(sleeveTimerRef.current);
      if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
    };
  }, []);

  // Like reaction (sticker r2c1 rides one turn around inner label rim, fades)
  useEffect(() => {
    if (likeTrigger > 0 && likeTrigger !== prevLikeTriggerRef.current) {
      prevLikeTriggerRef.current = likeTrigger;
      if (!reducedMotion && !isDocHidden) {
        setIsLikeReacting(true);
        if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
        likeTimerRef.current = setTimeout(() => {
          setIsLikeReacting(false);
        }, LIKE_REACTION_DURATION_MS);
      }
    }
  }, [likeTrigger, reducedMotion, isDocHidden]);

  const albumArtUrl =
    displayTrack?.album?.images?.[0]?.url ||
    (typeof displayTrack?.album?.images?.[0] === 'string'
      ? displayTrack.album.images[0]
      : '') ||
    '/soundscape_ref/finalui.png';

  const sleeveCoverTrack =
    sleevePhase === 'slide-in'
      ? originTrackRef.current
      : targetTrackRef.current || displayTrack;

  const sleeveArtUrl =
    sleeveCoverTrack?.album?.images?.[0]?.url ||
    (typeof sleeveCoverTrack?.album?.images?.[0] === 'string'
      ? sleeveCoverTrack.album.images[0]
      : '') ||
    '/soundscape_ref/finalui.png';

  const recordSlideClass =
    sleevePhase === 'slide-in'
      ? 'vinyl-slide-into-sleeve'
      : sleevePhase === 'slide-out'
      ? 'vinyl-slide-to-center'
      : '';

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={
        {
          '--vinyl-reaction-duration': `${LIKE_REACTION_DURATION_MS}ms`,
          '--vinyl-slide-in-duration': `${TRACK_CHANGE_SLIDE_IN_MS}ms`,
          '--vinyl-slide-out-duration': `${TRACK_CHANGE_SLIDE_OUT_MS}ms`,
          '--vinyl-track-change-duration': `${TRACK_CHANGE_TOTAL_MS}ms`,
          '--vinyl-label-size': '25%',
        } as React.CSSProperties
      }
    >
      {/* Sleeve Jacket (square record sleeve showing album art) */}
      <div
        aria-hidden="true"
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-4/5 aspect-square z-20 pointer-events-none vinyl-sleeve-jacket ${
          sleevePhase !== 'idle' ? 'vinyl-sleeve-jacket-active' : ''
        }`}
      >
        {/* Snoopy sits on sleeve top edge at 64px for whole time */}
        {SNOOPY_STICKERS_ENABLED && currentTrackChangeSticker && sleevePhase !== 'idle' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[82%] z-0 pointer-events-none select-none">
            <img
              src={`/stickers/snoopy-v1/${currentTrackChangeSticker}.png`}
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              className="w-[64px] h-[64px] object-contain max-w-none vinyl-sleeve-sticker drop-shadow-sm"
            />
          </div>
        )}

        <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-[var(--color-muted)] shadow-[0_8px_20px_rgba(0,0,0,0.15)] bg-[var(--color-light)]">
          <img
            src={sleeveArtUrl}
            alt="Sleeve Cover"
            className="w-full h-full object-cover"
          />
          {/* Darker slot line on the edge where the record enters */}
          <div className="absolute right-0 top-2 bottom-2 w-1 bg-[var(--color-dark)]/50 rounded-l" />
        </div>
      </div>

      {/* Record Container */}
      <div
        className={`relative w-4/5 h-4/5 z-10 vinyl-perspective ${recordSlideClass} ${
          isDocHidden ? 'tab-hidden' : ''
        }`}
      >
        {/* 3D Flipper */}
        <div
          className={`w-full h-full relative vinyl-flipper ${
            isFlipped ? 'vinyl-flipped' : ''
          }`}
        >
          {/* Side A: Front Face (Real Button) */}
          <button
            type="button"
            inert={isFlipped ? true : undefined}
            aria-hidden={isFlipped ? true : undefined}
            onClick={() => setIsFlipped(true)}
            aria-label={
              currentMemory
                ? 'Flip record to side B to view memory'
                : 'Flip record to side B to add a memory'
            }
            title={
              currentMemory
                ? 'Flip record to side B to view memory'
                : 'Flip record to side B to add a memory'
            }
            className="w-full h-full rounded-full cursor-pointer relative vinyl-face focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] transition-transform duration-300 hover:scale-[1.03] active:scale-95"
          >
            {/* Album Cover disc */}
            <img
              src={albumArtUrl}
              alt="Album Cover"
              className={`w-full h-full object-cover rounded-full shadow-[0_8px_24px_rgba(255,105,180,0.5)] border-4 border-[#FFFFFF] origin-center ${
                !isPaused && !isDocHidden && !isFlipped ? 'vinyl-spin-running' : ''
              }`}
            />

            {/* Center Spindle Label */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[var(--color-light)] to-[var(--color-muted)] rounded-full border-2 border-[#FFFFFF] shadow-inner flex items-center justify-center"
              style={{ width: 'var(--vinyl-label-size)', height: 'var(--vinyl-label-size)' }}
            >
              {currentMemory ? (
                <span
                  aria-hidden="true"
                  title="Memory saved"
                  className="text-[var(--color-vibrant)] select-none flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </span>
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-white/80 border border-[var(--color-muted)]" />
              )}
            </div>
          </button>

          {/* Side B: Back Face */}
          <div
            inert={!isFlipped ? true : undefined}
            aria-hidden={!isFlipped ? true : undefined}
            className="absolute inset-0 w-full h-full rounded-full vinyl-face vinyl-back bg-[#1F2937] border-4 border-[#374151] shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-3 rounded-full border border-gray-700/50 pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-gray-700/30 pointer-events-none" />

            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              aria-label="Flip record to front (side A)"
              title="Flip record to front (side A)"
              className="absolute inset-0 w-full h-full rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
            />

            <div className="relative z-10 w-3/5 h-3/5 bg-[var(--color-light)] rounded-full border-2 border-[var(--color-muted)] shadow-md flex flex-col items-center justify-center p-3 text-center pointer-events-auto">
              {currentMemory ? (
                <div className="flex flex-col items-center justify-center max-w-full">
                  {currentMemory.category && (
                    <span className="font-pixel text-meta text-[var(--color-dark)] uppercase font-bold tracking-wider truncate max-w-[120px] mb-0.5">
                      {currentMemory.category}
                    </span>
                  )}
                  <p className="font-pixel text-caption text-[var(--color-dark)] line-clamp-2 leading-tight font-medium px-1">
                    {currentMemory.note}
                  </p>
                  {currentMemory.dateLabel && (
                    <span className="font-pixel text-meta text-[var(--color-dark)]/70 mt-0.5">
                      {currentMemory.dateLabel}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddMemory?.(currentTrack, 'track');
                    }}
                    className="font-pixel text-meta text-[var(--color-dark)] hover:underline mt-1 font-bold active:scale-95 transition-transform"
                    aria-label="Edit memory"
                  >
                    Edit memory
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="font-pixel text-meta text-[var(--color-dark)]/70 mb-1 font-bold">
                    Side B
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddMemory?.(currentTrack, 'track');
                    }}
                    className="font-pixel text-caption px-3.5 py-1 rounded-full bg-[var(--color-vibrant)] text-[var(--on-vibrant)] font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Add a memory"
                  >
                    Add a memory
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Like reaction sticker (r2c1: 56px, standing on center label rim) */}
        {SNOOPY_STICKERS_ENABLED && isLikeReacting && !reducedMotion && (
          <div
            key={likeTrigger}
            aria-hidden="true"
            className="vinyl-orbit-rotator"
            style={
              {
                '--vinyl-reaction-duration': `${LIKE_REACTION_DURATION_MS}ms`,
              } as React.CSSProperties
            }
          >
            <div className="vinyl-sticker-hop">
              <img
                src="/stickers/snoopy-v1/r2c1.png"
                alt=""
                width={56}
                height={56}
                className="w-[56px] h-[56px] object-contain drop-shadow-sm pointer-events-none select-none max-w-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

VinylRecord.displayName = 'VinylRecord';
