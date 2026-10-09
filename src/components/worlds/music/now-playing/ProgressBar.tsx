"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, memo } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { formatTime } from '../playback/playbackHelpers';
import './now-playing.css';

export interface ProgressBarApplyStateParams {
  positionMs: number;
  durationMs: number;
  paused: boolean;
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

    const progressBarRef = useRef<HTMLDivElement>(null);
    const progressBarFillRef = useRef<HTMLDivElement>(null);
    const progressBarThumbRef = useRef<HTMLDivElement>(null);
    const positionLabelRef = useRef<HTMLSpanElement>(null);
    const durationRef = useRef(duration);
    durationRef.current = duration;

    const [isDragging, setIsDragging] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        applyState: ({ positionMs, durationMs, paused }: ProgressBarApplyStateParams) => {
          if (progressBarFillRef.current && progressBarThumbRef.current) {
            const fill = progressBarFillRef.current;
            const thumb = progressBarThumbRef.current;
            fill.style.animationName = 'none';
            thumb.style.animationName = 'none';
            fill.style.transform = '';
            thumb.style.transform = '';
            fill.offsetHeight; // trigger reflow

            fill.style.animationName = 'progress-fill';
            fill.style.animationDuration = `${durationMs}ms`;
            fill.style.animationDelay = `-${positionMs}ms`;
            fill.style.animationPlayState = paused ? 'paused' : 'running';
            fill.style.animationTimingFunction = 'linear';
            fill.style.animationFillMode = 'forwards';

            thumb.style.animationName = 'progress-thumb';
            thumb.style.animationDuration = `${durationMs}ms`;
            thumb.style.animationDelay = `-${positionMs}ms`;
            thumb.style.animationPlayState = paused ? 'paused' : 'running';
            thumb.style.animationTimingFunction = 'linear';
            thumb.style.animationFillMode = 'forwards';
          }

          if (positionLabelRef.current) {
            const ts = Math.floor(positionMs / 1000);
            positionLabelRef.current.textContent = `${Math.floor(ts / 60)}:${(ts % 60).toString().padStart(2, '0')}`;
          }
        },
        showPosition: (ms: number) => {
          if (positionLabelRef.current) {
            const ts = Math.floor(ms / 1000);
            positionLabelRef.current.textContent = `${Math.floor(ts / 60)}:${(ts % 60).toString().padStart(2, '0')}`;
          }
          const currentDuration = durationRef.current;
          if (currentDuration > 0 && progressBarFillRef.current && progressBarThumbRef.current) {
            const percent = Math.max(0, Math.min(1, ms / currentDuration));
            progressBarFillRef.current.style.animationName = 'none';
            progressBarFillRef.current.style.transform = `scaleX(${percent})`;
            progressBarThumbRef.current.style.animationName = 'none';
            progressBarThumbRef.current.style.transform = `translateX(${percent * 100 - 100}%)`;
          }
        },
      }),
      []
    );

    const updatePositionFromPointer = (clientX: number) => {
      if (!progressBarRef.current || duration === 0) return;
      const bounds = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
      const newPos = percent * duration;

      onDragSeek(newPos);

      if (positionLabelRef.current) {
        const ts = Math.floor(newPos / 1000);
        positionLabelRef.current.textContent = `${Math.floor(ts / 60)}:${(ts % 60).toString().padStart(2, '0')}`;
      }
      if (progressBarFillRef.current && progressBarThumbRef.current) {
        progressBarFillRef.current.style.animationName = 'none';
        progressBarFillRef.current.style.transform = `scaleX(${percent})`;

        progressBarThumbRef.current.style.animationName = 'none';
        progressBarThumbRef.current.style.transform = `translateX(${percent * 100 - 100}%)`;
      }
      return percent;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!player || duration === 0) return;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      updatePositionFromPointer(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !player || duration === 0) return;
      updatePositionFromPointer(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !player || duration === 0) return;
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      const percent = updatePositionFromPointer(e.clientX);
      if (percent !== undefined) {
        onSeek(percent * duration);
      }
    };

    // Update numeric time label in rAF loop
    useEffect(() => {
      let frameId: number;
      let lastAriaUpdate = 0;
      const updateLabel = () => {
        if (!isPaused && !isDragging) {
          const currentPos = getPositionMs();
          if (positionLabelRef.current) {
            const ts = Math.floor(currentPos / 1000);
            positionLabelRef.current.textContent = `${Math.floor(ts / 60)}:${(ts % 60).toString().padStart(2, '0')}`;
          }
          const now = Date.now();
          if (now - lastAriaUpdate >= 1000) {
            if (progressBarRef.current) {
              progressBarRef.current.setAttribute('aria-valuenow', Math.floor(currentPos).toString());
            }
            lastAriaUpdate = now;
          }
        }
        frameId = requestAnimationFrame(updateLabel);
      };
      frameId = requestAnimationFrame(updateLabel);
      return () => cancelAnimationFrame(frameId);
    }, [isPaused, isDragging, duration, getPositionMs]);

    return (
      <div className="w-full flex flex-col gap-1 mt-1 group/slider">
        <div
          ref={progressBarRef}
          role="slider"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          tabIndex={0}
          className="w-full h-4 relative flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="absolute left-0 right-0 h-full overflow-hidden rounded-full pointer-events-none scale-y-[0.6] group-hover/slider:scale-y-[0.85] transition-transform duration-300 ease-out origin-center bg-[var(--color-muted)]">
            <div
              ref={progressBarFillRef}
              className="absolute left-0 top-0 bottom-0 w-full bg-[var(--color-dark)] rounded-full origin-left"
            />
          </div>
          <div
            ref={progressBarThumbRef}
            className="absolute left-0 top-0 bottom-0 w-full pointer-events-none"
          >
            <img
              src="/hampter/hello_kitty_pin.png"
              alt="Kitty Pin"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 max-w-none object-contain translate-x-1/2 z-10 drop-shadow-md group-hover/slider:scale-125 transition-transform duration-300"
            />
          </div>
        </div>
        <div className="flex justify-between w-full mt-1">
          <span ref={positionLabelRef} className="font-pixel text-xs text-[var(--color-dark)] font-bold">
            0:00
          </span>
          <span className="font-pixel text-xs text-[var(--color-dark)] font-bold">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    );
  })
);

ProgressBar.displayName = 'ProgressBar';
