"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { openInSpotify } from './playback/playbackHelpers';

export interface TrackActionsMenuProps {
  track: any;
  onAddToQueue?: (track: any) => void;
  onAddToPlaylist?: (uri: string) => void;
  onAddMemory?: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  onOpenArtist?: (artistId: string) => void;
  onOpenAlbum?: (albumId: string) => void;
  className?: string;
  buttonClassName?: string;
}

export const TrackActionsMenu = React.memo(function TrackActionsMenu({
  track,
  onAddToQueue,
  onAddToPlaylist,
  onAddMemory,
  onOpenArtist,
  onOpenAlbum,
  className = '',
  buttonClassName = '',
}: TrackActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  // Return focus to trigger button when closed after being open
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      buttonRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Focus the first menu item when menu opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const firstBtn = menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]');
        firstBtn?.focus();
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Keyboard navigation within menu
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])');
      if (!buttons || buttons.length === 0) return;

      const btnArray = Array.from(buttons);
      const currentIndex = btnArray.indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex = 0;

      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex >= 0 && currentIndex < btnArray.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowUp') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : btnArray.length - 1;
      }

      btnArray[nextIndex]?.focus();
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const trackUri = track?.uri || (track?.id ? `spotify:track:${track.id}` : '');

  // Build list of valid actions for the given track
  const items: { id: string; label: string; action: () => void }[] = [];

  if (onAddToQueue && track) {
    items.push({
      id: 'queue',
      label: 'Add to queue',
      action: () => onAddToQueue(track),
    });
  }

  if (onAddToPlaylist && trackUri) {
    items.push({
      id: 'playlist',
      label: 'Add to playlist',
      action: () => onAddToPlaylist(trackUri),
    });
  }

  if (onAddMemory && track) {
    items.push({
      id: 'memory',
      label: 'Add memory',
      action: () => onAddMemory(track, 'track'),
    });
  }

  const firstArtist = track?.artists?.[0];
  if (onOpenArtist && firstArtist?.id) {
    items.push({
      id: 'artist',
      label: 'Go to artist',
      action: () => onOpenArtist(firstArtist.id),
    });
  }

  const albumId = track?.album?.id;
  if (onOpenAlbum && albumId) {
    items.push({
      id: 'album',
      label: 'Go to album',
      action: () => onOpenAlbum(albumId),
    });
  }

  const hasSpotifyLink = Boolean(
    (track?.uri && track.uri.startsWith('spotify:')) ||
    track?.external_urls?.spotify ||
    track?.id
  );
  if (hasSpotifyLink) {
    items.push({
      id: 'spotify',
      label: 'Open in Spotify',
      action: () => {
        if (track?.uri && track.uri.startsWith('spotify:')) {
          openInSpotify(track.uri);
        } else if (track?.external_urls?.spotify) {
          window.open(track.external_urls.spotify, '_blank', 'noopener,noreferrer');
        } else if (track?.id) {
          openInSpotify(`spotify:track:${track.id}`);
        }
      },
    });
  }

  if (!track || items.length === 0) {
    return (
      <button
        disabled
        className={buttonClassName || "w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-title text-[var(--color-dark)] pb-1 font-bold opacity-40 cursor-not-allowed"}
        aria-label="Track options"
        title="No track options available"
      >
        ...
      </button>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Track options"
        title="Track options"
        className={buttonClassName || "w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-title text-[var(--color-dark)] hover:text-[var(--color-vibrant)] pb-1 font-bold transition-transform hover:scale-110 active:scale-95"}
      >
        ...
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Track options"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] w-max max-w-[240px] bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-xl shadow-lg p-1.5 flex flex-col gap-1"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
              className="mw-btn w-full text-left font-pixel text-caption font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:bg-white px-3 py-1.5 min-h-[32px] rounded-lg transition-colors flex items-center justify-between"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

TrackActionsMenu.displayName = 'TrackActionsMenu';
