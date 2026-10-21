"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  memo,
  useState,
} from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { formatTime } from '../playback/playbackHelpers';
import { StickerIcon } from '../StickerIcon';
import { SNOOPY_STICKERS_ENABLED } from '../stickerConfig';
import './now-playing.css';

/**
 * Distance from lowest non-transparent pixel in r5c2.png (129x160) to the bottom of the image:
 * Measured via alpha channel inspection: lowest non-transparent pixel is at row y=159 (out of 160 rows).
 * Distance to bottom edge = 0px (0% of image height).
 * (With alpha > 13 anti-aliasing cutoff: y=158, 1px / 0.625%).
 */
const SCOOTER_WHEEL_BOTTOM_OFFSET_PCT = 0;

export interface ProgressBarApplyStateParams {
  positionMs?: number;
  durationMs?: number;
  paused?: boolean;
}

export interface ProgressBarHandle {
  applyState: (params: ProgressBarApplyStateParams) => void;
  showPosition: (ms: number) => void;
}

export interface ProgressBarProps {
  getPositionMs: () => number;
  onSeek: (positionMs: number) => void;
  onDragSeek: (newPosMs: number) => void;
}

export const ProgressBar = memo(
  forwardRef<ProgressBarHandle, ProgressBarProps>(function ProgressBar(
    { getPositionMs, onSeek, onDragSeek },
    ref
  ) {
    const duration = useSpotifyPlayerStore((s) => s.duration);
    const isPaused = useSpotifyPlayerStore((s) => s.isPaused);
    const player = useSpotifyPlayerStore((s) => s.player);
    const currentTrackId = useSpotifyPlayerStore((s) => s.currentTrack?.id);

    const progressBarRef = useRef<HTMLDivElement>(null);
    const progressBarFillRef = useRef<HTMLDivElement>(null);
    const progressBarThumbRef = useRef<HTMLDivElement>(null);
    const positionLabelRef = useRef<HTMLSpanElement>(null);

    // Keep duration and paused out of React state for animations
    const durationRef = useRef(duration > 0 ? duration : 0);
    const isPausedRef = useRef(isPaused);
    const isDraggingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const lastPositionMsRef = useRef(0);
    const lastTrackIdRef = useRef(currentTrackId);

    // Render helper applying transform directly to fill and thumb
    const renderProgress = useCallback(
      (positionMs: number, disableTransition: boolean) => {
        lastPositionMsRef.current = positionMs;

        const durationMs = durationRef.current;
        const clampedPos = durationMs > 0 ? Math.min(positionMs, durationMs) : positionMs;
        if (positionLabelRef.current) {
          const ts = Math.floor(clampedPos / 1000);
          positionLabelRef.current.textContent = `${Math.floor(ts / 60)}:${(ts % 60).toString().padStart(2, '0')}`;
        }

        if (!durationMs || durationMs <= 0) {
          return;
        }

        const percent = Math.max(0, Math.min(1, positionMs / durationMs));
        const fill = progressBarFillRef.current;
        const thumb = progressBarThumbRef.current;
        if (!fill || !thumb) return;

        if (disableTransition) {
          fill.style.transition = 'none';
          thumb.style.transition = 'none';
          fill.style.transform = `scaleX(${percent})`;
          thumb.style.transform = `translateX(${percent * 100 - 100}%)`;
          void fill.offsetHeight; // Force reflow so jump is committed immediately without transition
        } else {
          fill.style.transition = 'transform 250ms linear';
          thumb.style.transition = 'transform 250ms linear';
          fill.style.transform = `scaleX(${percent})`;
          thumb.style.transform = `translateX(${percent * 100 - 100}%)`;
        }
      },
      []
    );

    // Sync duration changes from store without overwriting valid duration with 0/missing
    useEffect(() => {
      if (duration && duration > 0) {
        durationRef.current = duration;
        renderProgress(getPositionMs(), true);
      }
    }, [duration, getPositionMs, renderProgress]);

    // Sync isPaused changes from store
    useEffect(() => {
      isPausedRef.current = isPaused;
      if (isPaused) {
        renderProgress(getPositionMs(), true);
      }
    }, [isPaused, getPositionMs, renderProgress]);

    // Handle jumps on track changes
    useEffect(() => {
      if (currentTrackId && currentTrackId !== lastTrackIdRef.current) {
        lastTrackIdRef.current = currentTrackId;
        renderProgress(getPositionMs(), true);
      }
    }, [currentTrackId, getPositionMs, renderProgress]);

    // Handle tab / window visibility change jump
    useEffect(() => {
      const handleSync = () => {
        if (document.visibilityState === 'visible') {
          renderProgress(getPositionMs(), true);
        }
      };
      document.addEventListener('visibilitychange', handleSync);
      window.addEventListener('focus', handleSync);
      return () => {
        document.removeEventListener('visibilitychange', handleSync);
        window.removeEventListener('focus', handleSync);
      };
    }, [getPositionMs, renderProgress]);

    // Initial mount sync
    useEffect(() => {
      renderProgress(getPositionMs(), true);
    }, [getPositionMs, renderProgress]);

    useImperativeHandle(
      ref,
      () => ({
        applyState: ({ positionMs, durationMs, paused }: ProgressBarApplyStateParams) => {
          if (typeof durationMs === 'number' && durationMs > 0) {
            durationRef.current = durationMs;
          }
          if (typeof paused === 'boolean') {
            isPausedRef.current = paused;
          }
          const targetPos = typeof positionMs === 'number' ? positionMs : getPositionMs();
          renderProgress(targetPos, true);
        },
        showPosition: (ms: number) => {
          const storeState = useSpotifyPlayerStore.getState();
          if (storeState.duration && storeState.duration > 0 && (!durationRef.current || durationRef.current <= 0)) {
            durationRef.current = storeState.duration;
          }
          isPausedRef.current = storeState.isPaused;
          renderProgress(ms, true);
        },
      }),
      [getPositionMs, renderProgress]
    );

    const updatePositionFromPointer = (clientX: number) => {
      const currentDuration = durationRef.current;
      if (!progressBarRef.current || !currentDuration || currentDuration <= 0) return;
      const bounds = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
      const newPos = percent * currentDuration;

      onDragSeek(newPos);

      if (positionLabelRef.current) {
        const ts = Math.floor(newPos / 1000);
        positionLabelRef.current.textContent = `${Math.floor(ts / 60)}:${(ts % 60).toString().padStart(2, '0')}`;
      }
      if (progressBarFillRef.current && progressBarThumbRef.current) {
        progressBarFillRef.current.style.transition = 'none';
        progressBarThumbRef.current.style.transition = 'none';
        progressBarFillRef.current.style.transform = `scaleX(${percent})`;
        progressBarThumbRef.current.style.transform = `translateX(${percent * 100 - 100}%)`;
      }
      return percent;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const currentDuration = durationRef.current;
      if (!player || !currentDuration || currentDuration <= 0) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updatePositionFromPointer(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const currentDuration = durationRef.current;
      if (!isDraggingRef.current || !player || !currentDuration || currentDuration <= 0) return;
      updatePositionFromPointer(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const currentDuration = durationRef.current;
      if (!isDraggingRef.current || !player || !currentDuration || currentDuration <= 0) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      const percent = updatePositionFromPointer(e.clientX);
      if (percent !== undefined) {
        const seekPos = percent * currentDuration;
        lastPositionMsRef.current = seekPos;
        onSeek(seekPos);
      }
    };

    // Update numeric time label, and progress bar ~4 times a second in rAF loop
    useEffect(() => {
      let frameId: number;
      let lastAriaUpdate = 0;
      let lastProgressUpdate = 0;

      const updateClock = () => {
        if (!isPausedRef.current && !isDraggingRef.current) {
          const currentPos = getPositionMs();

          // Update numeric time label
          const durationMs = durationRef.current;
          const clampedPos = durationMs > 0 ? Math.min(currentPos, durationMs) : currentPos;
          if (positionLabelRef.current) {
            const ts = Math.floor(clampedPos / 1000);
            positionLabelRef.current.textContent = `${Math.floor(ts / 60)}:${(ts % 60).toString().padStart(2, '0')}`;
          }

          const now = Date.now();
          const diff = Math.abs(currentPos - lastPositionMsRef.current);

          // For jumps (> 1s), apply new transform with transition disabled immediately
          if (diff > 1000) {
            renderProgress(currentPos, true);
            lastProgressUpdate = now;
          } else if (now - lastProgressUpdate >= 250) {
            // Periodic update about four times a second (~250ms)
            renderProgress(currentPos, false);
            lastProgressUpdate = now;
          }

          if (now - lastAriaUpdate >= 1000) {
            if (progressBarRef.current) {
              progressBarRef.current.setAttribute('aria-valuenow', Math.floor(currentPos).toString());
            }
            lastAriaUpdate = now;
          }
        }

        frameId = requestAnimationFrame(updateClock);
      };

      frameId = requestAnimationFrame(updateClock);
      return () => cancelAnimationFrame(frameId);
    }, [getPositionMs, renderProgress]);

    return (
      <div className="w-full flex flex-col gap-1 mt-4 group/slider">
        <div
          ref={progressBarRef}
          role="slider"
          aria-label="Playback progress"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={duration || durationRef.current || 0}
          tabIndex={0}
          data-cursor="grab"
          data-precision="true"
          className="w-full h-8 min-h-[32px] relative flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="progress-track absolute left-0 right-0 h-4 overflow-hidden rounded-full pointer-events-none scale-y-[0.6] group-hover/slider:scale-y-[0.85] transition-transform duration-300 ease-out origin-bottom bg-[var(--color-muted)]">
            <div
              ref={progressBarFillRef}
              className="progress-fill absolute left-0 top-0 bottom-0 w-full bg-[var(--color-dark)] rounded-full origin-left"
            />
          </div>
          <div
            ref={progressBarThumbRef}
            className="progress-thumb absolute left-0 top-0 bottom-0 w-full pointer-events-none"
          >
            <StickerIcon
              name="progressThumb"
              size={36}
              className={
                SNOOPY_STICKERS_ENABLED
                  ? `progress-handle-scooter absolute right-0 bottom-2 translate-x-1/2 origin-bottom z-10 drop-shadow-md group-hover/slider:scale-125 transition-transform duration-300 ease-out max-w-none ${
                      isDragging ? 'scale-125' : ''
                    }`
                  : `absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 origin-center z-10 drop-shadow-md group-hover/slider:scale-125 transition-transform duration-300 ease-out max-w-none ${
                      isDragging ? 'scale-125' : ''
                    }`
              }
              style={
                SNOOPY_STICKERS_ENABLED
                  ? {
                      transformOrigin:
                        SCOOTER_WHEEL_BOTTOM_OFFSET_PCT === 0
                          ? 'center bottom'
                          : `center calc(100% - ${SCOOTER_WHEEL_BOTTOM_OFFSET_PCT}%)`,
                      bottom: `calc(8px - ${(36 * SCOOTER_WHEEL_BOTTOM_OFFSET_PCT) / 100}px)`,
                    }
                  : {
                      transformOrigin: 'center center',
                    }
              }
            />
          </div>
        </div>
        <div className="flex justify-between w-full mt-1">
          <span ref={positionLabelRef} className="font-pixel text-caption text-[var(--color-dark)] font-bold tabular-nums">
            0:00
          </span>
          <span className="font-pixel text-caption text-[var(--color-dark)] font-bold tabular-nums">
            {formatTime(duration || durationRef.current || 0)}
          </span>
        </div>
      </div>
    );
  })
);

ProgressBar.displayName = 'ProgressBar';
