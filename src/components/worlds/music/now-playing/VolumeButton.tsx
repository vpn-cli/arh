"use client";

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { usePlayerVolumeStore } from '@/providers/volumeStore';
import { SpeakerIcon } from '../icons';
import { VolumeControl } from './VolumeControl';
import './now-playing.css';

export interface VolumeButtonProps {
  className?: string;
}

interface VolumeButtonInnerProps {
  className?: string;
}

const VolumeButtonInner = memo(function VolumeButtonInner({
  className = '',
}: VolumeButtonInnerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const volume = usePlayerVolumeStore((s) => s.volume);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Closes on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: Event) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen]);

  // Closes on Escape; Escape returns focus to the button
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        data-cursor="music"
        onClick={handleToggle}
        aria-label="Volume"
        aria-expanded={isOpen}
        title="Volume"
        className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-all duration-150 ease-in-out shadow-xs font-bold active:scale-95 border ${
          isOpen
            ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] border-[var(--color-vibrant)]'
            : 'border border-[var(--color-muted)] bg-white hover:bg-[var(--color-vibrant)] text-[var(--color-dark)] hover:text-[var(--on-vibrant)]'
        }`}
      >
        <SpeakerIcon volume={volume} size={16} />
      </button>

      <div
        ref={popoverRef}
        role="region"
        aria-label="Volume settings"
        aria-hidden={!isOpen}
        className={`mw-volume-popover ${
          isOpen ? 'mw-volume-popover-open' : 'mw-volume-popover-closed'
        }`}
      >
        <VolumeControl className="w-full" />
      </div>
    </div>
  );
});

VolumeButtonInner.displayName = 'VolumeButtonInner';

export const VolumeButton = memo(function VolumeButton({
  className = '',
}: VolumeButtonProps) {
  const accountTier = useSpotifyPlayerStore((s) => s.accountTier);

  if (accountTier === 'free') {
    return null;
  }

  return <VolumeButtonInner className={className} />;
});

VolumeButton.displayName = 'VolumeButton';
