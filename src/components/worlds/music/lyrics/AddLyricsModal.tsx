import React, { useState, useMemo } from 'react';
import { attachEstimatedWordTimings, detectLyrics } from '@/lib/lyrics';
import { LyricsData, setCachedLyrics } from './useLyrics';
import { CloseIcon } from '../icons';

export interface AddLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string | null;
  trackName?: string;
  artistName?: string;
  durationMs?: number;
  initialLyrics?: string;
  sessionSecret: string;
  onSessionSecretChange: (secret: string) => void;
  onSaveSuccess: (data: LyricsData) => void;
}

export function AddLyricsModal({
  isOpen,
  onClose,
  trackId,
  trackName,
  artistName,
  durationMs,
  initialLyrics = '',
  sessionSecret,
  onSessionSecretChange,
  onSaveSuccess,
}: AddLyricsModalProps) {
  const [manualLyricsInput, setManualLyricsInput] = useState<string>(initialLyrics);
  const [manualSecretInput, setManualSecretInput] = useState<string>('');
  const [isSavingLyrics, setIsSavingLyrics] = useState<boolean>(false);
  const [saveLyricsError, setSaveLyricsError] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialLyrics, setPrevInitialLyrics] = useState(initialLyrics);

  if (isOpen !== prevIsOpen || initialLyrics !== prevInitialLyrics) {
    setPrevIsOpen(isOpen);
    setPrevInitialLyrics(initialLyrics);
    if (isOpen) {
      setManualLyricsInput(initialLyrics);
      setSaveLyricsError(null);
    }
  }

  const detection = useMemo(() => {
    return detectLyrics(manualLyricsInput, durationMs);
  }, [manualLyricsInput, durationMs]);

  if (!isOpen) return null;

  const handleSaveManualLyrics = async (options?: { forcePlain?: boolean }) => {
    if (!trackId) return;
    const forcePlain = Boolean(options?.forcePlain);
    const secretToUse = sessionSecret || manualSecretInput;
    if (!secretToUse) {
      setSaveLyricsError('Admin Secret is required.');
      return;
    }
    if (!manualLyricsInput.trim()) {
      setSaveLyricsError('Please paste some lyrics.');
      return;
    }

    setIsSavingLyrics(true);
    setSaveLyricsError(null);

    try {
      const res = await fetch('/api/lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scrapbook-secret': secretToUse,
        },
        body: JSON.stringify({
          trackId,
          lyrics: manualLyricsInput,
          durationMs,
          forcePlain,
        }),
      });

      if (res.status === 401) {
        setSaveLyricsError('Invalid Admin Secret.');
        setIsSavingLyrics(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSaveLyricsError(errData.error || 'Failed to save lyrics.');
        setIsSavingLyrics(false);
        return;
      }

      const data: LyricsData = await res.json();
      onSessionSecretChange(secretToUse);

      if (data.synced) {
        data.synced = attachEstimatedWordTimings(data.synced);
      }
      setCachedLyrics(trackId, data);
      onSaveSuccess(data);
      onClose();
      setManualLyricsInput('');
    } catch (e: unknown) {
      setSaveLyricsError(e instanceof Error ? e.message : 'An error occurred.');
    } finally {
      setIsSavingLyrics(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[var(--color-bg)] border-4 border-[var(--color-dark)] rounded-2xl shadow-[6px_6px_0_var(--color-dark)] p-6 flex flex-col gap-4 text-[var(--color-dark)]">
        <div className="flex items-center justify-between border-b-2 border-[var(--color-muted)] pb-3">
          <div>
            <h3 className="font-pixel text-body font-bold text-[var(--color-dark)] flex items-center gap-2">
              <span>✍</span> ADD LYRICS (EDIT MODE)
            </h3>
            <p className="font-pixel text-caption text-[var(--color-text-muted)] truncate mt-0.5">
              {trackName} — {artistName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-[var(--color-muted)] hover:bg-[var(--color-vibrant)] hover:text-[var(--on-vibrant)]"
            aria-label="Close modal"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-caption font-bold text-[var(--color-dark)]">
            Lyrics (Paste time-ranges, LRC with timestamps, or plain text):
          </label>
          <textarea
            rows={8}
            value={manualLyricsInput}
            onChange={(e) => setManualLyricsInput(e.target.value)}
            placeholder={`• 0:19 – 0:35 | first line\nsecond line\n\n...or standard LRC [00:12.34], or plain lyrics.`}
            className="w-full font-mono text-caption p-3 border-2 border-[var(--color-dark)] rounded-xl outline-none focus:bg-[var(--color-light)] resize-y"
          />
        </div>

        {/* Format Preview */}
        {manualLyricsInput.trim() && (
          <div className="font-pixel text-caption px-3 py-2 rounded-xl bg-[var(--color-light)] border-2 border-[var(--color-dark)] text-[var(--color-dark)] flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5 truncate">
              <span className="text-[var(--color-vibrant)]">ℹ</span>
              {detection.previewText}
            </span>
            {detection.isValid && detection.type !== 'plain' && (
              <span className="text-meta text-[var(--color-text-muted)] shrink-0 font-bold">
                {detection.type === 'synced_range' ? 'Time-range paste' : 'LRC'}
              </span>
            )}
          </div>
        )}

        {detection.validationError && manualLyricsInput.trim() && (
          <div className="font-pixel text-caption text-amber-900 bg-amber-100 border border-amber-300 p-2.5 rounded-xl">
            ⚠ {detection.validationError}
            <br />
            Saving will preserve this text as plain lyrics.
          </div>
        )}

        {!sessionSecret && (
          <div className="flex flex-col gap-1.5">
            <label className="font-pixel text-caption font-bold text-[var(--color-dark)]">
              Admin Secret:
            </label>
            <input
              type="password"
              placeholder="Enter admin secret..."
              value={manualSecretInput}
              onChange={(e) => setManualSecretInput(e.target.value)}
              className="w-full font-pixel text-caption p-2.5 border-2 border-[var(--color-dark)] rounded-xl outline-none focus:bg-[var(--color-light)]"
            />
          </div>
        )}

        {saveLyricsError && (
          <div className="font-pixel text-caption text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
            {saveLyricsError}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {detection.type !== 'plain' && detection.isValid ? (
            <button
              type="button"
              onClick={() => handleSaveManualLyrics({ forcePlain: true })}
              disabled={isSavingLyrics}
              className="font-pixel text-caption px-3 py-2 rounded-xl border-2 border-[var(--color-dark)] bg-white text-[var(--color-dark)] hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
            >
              Save as plain instead
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="font-pixel text-caption px-4 py-2 rounded-xl border-2 border-[var(--color-dark)] bg-white text-[var(--color-dark)] hover:bg-gray-50 active:scale-95"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={() => handleSaveManualLyrics({ forcePlain: false })}
              disabled={isSavingLyrics}
              className="font-pixel text-caption px-5 py-2 rounded-xl border-2 border-[var(--color-dark)] bg-[var(--color-light)] text-[var(--color-dark)] font-bold shadow-[2px_2px_0_var(--color-dark)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              {isSavingLyrics ? 'SAVING...' : '✓ SAVE LYRICS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
