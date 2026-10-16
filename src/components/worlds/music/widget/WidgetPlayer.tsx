"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { useSpotifySession, useTrackSavedStatus, useSpotifyMutations } from "@/hooks/useSpotify";
import { getSharedPositionMs } from "../playback/playbackClock";
import {
  togglePlayGlobal,
  nextTrackGlobal,
  prevTrackGlobal,
  seekGlobal,
} from "../playback/globalPlaybackActions";
import { formatTime } from "../playback/playbackHelpers";
import { useMusicView, isStandaloneMode } from "../hooks/useMusicView";
import { PaletteBackground } from "../palette/PaletteBackground";
import { LikeButton } from "../LikeButton";

export function WidgetPlayer() {
  const { expandToFull } = useMusicView();
  const { data: sessionData } = useSpotifySession();
  const token = sessionData?.accessToken || null;

  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);
  const duration = useSpotifyPlayerStore((s) => s.duration);
  const accountTier = useSpotifyPlayerStore((s) => s.accountTier);

  const isLoading = accountTier === 'unknown';
  const isFree = accountTier === 'free';

  const { data: isSaved = false } = useTrackSavedStatus(currentTrack?.id);
  const { toggleSave } = useSpotifyMutations();

  const fillRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const barTrackRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef(duration > 0 ? duration : 0);
  const isPausedRef = useRef(isPaused);
  const hasResizedRef = useRef(false);
  const [isWidgetSized, setIsWidgetSized] = React.useState(false);

  // Measure window size and update isWidgetSized (within tolerance of documented 440x210)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSize = () => {
      const isAboutWidget = window.innerWidth <= 520 && window.innerHeight <= 260;
      setIsWidgetSized(isAboutWidget);
    };

    checkSize();
    window.addEventListener("resize", checkSize);

    // Standalone window: call resizeTo(440, 210) on initial mount of widget view
    if (!hasResizedRef.current && isStandaloneMode()) {
      hasResizedRef.current = true;
      try {
        window.resizeTo(440, 210);
      } catch {
        // Silently skip if resizing is not permitted
      }
      setTimeout(checkSize, 100);
    }

    return () => {
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  useEffect(() => {
    durationRef.current = duration > 0 ? duration : 0;
  }, [duration]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Position never goes in React state. Direct DOM transform & textContent update.
  const renderProgress = useCallback(() => {
    const pos = getSharedPositionMs();
    const dur = durationRef.current;
    const progress = dur > 0 ? Math.min(1, Math.max(0, pos / dur)) : 0;

    if (fillRef.current) {
      fillRef.current.style.transform = `scaleX(${progress})`;
    }
    if (timeLabelRef.current) {
      timeLabelRef.current.textContent = formatTime(pos);
    }
  }, []);

  // Dual loop: RAF + setInterval fallback (250ms) ensures progress updates keep running
  // even when window is small, partly covered, or backgrounded.
  useEffect(() => {
    if (isFree || isLoading) return;

    let animId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (!isPausedRef.current) {
        renderProgress();
      }
    };

    const loop = () => {
      tick();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    intervalId = setInterval(tick, 250);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [renderProgress, isFree, isLoading]);

  // Handle click or drag seek on progress bar
  const seekToClientX = useCallback(
    (clientX: number) => {
      const bar = barTrackRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetMs = Math.round(ratio * durationRef.current);
      seekGlobal(targetMs);
      renderProgress();
    },
    [renderProgress]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      seekToClientX(e.clientX);

      const onMouseMove = (moveEvent: MouseEvent) => {
        seekToClientX(moveEvent.clientX);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [seekToClientX]
  );

  const handleToggleLike = useCallback(async () => {
    if (!token || !currentTrack?.id) return;
    try {
      await toggleSave.mutateAsync({
        trackId: currentTrack.id,
        isSaved: Boolean(isSaved),
      });
    } catch (err) {
      console.error("[WidgetPlayer] toggleLike error:", err);
    }
  }, [token, currentTrack?.id, toggleSave, isSaved]);

  const artUrl =
    currentTrack?.album?.images?.[0]?.url ||
    (typeof currentTrack?.album?.images?.[0] === "string" ? currentTrack.album.images[0] : null) ||
    "/icons/app/icon-512.png";

  const artistName = currentTrack?.artists
    ? currentTrack.artists.map((a: { name: string }) => a.name).join(", ")
    : "Select music in full app";

  return (
    <div
      className={
        isWidgetSized
          ? "w-screen h-screen overflow-hidden bg-[var(--color-bg)] flex box-border"
          : "min-h-screen w-full bg-[var(--color-light)] flex items-center justify-center p-4 selection:bg-[var(--color-muted)]/40 box-border"
      }
    >
      <PaletteBackground currentTrack={currentTrack} />

      {/* Main Widget Card */}
      <div
        className={`app-region-drag relative bg-[var(--color-bg)] border-2 border-[var(--color-muted)] rounded-[24px] p-3.5 flex gap-3.5 overflow-hidden box-border select-none shadow-md ${
          isWidgetSized ? "w-full h-full" : "w-full max-w-[440px] h-[210px]"
        }`}
        style={{
          paddingTop: isWidgetSized
            ? "max(0.875rem, env(titlebar-area-height, 0px))"
            : "0.875rem",
        }}
      >
        {/* Left: Album Artwork (rounded square, full card height minus padding) */}
        <div className="h-full aspect-square max-w-[42%] shrink-0 rounded-2xl border-2 border-[var(--color-muted)] overflow-hidden bg-[var(--color-light)] flex items-center justify-center relative shadow-xs">
          <img
            src={artUrl}
            alt={currentTrack?.album?.name || "Album Artwork"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between overflow-hidden">
          {/* Top: Title & Artist + Expand Button */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex-1 min-w-0">
              <div
                className="font-pixel text-title font-bold text-[var(--color-dark)] truncate leading-tight"
                title={currentTrack?.name || (!token ? "NOT SIGNED IN" : "No track loaded")}
              >
                {!token ? "NOT SIGNED IN" : currentTrack?.name || "No track loaded"}
              </div>
              <div
                className="font-pixel text-meta text-[var(--color-text-muted)] truncate leading-tight mt-0.5"
                title={!token ? "Open the full app to sign in" : artistName}
              >
                {!token ? "Open the full app to sign in" : artistName}
              </div>
            </div>

            <button
              onClick={expandToFull}
              className="mw-btn app-region-no-drag w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full hover:bg-[var(--color-muted)]/40 text-[var(--color-dark)] hover:text-[var(--color-vibrant)] transition-all shrink-0 cursor-pointer"
              title="Expand to full player"
              aria-label="Expand to full player"
            >
              <svg
                className="w-3.5 h-3.5 stroke-current fill-none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            </button>
          </div>

          {!token ? (
            /* Signed-out state: show message and button that expands to full view */
            <div className="flex items-center pt-2">
              <button
                onClick={expandToFull}
                className="mw-btn app-region-no-drag inline-flex items-center gap-2 rounded-full bg-[var(--color-vibrant)] px-4 py-1.5 font-pixel text-body font-bold text-[var(--on-vibrant)] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-meta">↗</span>
                <span>Open Full App</span>
              </button>
            </div>
          ) : (
            <>
              {/* Middle: Controls (at least 36px targets) + Like Button */}
              <div className="flex items-center gap-2 py-0.5">
                <button
                  onClick={prevTrackGlobal}
                  className="mw-btn app-region-no-drag w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-[var(--color-dark)] hover:text-[var(--color-vibrant)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  aria-label="Previous track"
                  title="Previous"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button
                  onClick={togglePlayGlobal}
                  disabled={isLoading}
                  className={`mw-btn app-region-no-drag w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[var(--on-vibrant)] ${
                    isFree ? "bg-[#1DB954]" : "bg-[var(--color-vibrant)]"
                  } hover:scale-105 active:scale-95 transition-all shadow-md ${
                    isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  aria-label={
                    isLoading
                      ? "Loading player"
                      : isFree
                      ? "Open in Spotify"
                      : isPaused
                      ? "Play"
                      : "Pause"
                  }
                  title={
                    isLoading
                      ? "Loading player"
                      : isFree
                      ? "Open in Spotify"
                      : isPaused
                      ? "Play"
                      : "Pause"
                  }
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFree ? (
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : isPaused ? (
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={nextTrackGlobal}
                  className="mw-btn app-region-no-drag w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-[var(--color-dark)] hover:text-[var(--color-vibrant)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  aria-label="Next track"
                  title="Next"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                <LikeButton
                  isSaved={Boolean(isSaved)}
                  onToggle={handleToggleLike}
                  className="mw-btn app-region-no-drag w-9 h-9 min-w-[36px] min-h-[36px] rounded-full ml-auto"
                />
              </div>

              {/* Bottom: Slim Progress Bar with Elapsed and Total Time */}
              {!isFree && (
                <div
                  ref={barTrackRef}
                  onMouseDown={handleMouseDown}
                  className="app-region-no-drag w-full flex flex-col gap-1 cursor-pointer select-none group py-1"
                  role="slider"
                  aria-label="Playback progress"
                  aria-valuemin={0}
                  aria-valuemax={durationRef.current}
                  tabIndex={0}
                >
                  <div className="w-full h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden relative">
                    <div
                      ref={fillRef}
                      className="h-full bg-[var(--color-vibrant)] origin-left rounded-full will-change-transform"
                      style={{ transform: "scaleX(0)" }}
                    />
                  </div>
                  <div className="flex justify-between w-full font-pixel text-caption text-[var(--color-dark)] px-0.5 leading-none">
                    <span ref={timeLabelRef}>0:00</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
