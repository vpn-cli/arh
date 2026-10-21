"use client";

let trackStartTime = Date.now();
let pausedDuration = 0;
let pauseTimestamp: number | null = null;
let currentDurationMs: number | null = null;

export function getSharedPositionMs(): number {
  const elapsed = Math.max(0, (pauseTimestamp ?? Date.now()) - trackStartTime - pausedDuration);
  return currentDurationMs && currentDurationMs > 0 ? Math.min(elapsed, currentDurationMs) : elapsed;
}

export function updateSharedPlaybackState(positionMs: number, paused: boolean, durationMs?: number): void {
  trackStartTime = Date.now() - positionMs;
  pausedDuration = 0;
  pauseTimestamp = paused ? Date.now() : null;
  if (typeof durationMs === "number") currentDurationMs = durationMs > 0 ? durationMs : null;
}

export function seekSharedClock(targetMs: number): void {
  trackStartTime = Date.now() - targetMs - pausedDuration;
}

export function setSharedPaused(paused: boolean): void {
  if (paused) {
    if (!pauseTimestamp) {
      pauseTimestamp = Date.now();
    }
  } else {
    if (pauseTimestamp) {
      pausedDuration += Date.now() - pauseTimestamp;
      pauseTimestamp = null;
    }
  }
}

export const playbackClock = {
  getPositionMs: getSharedPositionMs,
  sync: updateSharedPlaybackState,
  seek: seekSharedClock,
  pause: () => setSharedPaused(true),
  resume: () => setSharedPaused(false),
};

