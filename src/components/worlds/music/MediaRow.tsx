"use client";

import React, { useState } from 'react';
import { formatTime } from './playback/playbackHelpers';
import { PersonIcon, MusicNoteIcon } from './icons';

export interface MediaRowProps {
  /** Main title of the media item (e.g. track name, artist name, playlist name) */
  title: string;
  /** Subtitle or secondary metadata (e.g. artist list, "Artist", playlist owner / track count) */
  subtitle?: React.ReactNode;
  /** URL for the media thumbnail/avatar image */
  imageUrl?: string | null;
  /** Custom image slot element (e.g. PlaylistCover). When given, replaces the built-in image and fallback while keeping size/shape wrappers consistent */
  imageSlot?: React.ReactNode;
  /** Shape of the image: 'circle' for artists, 'rounded' for tracks and playlists. Defaults to 'rounded' */
  imageShape?: 'rounded' | 'circle';
  /** Square size of the image in pixels. Defaults to 48px from the design spec (56px in Playlists tab) */
  imageSize?: number;
  /** Optional 1-based or 0-based rank number displayed on the left */
  rank?: number;
  /** Optional duration display: preformatted string ("3:45") or milliseconds */
  duration?: string | number;
  /** Trailing action buttons (e.g. play, add to queue, add to playlist) */
  actions?: React.ReactNode;
  /** Visibility mode for trailing action buttons. 'hover' hides until row hover; 'always' keeps them visible. Defaults to 'hover' */
  actionsVisibility?: 'hover' | 'always';
  /** Primary click handler for the whole row */
  onClick?: () => void;
  /** Highlights the row as currently playing/active */
  isActive?: boolean;
  /** Custom fallback element/icon when image is missing or fails to load */
  fallbackIcon?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
}

export const MediaRow = React.memo(function MediaRow({
  title,
  subtitle,
  imageUrl,
  imageSlot,
  imageShape = 'rounded',
  imageSize = 48,
  rank,
  duration,
  actions,
  actionsVisibility = 'hover',
  onClick,
  isActive = false,
  fallbackIcon,
  className = '',
}: MediaRowProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !imageUrl || imgError;
  const isCircle = imageShape === 'circle';
  const shapeClass = isCircle ? 'rounded-full' : 'rounded-xl';

  const formattedDuration =
    duration !== undefined
      ? typeof duration === 'number'
        ? formatTime(duration)
        : duration
      : undefined;

  const content = (
    <>
      {/* Optional Rank Number */}
      {rank !== undefined && (
        <span className="font-pixel text-xs font-bold text-[var(--color-dark)] w-5 text-center shrink-0 opacity-70">
          {rank}
        </span>
      )}

      {/* Media Image, Image Slot, or Fallback Avatar */}
      {imageSlot ? (
        <div
          style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
          className={`${shapeClass} overflow-hidden shadow-2xs shrink-0 border border-[var(--color-muted)]/30 flex items-center justify-center`}
          aria-hidden="true"
        >
          {imageSlot}
        </div>
      ) : showFallback ? (
        <div
          style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
          className={`${shapeClass} bg-[var(--color-muted)]/20 border border-[var(--color-muted)]/30 text-[var(--color-dark)] font-bold flex items-center justify-center shadow-2xs shrink-0 text-base`}
          aria-hidden="true"
        >
          {fallbackIcon ?? (isCircle ? <PersonIcon size={Math.round(imageSize * 0.45)} /> : <MusicNoteIcon size={Math.round(imageSize * 0.45)} />)}
        </div>
      ) : (
        <img
          src={imageUrl}
          alt=""
          width={imageSize}
          height={imageSize}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
          className={`${shapeClass} shadow-2xs object-cover shrink-0 border border-[var(--color-muted)]/30`}
        />
      )}

      {/* Title & Subtitle */}
      <div className="flex-1 overflow-hidden min-w-0 flex flex-col justify-center">
        <div
          className={`font-pixel text-[15px] font-bold truncate leading-snug ${
            isActive ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'
          }`}
          title={typeof title === 'string' ? title : undefined}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="font-pixel text-[13px] font-medium text-[var(--color-dark)] opacity-75 truncate mt-0.5 leading-tight"
            title={typeof subtitle === 'string' ? subtitle : undefined}
          >
            {subtitle}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={`group relative w-full flex items-center gap-3 p-2 rounded-xl mw-row text-left shrink-0 select-none ${
        isActive ? 'bg-[var(--color-light)] border-[var(--color-vibrant)]' : ''
      } ${className}`}
    >
      {/* Primary Click Target */}
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="mw-row-main flex-1 flex items-center gap-3 text-left min-w-0 outline-none focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
        >
          {content}
        </button>
      ) : (
        <div className="flex-1 flex items-center gap-3 text-left min-w-0">
          {content}
        </div>
      )}

      {/* Optional Duration */}
      {formattedDuration && (
        <span className="relative z-10 font-pixel text-xs font-bold text-[var(--color-dark)] opacity-70 shrink-0 pointer-events-none">
          {formattedDuration}
        </span>
      )}

      {/* Trailing Action Buttons */}
      {actions && (
        <div
          className={`relative z-10 flex items-center gap-1 shrink-0 ${
            actionsVisibility === 'hover' ? 'mw-row-action' : ''
          }`}
        >
          {actions}
        </div>
      )}
    </div>
  );
});

MediaRow.displayName = 'MediaRow';
