import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { MusicNoteIcon } from '../icons';
import './now-playing.css';

export interface VinylRecordProps {
  currentTrack: any;
  isPaused: boolean;
  onAddMemory?: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  likeTrigger?: number;
}

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
  const [isLikeReacting, setIsLikeReacting] = useState(false);
  const [isDocHidden, setIsDocHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const prevTrackRef = useRef(currentTrack);
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

  // Interaction 2: Sleeve animation on track change (~450ms total)
  useEffect(() => {
    const prev = prevTrackRef.current;
    const next = currentTrack;

    // Interaction 1: Return to front on track change
    if (prev?.id !== next?.id) {
      setIsFlipped(false);
    }

    if (!prev || !next || prev.id === next.id) {
      prevTrackRef.current = next;
      setDisplayTrack(next);
      return;
    }

    // Mid-animation interrupt: jump straight to the final state immediately
    if (isMidAnimationRef.current) {
      if (sleeveTimerRef.current) clearTimeout(sleeveTimerRef.current);
      isMidAnimationRef.current = false;
      setSleevePhase('idle');
      setDisplayTrack(next);
      prevTrackRef.current = next;
      return;
    }

    // Immediate transition if reduced motion or hidden tab
    if (reducedMotion || (typeof document !== 'undefined' && document.hidden)) {
      setDisplayTrack(next);
      prevTrackRef.current = next;
      setSleevePhase('idle');
      return;
    }

    // Phase 1: Old record slides into sleeve (~220ms)
    isMidAnimationRef.current = true;
    setSleevePhase('slide-in');

    sleeveTimerRef.current = setTimeout(() => {
      // Phase 2: Swap to new record and slide out from sleeve (~225ms)
      setDisplayTrack(next);
      setSleevePhase('slide-out');

      sleeveTimerRef.current = setTimeout(() => {
        // Animation finished: resting state reached
        setSleevePhase('idle');
        isMidAnimationRef.current = false;
        prevTrackRef.current = next;
      }, 225);
    }, 220);

    return () => {
      if (sleeveTimerRef.current) clearTimeout(sleeveTimerRef.current);
    };
  }, [currentTrack?.id, reducedMotion]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (sleeveTimerRef.current) clearTimeout(sleeveTimerRef.current);
      if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
    };
  }, []);

  // Interaction 3: Like reaction (sticker r2c1 hops onto record, rides one turn, fades)
  useEffect(() => {
    if (likeTrigger > 0 && likeTrigger !== prevLikeTriggerRef.current) {
      prevLikeTriggerRef.current = likeTrigger;
      if (!reducedMotion && !isDocHidden) {
        setIsLikeReacting(true);
        if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
        likeTimerRef.current = setTimeout(() => {
          setIsLikeReacting(false);
        }, 1800);
      }
    }
  }, [likeTrigger, reducedMotion, isDocHidden]);

  const albumArtUrl =
    displayTrack?.album?.images?.[0]?.url ||
    (typeof displayTrack?.album?.images?.[0] === 'string'
      ? displayTrack.album.images[0]
      : '') ||
    '/soundscape_ref/finalui.png';

  const recordSlideClass =
    sleevePhase === 'slide-in'
      ? 'vinyl-slide-into-sleeve'
      : sleevePhase === 'slide-out'
      ? 'vinyl-slide-to-center'
      : '';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Sleeve Jacket (slides in during track change) */}
      <div
        aria-hidden="true"
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[55%] h-[82%] rounded-2xl bg-[var(--color-light)] border-2 border-[var(--color-muted)] shadow-[0_8px_20px_var(--color-muted)] z-20 pointer-events-none flex items-center justify-center vinyl-sleeve-jacket ${
          sleevePhase !== 'idle' ? 'vinyl-sleeve-jacket-active' : ''
        }`}
      >
        <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-[var(--color-muted)]/60 rounded-l" />
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--color-muted)] opacity-50 flex items-center justify-center">
          <MusicNoteIcon size={16} className="text-[var(--color-vibrant)]" />
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-gradient-to-br from-[var(--color-light)] to-[var(--color-muted)] rounded-full border-2 border-[#FFFFFF] shadow-inner flex items-center justify-center">
              {/* Marker when current song has a memory */}
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
            {/* Groove arcs */}
            <div className="absolute inset-3 rounded-full border border-gray-700/50 pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-gray-700/30 pointer-events-none" />

            {/* Accessible background button to flip back to Side A */}
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              aria-label="Flip record to front (side A)"
              title="Flip record to front (side A)"
              className="absolute inset-0 w-full h-full rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
            />

            {/* Center Memory Label on Side B */}
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


        {/* Interaction 3: Like reaction sticker (r2c1) */}
        {isLikeReacting && !reducedMotion && (
          <div aria-hidden="true" className="vinyl-orbit-rotator">
            <div className="vinyl-sticker-hop">
              <img
                src="/stickers/snoopy-v1/r2c1.png"
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 object-contain drop-shadow-sm pointer-events-none select-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

VinylRecord.displayName = 'VinylRecord';
