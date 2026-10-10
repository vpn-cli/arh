"use client";

import React, { useState } from 'react';

export interface MediaRowProps {
  /** Main title of the media item (e.g. track name, artist name, playlist name) */
  title: string;
  /** Subtitle or secondary metadata (e.g. artist list, "Artist", playlist owner/track count) */
  subtitle?: React.ReactNode;
  /** URL for the media thumbnail/avatar image */
  imageUrl?: string | null;
  /** Shape of the image: 'circle' for artists, 'rounded' for tracks and playlists. Defaults to 'rounded' */
  imageShape?: 'rounded' | 'circle';
  /** Square size of the image in pixels. Defaults to 48px from the design spec (56px in Playlists tab) */
  imageSize?: number;
  /** Optional 1-based or 0-based rank number displayed on the left */
  rank?: number;
  /** Optional duration display, as a preformatted string ("3:45") or milliseconds */
  duration?: string | number;
  /** Trailing action buttons (e.g. play, add to queue, add to playlist) */
  actions?: React.ReactNode;
  /** Primary click handler for the whole row */
  onClick?: () => void;
  /** Highlights the row as currently playing/active */
  isActive?: boolean;
  /** Custom fallback element/icon when image is missing or fails to load */
  fallbackIcon?: React.ReactNode;
  /** Accessible label for the row action */
  ariaLabel?: string;
  /** Additional CSS class names */
  className?: string;
}

/** Formats duration in milliseconds to m:ss string */
function formatMs(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const MediaRow = React.memo(function MediaRow({
  title,
  subtitle,
  imageUrl,
  imageShape = 'rounded',
  imageSize = 48,
  rank,
  duration,
  actions,
  onClick,
  isActive = false,
  fallbackIcon,
  ariaLabel,
  className = '',
}: MediaRowProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !imageUrl || imgError;
  const isCircle = imageShape === 'circle';
  const shapeClass = isCircle ? 'rounded-full' : 'rounded-xl';

  const formattedDuration =
    duration !== undefined
      ? typeof duration === 'number'
        ? formatMs(duration)
        : duration
      : undefined;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group w-full flex items-center gap-3 p-2 rounded-xl mw-row text-left shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isActive ? 'bg-[var(--color-light)] border-[var(--color-vibrant)]' : ''
      } ${className}`}
      aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
    >
      {/* Optional Rank Number */}
      {rank !== undefined && (
        <span className="font-pixel text-xs font-bold text-[var(--color-dark)] w-5 text-center shrink-0 opacity-70">
          {rank}
        </span>
      )}

      {/* Media Image or Fallback Avatar */}
      {showFallback ? (
        <div
          style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
          className={`${shapeClass} bg-[var(--color-muted)]/20 border border-[var(--color-muted)]/30 text-[var(--color-dark)] font-bold flex items-center justify-center shadow-2xs shrink-0 text-base`}
          aria-hidden="true"
        >
          {fallbackIcon ?? (isCircle ? '👤' : '♪')}
        </div>
      ) : (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
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

      {/* Optional Duration */}
      {formattedDuration && (
        <span className="font-pixel text-xs font-bold text-[#82297D] shrink-0">
          {formattedDuration}
        </span>
      )}

      {/* Trailing Action Buttons */}
      {actions && (
        <div
          className="flex items-center gap-1 shrink-0 mw-row-action"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
});

MediaRow.displayName = 'MediaRow';
