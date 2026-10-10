import React, { useState } from 'react';
import { CloseIcon } from '../icons';

export interface SyncOffsetControlProps {
  trackId: string | null;
  offsetMs: number;
  onOffsetChange: (newOffset: number) => void;
  onResync: () => void;
  sessionSecret: string;
  onSessionSecretChange: (secret: string) => void;
}

export function SyncOffsetControl({
  trackId,
  offsetMs,
  onOffsetChange,
  onResync,
  sessionSecret,
  onSessionSecretChange,
}: SyncOffsetControlProps) {
  const [isSecretModalOpen, setIsSecretModalOpen] = useState<boolean>(false);
  const [secretInput, setSecretInput] = useState<string>('');
  const [secretError, setSecretError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleDecrease = () => {
    const next = Math.max(-5000, offsetMs - 100);
    onOffsetChange(next);
    onResync();
  };

  const handleIncrease = () => {
    const next = Math.min(5000, offsetMs + 100);
    onOffsetChange(next);
    onResync();
  };

  const saveOffsetWithSecret = async (secret: string) => {
    if (!trackId) return;
    setIsSaving(true);
    setSecretError(null);

    try {
      const res = await fetch('/api/lyrics', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-scrapbook-secret': secret,
        },
        body: JSON.stringify({
          trackId,
          offsetMs,
        }),
      });

      if (res.status === 401) {
        setSecretError('Invalid Admin Secret.');
        setIsSecretModalOpen(true);
        setIsSaving(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSecretError(errData.error || 'Failed to save offset.');
        setIsSaving(false);
        return;
      }

      onSessionSecretChange(secret);
      setIsSecretModalOpen(false);
      setSecretInput('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: unknown) {
      setSecretError(e instanceof Error ? e.message : 'Network error.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!trackId) return;
    if (sessionSecret) {
      saveOffsetWithSecret(sessionSecret);
    } else {
      setSecretError(null);
      setIsSecretModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 bg-white/90 border border-[var(--color-dark)]/40 rounded-full px-2 py-0.5 shadow-xs">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={offsetMs <= -5000}
          className="font-pixel text-caption font-bold px-1.5 py-0.5 rounded hover:bg-[var(--color-light)] text-[var(--color-dark)] transition-colors active:scale-95 disabled:opacity-40"
          title="Minus 100ms"
        >
          -100ms
        </button>
        <span
          className="font-mono text-caption font-bold text-[var(--color-dark)] min-w-[52px] text-center select-none"
          title="Current lyric offset"
        >
          {offsetMs > 0 ? `+${offsetMs}ms` : `${offsetMs}ms`}
        </span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={offsetMs >= 5000}
          className="font-pixel text-caption font-bold px-1.5 py-0.5 rounded hover:bg-[var(--color-light)] text-[var(--color-dark)] transition-colors active:scale-95 disabled:opacity-40"
          title="Plus 100ms"
        >
          +100ms
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          className="font-pixel text-caption font-bold px-2 py-0.5 ml-1 rounded-full border border-[var(--color-dark)] bg-[var(--color-light)] text-[var(--color-dark)] hover:bg-[var(--color-muted)]/40 transition-all active:scale-95 disabled:opacity-50"
          title="Save sync offset to database"
        >
          {isSaving ? '...' : saveSuccess ? '✓' : 'Save'}
        </button>
      </div>

      {isSecretModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[var(--color-bg)] border-4 border-[var(--color-dark)] rounded-2xl shadow-[6px_6px_0_var(--color-dark)] p-5 flex flex-col gap-3 text-[var(--color-dark)]">
            <div className="flex items-center justify-between border-b-2 border-[var(--color-muted)] pb-2">
              <h3 className="font-pixel text-body font-bold text-[var(--color-dark)] flex items-center gap-1.5">
                <span>🔒</span> ADMIN SECRET
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsSecretModalOpen(false);
                  setSecretError(null);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[var(--color-muted)] hover:bg-[var(--color-vibrant)] hover:text-white"
                aria-label="Close modal"
              >
                <CloseIcon size={12} />
              </button>
            </div>

            <p className="font-pixel text-meta text-[var(--color-dark)]/70">
              Enter admin secret to save offset ({offsetMs > 0 ? `+${offsetMs}ms` : `${offsetMs}ms`}).
            </p>

            <input
              type="password"
              placeholder="Enter admin secret..."
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && secretInput) saveOffsetWithSecret(secretInput);
              }}
              className="w-full font-pixel text-meta p-2.5 border-2 border-[var(--color-dark)] rounded-xl outline-none focus:bg-[var(--color-light)]"
              autoFocus
            />

            {secretError && (
              <div className="font-pixel text-meta text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                {secretError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSecretModalOpen(false);
                  setSecretError(null);
                }}
                className="font-pixel text-meta px-3 py-1.5 rounded-xl border-2 border-[var(--color-dark)] bg-white text-[var(--color-dark)] hover:bg-gray-50 active:scale-95"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => saveOffsetWithSecret(secretInput)}
                disabled={isSaving || !secretInput}
                className="font-pixel text-meta px-4 py-1.5 rounded-xl border-2 border-[var(--color-dark)] bg-[var(--color-light)] text-[var(--color-dark)] font-bold shadow-[2px_2px_0_var(--color-dark)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'SAVING...' : '✓ SAVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
