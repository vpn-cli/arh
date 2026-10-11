"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { usePlayerVolumeStore } from '@/providers/volumeStore';
import { StickerIcon } from '../StickerIcon';
import { TRACK_CHANGE_SLIDE_IN_MS } from './vinylConstants';
import './now-playing.css';

export interface SoundWavesProps {
  currentTrack: any;
  isPaused: boolean;
  likeTrigger?: number;
}

const NUM_BARS = 14;
const BARS = Array.from({ length: NUM_BARS }, (_, i) => i);

export const SoundWaves = memo(function SoundWaves({
  currentTrack,
  isPaused,
  likeTrigger = 0,
}: SoundWavesProps) {
  const volume = usePlayerVolumeStore((s) => s.volume);

  const [isDocHidden, setIsDocHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDipping, setIsDipping] = useState(false);
  const [isRippling, setIsRippling] = useState(false);
  const [showRestingSticker, setShowRestingSticker] = useState(false);

  const prevTrackIdRef = useRef<string | null>(currentTrack?.id || null);
  const prevLikeTriggerRef = useRef(likeTrigger);
  const dipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rippleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tab visibility listener
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

  // Track change: wave dips during sleeve slide-in (~500ms) and rises with new record
  useEffect(() => {
    const prevId = prevTrackIdRef.current;
    const nextId = currentTrack?.id;

    if (prevId && nextId && prevId !== nextId) {
      prevTrackIdRef.current = nextId;
      if (!reducedMotion && !isDocHidden) {
        setIsDipping(true);
        if (dipTimerRef.current) clearTimeout(dipTimerRef.current);
        dipTimerRef.current = setTimeout(() => {
          setIsDipping(false);
        }, TRACK_CHANGE_SLIDE_IN_MS);
      }
    } else {
      prevTrackIdRef.current = nextId;
    }

    return () => {
      if (dipTimerRef.current) clearTimeout(dipTimerRef.current);
    };
  }, [currentTrack?.id, reducedMotion, isDocHidden]);

  // Like ripple trigger
  useEffect(() => {
    if (likeTrigger > 0 && likeTrigger !== prevLikeTriggerRef.current) {
      prevLikeTriggerRef.current = likeTrigger;
      if (!reducedMotion && !isDocHidden) {
        setIsRippling(true);
        if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current);
        rippleTimerRef.current = setTimeout(() => {
          setIsRippling(false);
        }, 600);
      }
    }
  }, [likeTrigger, reducedMotion, isDocHidden]);

  // Paused for 10 seconds: sticker r5c3 (56px) fades in, fades out on play
  useEffect(() => {
    if (isPaused) {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        setShowRestingSticker(true);
      }, 10000);
    } else {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      setShowRestingSticker(false);
    }

    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isPaused]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (dipTimerRef.current) clearTimeout(dipTimerRef.current);
      if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  // Compute wave level:
  // - follows volume while playing (taller when louder: 0.35 to 1.0)
  // - sinks low (0.15) on pause or during track dip
  const effectiveVolumeLevel = 0.35 + (typeof volume === 'number' && !isNaN(volume) ? volume : 0.5) * 0.65;
  const waveLevel = isPaused || isDipping ? 0.15 : effectiveVolumeLevel;

  return (
    <>
      <div
        className="absolute bottom-0 left-0 w-full h-1/2 flex items-end justify-center gap-2 pointer-events-none z-0 px-6 pb-2 overflow-hidden"
        style={
          {
            '--wave-level': waveLevel,
            transform: 'scaleY(var(--wave-level, 1))',
            transformOrigin: 'bottom center',
            transition: 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          } as React.CSSProperties
        }
      >
        {BARS.map((i) => {
          const staggerDelay = (i * 0.16).toFixed(2);
          const isPausedAnim = isPaused || isDocHidden || reducedMotion;
          // Arch: lowest at edges (~42%), highest at center (~86%)
          const archHeight = Math.round(36 + Math.sin(((i + 0.5) / NUM_BARS) * Math.PI) * 50);

          return (
            <div
              key={i}
              className={`soundwave-bar flex-1 max-w-[12px] rounded-full bg-[var(--color-vibrant)] opacity-25 select-none ${
                isRippling ? 'is-rippling' : ''
              }`}
              style={{
                height: `${archHeight}%`,
                animationDelay: `${staggerDelay}s`,
                animationPlayState: isPausedAnim ? 'paused' : 'running',
              }}
            />
          );
        })}
      </div>

      {/* Paused for 10s sticker resting on settled wave */}
      <div
        data-testid="resting-wave-sticker"
        className={`absolute bottom-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none ${
          reducedMotion ? '' : 'transition-opacity duration-500 ease-out'
        } ${showRestingSticker ? 'opacity-100' : 'opacity-0'}`}
      >
        <StickerIcon
          name="restingWave"
          size={56}
          className="max-w-none w-14 h-14 object-contain drop-shadow-sm select-none"
        />
      </div>
    </>
  );
});

SoundWaves.displayName = 'SoundWaves';
