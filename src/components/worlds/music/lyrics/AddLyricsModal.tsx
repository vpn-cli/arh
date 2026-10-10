import React, { useState, useEffect } from 'react';
import { attachEstimatedWordTimings } from '@/lib/lyrics';
import { LyricsData, setCachedLyrics } from './useLyrics';
import { CloseIcon } from '../icons';

export interface AddLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string | null;
  trackName?: string;
  artistName?: string;
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
  initialLyrics = '',
  sessionSecret,
  onSessionSecretChange,
  onSaveSuccess,
}: AddLyricsModalProps) {
  const [manualLyricsInput, setManualLyricsInput] = useState<string>(initialLyrics);
  const [manualSecretInput, setManualSecretInput] = useState<string>('');
  const [isSavingLyrics, setIsSavingLyrics] = useState<boolean>(false);
  const [saveLyricsError, setSaveLyricsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setManualLyricsInput(initialLyrics);
      setSaveLyricsError(null);
    }
  }, [isOpen, initialLyrics]);

  if (!isOpen) return null;

  const handleSaveManualLyrics = async () => {
    if (!trackId) return;
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
    } catch (e: any) {
      setSaveLyricsError(e?.message || 'An error occurred.');
    } finally {
      setIsSavingLyrics(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[var(--color-bg)] border-4 border-[var(--color-dark)] rounded-2xl shadow-[6px_6px_0_var(--color-dark)] p-6 flex flex-col gap-4 text-[var(--color-dark)]">
        <div className="flex items-center justify-between border-b-2 border-[var(--color-muted)] pb-3">
          <div>
            <h3 className="font-pixel text-base font-bold text-[var(--color-dark)] flex items-center gap-2">
              <span>✍</span> ADD LYRICS (EDIT MODE)
            </h3>
            <p className="font-pixel text-xs text-[var(--color-dark)]/70 truncate mt-0.5">
              {trackName} — {artistName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-[var(--color-muted)] hover:bg-[var(--color-vibrant)] hover:text-white"
            aria-label="Close modal"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-xs font-bold text-[var(--color-dark)]">
            Lyrics (Paste LRC with timestamps or plain text):
          </label>
          <textarea
            rows={10}
            value={manualLyricsInput}
            onChange={(e) => setManualLyricsInput(e.target.value)}
            placeholder={`[00:12.34] Line one with timestamp\n[00:15.67] Line two\n\n...or just paste plain lyrics text.`}
            className="w-full font-mono text-xs p-3 border-2 border-[var(--color-dark)] rounded-xl outline-none focus:bg-[var(--color-light)] resize-y"
          />
        </div>

        {!sessionSecret && (
          <div className="flex flex-col gap-1.5">
            <label className="font-pixel text-xs font-bold text-[var(--color-dark)]">
              Admin Secret:
            </label>
            <input
              type="password"
              placeholder="Enter admin secret..."
              value={manualSecretInput}
              onChange={(e) => setManualSecretInput(e.target.value)}
              className="w-full font-pixel text-xs p-2.5 border-2 border-[var(--color-dark)] rounded-xl outline-none focus:bg-[var(--color-light)]"
            />
          </div>
        )}

        {saveLyricsError && (
          <div className="font-pixel text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
            {saveLyricsError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="font-pixel text-xs px-4 py-2 rounded-xl border-2 border-[var(--color-dark)] bg-white text-[var(--color-dark)] hover:bg-gray-50 active:scale-95"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSaveManualLyrics}
            disabled={isSavingLyrics}
            className="font-pixel text-xs px-5 py-2 rounded-xl border-2 border-[var(--color-dark)] bg-[var(--color-light)] text-[var(--color-dark)] font-bold shadow-[2px_2px_0_var(--color-dark)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            {isSavingLyrics ? 'SAVING...' : '✓ SAVE LYRICS'}
          </button>
        </div>
      </div>
    </div>
  );
}
