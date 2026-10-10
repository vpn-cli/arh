"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { formatTime } from "../playback/playbackHelpers";

import { usePip } from "./PipContext";

export interface MiniPlayerProps {
  getPositionMs: () => number;
  onSeek: (positionMs: number) => void;
  onDragSeek?: (newPosMs: number) => void;
  togglePlay: () => Promise<void>;
  prevTrack: () => void;
  nextTrack: () => void;
  isSaved: boolean;
  toggleSaveTrack: () => Promise<void>;
  token: string | null;
  pipWindow?: Window | null;
}

export function MiniPlayer({
  getPositionMs,
  onSeek,
  onDragSeek,
  togglePlay,
  prevTrack,
  nextTrack,
  isSaved,
  toggleSaveTrack,
  token,
  pipWindow: pipWindowProp,
}: MiniPlayerProps) {
  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);
  const duration = useSpotifyPlayerStore((s) => s.duration);
  const isReady = useSpotifyPlayerStore((s) => s.isReady);
  const isPremium = useSpotifyPlayerStore((s) => s.isPremium);
  const pipContext = usePip();

  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const durationRef = useRef(duration > 0 ? duration : 0);
  const isPausedRef = useRef(isPaused);

  const renderProgress = useCallback(() => {
    const pos = getPositionMs();
    const dur = durationRef.current;
    const progress = dur > 0 ? Math.min(1, Math.max(0, pos / dur)) : 0;

    if (fillRef.current) {
      fillRef.current.style.transform = `scaleX(${progress})`;
    }
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translateX(${progress * 100}%)`;
    }
    if (timeLabelRef.current) {
      timeLabelRef.current.textContent = formatTime(pos);
    }
  }, [getPositionMs]);

  useEffect(() => {
    durationRef.current = duration > 0 ? duration : 0;
    renderProgress();
  }, [duration, renderProgress]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    renderProgress();
  }, [isPaused, renderProgress]);

  useEffect(() => {
    renderProgress();
  }, [currentTrack?.id, renderProgress]);

  // Drive progress from the pop-out's own window: pipWindow.requestAnimationFrame while visible,
  // with a pipWindow.setInterval fallback of 500ms. Reads position from shared clock each tick.
  useEffect(() => {
    const targetWin =
      pipWindowProp ??
      pipContext?.pipWindow ??
      (fillRef.current?.ownerDocument?.defaultView as Window | null) ??
      (typeof window !== "undefined" ? window : null);

    if (!targetWin) return;

    let animId: number | null = null;
    let fallbackIntervalId: ReturnType<typeof setInterval> | null = null;

    const stopRaf = () => {
      if (animId !== null && typeof targetWin.cancelAnimationFrame === "function") {
        targetWin.cancelAnimationFrame(animId);
        animId = null;
      }
    };

    const stopInterval = () => {
      if (fallbackIntervalId !== null && typeof targetWin.clearInterval === "function") {
        targetWin.clearInterval(fallbackIntervalId);
        fallbackIntervalId = null;
      }
    };

    const tick = () => {
      if (!isPausedRef.current) {
        renderProgress();
      }
    };

    const startRaf = () => {
      stopRaf();
      const loop = () => {
        tick();
        if (typeof targetWin.requestAnimationFrame === "function") {
          animId = targetWin.requestAnimationFrame(loop);
        }
      };
      if (typeof targetWin.requestAnimationFrame === "function") {
        animId = targetWin.requestAnimationFrame(loop);
      }
    };

    const startInterval = () => {
      stopInterval();
      if (typeof targetWin.setInterval === "function") {
        fallbackIntervalId = targetWin.setInterval(tick, 500);
      }
    };

    const syncScheduling = () => {
      const isVisible = !targetWin.document?.hidden;
      if (isVisible && typeof targetWin.requestAnimationFrame === "function") {
        startRaf();
      } else {
        stopRaf();
      }
    };

    startInterval();
    syncScheduling();

    const handleVisibilityChange = () => {
      syncScheduling();
      renderProgress();
    };

    targetWin.document?.addEventListener?.("visibilitychange", handleVisibilityChange);

    return () => {
      stopRaf();
      stopInterval();
      targetWin.document?.removeEventListener?.("visibilitychange", handleVisibilityChange);
    };
  }, [pipWindowProp, pipContext?.pipWindow, renderProgress]);

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetMs = Math.round(ratio * durationRef.current);
      if (onDragSeek) {
        onDragSeek(targetMs);
      }
      onSeek(targetMs);
      renderProgress();
    },
    [onSeek, onDragSeek, renderProgress]
  );

  const artUrl =
    currentTrack?.album?.images?.[0]?.url ||
    (typeof currentTrack?.album?.images?.[0] === "string" ? currentTrack.album.images[0] : null) ||
    "/icons/app/icon-512.png";

  const artistName = currentTrack?.artists
    ? currentTrack.artists.map((a: { name: string }) => a.name).join(", ")
    : "Unknown Artist";

  return (
    <div className="w-full h-full min-h-screen bg-[var(--color-bg)] text-[var(--color-dark)] flex flex-col justify-between p-4 box-border select-none overflow-hidden font-sans">
      {/* Top Bar: Title & Heart */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-hidden flex-1">
          <span className="text-[var(--color-vibrant)] text-meta">♥</span>
          <span className="font-pixel text-caption font-bold text-[var(--color-dark)] truncate">
            MINI_PLAYER.EXE
          </span>
        </div>
        <button
          onClick={toggleSaveTrack}
          className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-title transition-transform hover:scale-110 active:scale-95 shrink-0"
          title={isSaved ? "Remove from Library" : "Save to Library"}
          aria-label={isSaved ? "Remove from Library" : "Save to Library"}
        >
          {isSaved ? (
            <span className="text-[var(--color-vibrant)]">♥</span>
          ) : (
            <span className="text-[var(--color-dark)] hover:text-[var(--color-vibrant)]">♡</span>
          )}
        </button>
      </div>

      {/* Middle: Artwork, Title, Artist */}
      <div className="flex flex-col items-center justify-center flex-1 my-2 overflow-hidden">
        {/* Spinning Vinyl Cover */}
        <div className="relative w-40 h-40 max-w-[45vw] max-h-[45vw] aspect-square rounded-full border-4 border-white shadow-[0_8px_20px_var(--color-muted)] overflow-hidden flex items-center justify-center bg-[var(--color-light)]">
          <img
            src={artUrl}
            alt="Album Artwork"
            className={`w-full h-full object-cover origin-center ${
              !isPaused ? "animate-[spin_10s_linear_infinite]" : ""
            }`}
          />
          <div className="absolute w-8 h-8 bg-white rounded-full border-2 border-[var(--color-muted)] shadow-inner" />
        </div>

        {/* Track Metadata */}
        <div className="w-full text-center mt-3 px-2 overflow-hidden">
          <div
            className="font-pixel text-body font-bold text-[var(--color-dark)] truncate"
            title={currentTrack?.name || "No track playing"}
          >
            {currentTrack?.name || "No track playing"}
          </div>
          <div
            className="font-pixel text-caption text-[var(--color-text-muted)] truncate mt-0.5"
            title={artistName}
          >
            {artistName}
          </div>
        </div>
      </div>

      {/* Bottom: Progress Bar & Controls */}
      <div className="flex flex-col gap-2 shrink-0">
        {/* Progress Bar Container */}
        <div className="w-full flex flex-col gap-1">
          <div
            onClick={handleBarClick}
            className="w-full h-8 min-h-[32px] flex items-center cursor-pointer relative group"
            role="slider"
            aria-label="Playback progress"
            aria-valuemin={0}
            aria-valuemax={durationRef.current}
            tabIndex={0}
          >
            <div className="w-full h-2.5 bg-[var(--color-muted)] rounded-full overflow-hidden relative">
              <div
                ref={fillRef}
                className="h-full bg-[var(--color-vibrant)] origin-left rounded-full will-change-transform"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
            <div
              ref={thumbRef}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 pointer-events-none will-change-transform"
              style={{ transform: "translateX(0%)" }}
            >
              <img
                src="/hampter/hello_kitty_pin.png"
                alt=""
                className="w-6 h-6 object-contain drop-shadow"
              />
            </div>
          </div>
          <div className="flex justify-between w-full font-pixel text-caption text-[var(--color-dark)] px-0.5">
            <span ref={timeLabelRef}>0:00</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center justify-center gap-4 py-1">
          <button
            onClick={prevTrack}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-[var(--color-dark)] hover:text-[var(--color-vibrant)] hover:scale-110 active:scale-95 transition-all disabled:opacity-40"
            disabled={!isReady && !token}
            aria-label="Previous track"
            title="Previous"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-[var(--on-vibrant)] bg-[var(--color-vibrant)] hover:scale-110 active:scale-95 transition-all shadow-[0_4px_12px_var(--color-vibrant)] disabled:opacity-40"
            disabled={!isReady && !token && isPremium}
            aria-label={isPaused ? "Play" : "Pause"}
            title={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? (
              <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>

          <button
            onClick={nextTrack}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-[var(--color-dark)] hover:text-[var(--color-vibrant)] hover:scale-110 active:scale-95 transition-all disabled:opacity-40"
            disabled={!isReady && !token}
            aria-label="Next track"
            title="Next"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
