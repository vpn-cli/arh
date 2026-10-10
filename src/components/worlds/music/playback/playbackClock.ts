"use client";

let trackStartTime = Date.now();
let pausedDuration = 0;
let pauseTimestamp: number | null = null;

export function getSharedPositionMs(): number {
  return Math.max(
    0,
    (pauseTimestamp ?? Date.now()) - trackStartTime - pausedDuration
  );
}

export function updateSharedPlaybackState(positionMs: number, paused: boolean): void {
  trackStartTime = Date.now() - positionMs;
  pausedDuration = 0;
  pauseTimestamp = paused ? Date.now() : null;
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
