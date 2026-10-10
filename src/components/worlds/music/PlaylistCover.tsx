"use client";

import React, { useState } from 'react';
import { pickImage, SpotifyImage } from '@/lib/spotify/images';
import { MusicNoteIcon } from './icons';

export interface PlaylistCoverProps {
  /** Array of Spotify image objects or image URL strings */
  images?: Array<SpotifyImage | string> | null;
  /** Size in pixels (e.g. 40, 56) */
  size?: number;
  /** Additional class names */
  className?: string;
  /** Optional fallback icon character or node */
  fallbackIcon?: React.ReactNode;
}

/**
 * Renders a playlist cover:
 * - 2x2 grid of the first four images when there are 4 or more entries.
 *   Each grid cell uses pickImage at half the size.
 * - Single image via pickImage when there are 1 to 3 images.
 * - Fallback icon when no images or URLs exist.
 */
export const PlaylistCover = React.memo(function PlaylistCover({
  images,
  size = 40,
  className = '',
  fallbackIcon,
}: PlaylistCoverProps) {
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});
  const [singleFailed, setSingleFailed] = useState(false);

  // 1. Collage: 4 or more images
  if (images && images.length >= 4) {
    const halfSize = Math.max(1, Math.floor(size / 2));
    const firstFour = images.slice(0, 4);

    return (
      <div
        className={`w-full h-full grid grid-cols-2 grid-rows-2 bg-[var(--color-muted)]/20 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {firstFour.map((img, idx) => {
          if (failedIndices[idx]) {
            return (
              <div
                key={idx}
                className="w-full h-full bg-[var(--color-muted)]/30 flex items-center justify-center text-[var(--color-dark)] font-bold text-caption"
              >
                {fallbackIcon}
              </div>
            );
          }

          const src =
            pickImage([img], halfSize) ||
            (typeof img === 'string' ? img : img?.url);

          if (!src) {
            return (
              <div
                key={idx}
                className="w-full h-full bg-[var(--color-muted)]/30 flex items-center justify-center text-[var(--color-dark)] font-bold text-caption"
              >
                {fallbackIcon}
              </div>
            );
          }

          return (
            <img
              key={idx}
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() =>
                setFailedIndices((prev) => ({ ...prev, [idx]: true }))
              }
              className="w-full h-full object-cover"
            />
          );
        })}
      </div>
    );
  }

  // 2. Single image via pickImage
  const singleUrl = pickImage(images, size);
  if (singleUrl && !singleFailed) {
    return (
      <img
        src={singleUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setSingleFailed(true)}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  // 3. Fallback
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`w-full h-full bg-[var(--color-muted)]/20 text-[var(--color-dark)] font-bold flex items-center justify-center text-body ${className}`}
    >
      {fallbackIcon ?? <MusicNoteIcon size={Math.round(size * 0.45)} />}
    </div>
  );
});
