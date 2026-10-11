"use client";

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useSpotifyPlayer } from '@/providers/SpotifyPlayerProvider';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { usePlayerVolumeStore, DEFAULT_VOLUME } from '@/providers/volumeStore';
import { SpeakerIcon } from '../icons';
import './now-playing.css';

export interface VolumeControlProps {
  className?: string;
}

export const VolumeControl = memo(function VolumeControl({
  className = '',
}: VolumeControlProps) {
  const isReady = useSpotifyPlayerStore((s) => s.isReady);
  const { player: providerPlayer } = useSpotifyPlayer();
  const storePlayer = useSpotifyPlayerStore((s) => s.player);
  const player = providerPlayer || storePlayer;
  const storeVolume = usePlayerVolumeStore((s) => s.volume);

  const [localVolume, setLocalVolume] = useState(storeVolume);
  const isDraggingRef = useRef(false);
  const latestLocalVolumeRef = useRef(storeVolume);
  latestLocalVolumeRef.current = localVolume;

  const rafIdRef = useRef<number | null>(null);
  const pendingVolumeRef = useRef<number>(storeVolume);

  // Sync local display volume when store updates outside of active dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalVolume(storeVolume);
      pendingVolumeRef.current = storeVolume;
    }
  }, [storeVolume]);

  const applyVolumeToPlayer = useCallback(
    (vol: number) => {
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(vol).catch((err: unknown) => {
          console.warn('[Spotify SDK] setVolume error:', err);
        });
      }
    },
    [player]
  );

  const schedulePlayerVolumeUpdate = useCallback(
    (vol: number) => {
      pendingVolumeRef.current = vol;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          applyVolumeToPlayer(pendingVolumeRef.current);
        });
      }
    },
    [applyVolumeToPlayer]
  );

  const commitVolume = useCallback(
    (finalVolume: number) => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      applyVolumeToPlayer(finalVolume);
      usePlayerVolumeStore.getState().setVolume(finalVolume);
      if (finalVolume > 0) {
        usePlayerVolumeStore.getState().setPreviousVolume(finalVolume);
      }
    },
    [applyVolumeToPlayer]
  );

  // Release drag if pointer up happens anywhere on the window
  useEffect(() => {
    const handlePointerUpWindow = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        commitVolume(latestLocalVolumeRef.current);
      }
    };

    window.addEventListener('pointerup', handlePointerUpWindow);
    window.addEventListener('pointercancel', handlePointerUpWindow);

    return () => {
      window.removeEventListener('pointerup', handlePointerUpWindow);
      window.removeEventListener('pointercancel', handlePointerUpWindow);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [commitVolume]);

  const handlePointerDown = () => {
    if (!isReady) return;
    isDraggingRef.current = true;
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      commitVolume(latestLocalVolumeRef.current);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setLocalVolume(val);

    if (isDraggingRef.current) {
      schedulePlayerVolumeUpdate(val);
    } else {
      commitVolume(val);
    }
  };

  const handleToggleMute = useCallback(() => {
    if (!isReady) return;
    const store = usePlayerVolumeStore.getState();
    const currentVol = store.volume;
    const prevVol = store.previousVolume;

    if (currentVol > 0) {
      store.setPreviousVolume(currentVol);
      store.setVolume(0);
      setLocalVolume(0);
      applyVolumeToPlayer(0);
    } else {
      const restored = prevVol > 0 ? prevVol : DEFAULT_VOLUME;
      store.setVolume(restored);
      setLocalVolume(restored);
      applyVolumeToPlayer(restored);
    }
  }, [isReady, applyVolumeToPlayer]);

  const percent = Math.round(localVolume * 100);

  return (
    <div
      className={`mw-volume-control flex items-center gap-2 px-2 h-7 select-none shrink-0 ${className}`}
      role="group"
      aria-label="Volume controls"
    >
      <button
        type="button"
        onClick={handleToggleMute}
        disabled={!isReady}
        aria-label={localVolume === 0 ? 'Unmute' : 'Mute'}
        title={localVolume === 0 ? 'Unmute' : 'Mute'}
        className="w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <SpeakerIcon volume={localVolume} size={15} />
      </button>

      <label htmlFor="now-playing-volume-slider" className="sr-only">
        Volume
      </label>
      <input
        id="now-playing-volume-slider"
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        disabled={!isReady}
        onChange={handleChange}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        className="volume-slider w-full cursor-pointer"
        style={
          {
            '--volume-percent': `${percent}%`,
          } as React.CSSProperties
        }
      />
    </div>
  );
});

VolumeControl.displayName = 'VolumeControl';
