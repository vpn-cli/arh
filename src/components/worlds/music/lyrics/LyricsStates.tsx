import React, { useState } from 'react';
import { hasRangeTimestamps, attachEstimatedWordTimings } from '@/lib/lyrics';
import { LyricsData, setCachedLyrics } from './useLyrics';

export function LyricsLoadingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20 text-[var(--color-text-muted)]">
      <div className="w-3/4 h-6 bg-[var(--color-muted)] rounded animate-pulse" />
      <div className="w-1/2 h-6 bg-[var(--color-muted)] rounded animate-pulse" />
      <div className="w-5/6 h-6 bg-[var(--color-muted)] rounded animate-pulse" />
    </div>
  );
}

export function LyricsInstrumentalView({
  editMode,
  onAddLyrics,
}: {
  editMode: boolean;
  onAddLyrics: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4 select-none min-h-[300px]">
      <div className="w-20 h-20 rounded-full bg-[var(--color-light)] border-2 border-[var(--color-muted)] flex items-center justify-center text-display shadow-inner mb-4 text-[var(--color-vibrant)]">
        ♫
      </div>
      <div className="font-pixel text-caption font-bold text-[var(--color-vibrant)] bg-[var(--color-light)] px-3 py-1 rounded-full border border-[var(--color-muted)] mb-3 shadow-xs">
        INSTRUMENTAL
      </div>
      <h4 className="font-pixel text-title sm:text-title font-bold text-[var(--color-dark)] mb-1">
        This track is an instrumental
      </h4>
      <p className="font-pixel text-caption text-[var(--color-text-muted)] max-w-xs">
        No lyrics needed — just enjoy the melody ✨
      </p>
      {editMode && (
        <button
          onClick={onAddLyrics}
          className="mt-6 border-2 border-[var(--color-dark)] px-4 py-2 font-pixel text-caption font-bold shadow-[2px_2px_0_var(--color-dark)] hover:-translate-y-0.5 transition-all bg-[var(--color-light)] text-[var(--color-dark)] active:scale-95"
        >
          + ADD LYRICS (EDIT MODE)
        </button>
      )}
    </div>
  );
}

export function LyricsPlainView({
  plain,
  editMode,
  trackId,
  durationMs,
  sessionSecret,
  onSessionSecretChange,
  onAddLyrics,
  onSaveSuccess,
}: {
  plain: string;
  editMode: boolean;
  trackId?: string | null;
  durationMs?: number;
  sessionSecret?: string;
  onSessionSecretChange?: (secret: string) => void;
  onAddLyrics: () => void;
  onSaveSuccess?: (data: LyricsData) => void;
}) {
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const canConvert = hasRangeTimestamps(plain);

  const handleConvertTimestamps = async () => {
    if (!trackId) return;
    let secret = sessionSecret;
    if (!secret) {
      const input = window.prompt('Enter Admin Secret to convert timestamps:');
      if (!input) return;
      secret = input;
      onSessionSecretChange?.(input);
    }

    setIsConverting(true);
    setConvertError(null);

    try {
      const res = await fetch('/api/lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scrapbook-secret': secret,
        },
        body: JSON.stringify({
          trackId,
          lyrics: plain,
          durationMs,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setConvertError(err.error || 'Failed to convert timestamps');
        setIsConverting(false);
        return;
      }

      const data: LyricsData = await res.json();
      if (data.synced) {
        data.synced = attachEstimatedWordTimings(data.synced);
      }
      setCachedLyrics(trackId, data);
      onSaveSuccess?.(data);
    } catch (e: unknown) {
      setConvertError(e instanceof Error ? e.message : 'Error converting timestamps');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="font-pixel font-bold text-body sm:text-title md:text-title text-[var(--color-dark)] whitespace-pre-wrap leading-relaxed opacity-75 text-center py-8 max-w-[640px] mx-auto select-text">
      <div className="mb-6 font-pixel text-caption font-bold text-[var(--color-vibrant)] bg-[var(--color-light)] inline-block px-3 py-1 rounded-full border border-[var(--color-muted)] shadow-xs">
        NOT SYNCED
      </div>
      <br />
      {plain}
      {editMode && (
        <div className="mt-8 pt-6 border-t border-[var(--color-muted)]/50 flex flex-wrap items-center justify-center gap-3">
          {canConvert && (
            <button
              onClick={handleConvertTimestamps}
              disabled={isConverting}
              className="font-pixel text-caption px-4 py-2 rounded-full border-2 border-[var(--color-dark)] bg-[var(--color-vibrant)] text-[var(--on-vibrant)] font-bold shadow-[2px_2px_0_var(--color-dark)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {isConverting ? 'CONVERTING...' : '⚡ Convert timestamps'}
            </button>
          )}
          <button
            onClick={onAddLyrics}
            className="font-pixel text-caption px-4 py-2 rounded-full border-2 border-[var(--color-dark)] bg-[var(--color-light)] text-[var(--color-dark)] font-bold shadow-[2px_2px_0_var(--color-dark)] hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            + Paste Synced LRC (Edit Mode)
          </button>
          {convertError && (
            <div className="w-full text-caption text-red-600 font-bold mt-2">
              {convertError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LyricsNotFoundView({
  trackName,
  artistName,
  albumArt,
  editMode,
  onAddLyrics,
}: {
  trackName?: string;
  artistName?: string;
  albumArt?: string | null;
  editMode: boolean;
  onAddLyrics: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 select-none min-h-[300px]">
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-3 border-[var(--color-dark)] shadow-[4px_4px_0_var(--color-dark)] mb-4 bg-[var(--color-light)]">
        <img
          src={albumArt || '/soundscape_ref/finalui.png'}
          alt={trackName || 'Album Art'}
          className="w-full h-full object-cover"
        />
      </div>
      <h4
        className="font-pixel text-body sm:text-title font-bold text-[var(--color-dark)] mb-0.5 max-w-xs truncate"
        title={trackName}
      >
        {trackName || 'Unknown Track'}
      </h4>
      <p className="font-pixel text-caption text-[var(--color-text-muted)] mb-3 max-w-xs truncate">
        {artistName || 'Unknown Artist'}
      </p>
      <div className="flex flex-col items-center gap-1 mb-5">
        <div className="text-heading text-[var(--color-dark)]">ʕ•́ᴥ•̀ʔっ</div>
        <span className="font-pixel text-caption text-[var(--color-text-muted)] font-bold">
          No lyrics found for this track
        </span>
      </div>
      {editMode && (
        <button
          onClick={onAddLyrics}
          className="border-3 border-[var(--color-dark)] px-5 py-2.5 font-pixel text-caption font-bold shadow-[3px_3px_0_var(--color-dark)] hover:-translate-y-0.5 hover:shadow-[3px_5px_0_var(--color-dark)] transition-all bg-[var(--color-light)] text-[var(--color-dark)] active:scale-95"
        >
          + ADD LYRICS
        </button>
      )}
    </div>
  );
}
