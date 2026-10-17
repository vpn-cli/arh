/* eslint-disable @next/next/no-img-element */
import React from 'react';
import {
  SNOOPY_STICKERS_ENABLED,
  SNOOPY_STICKER_MAP,
  StickerSlot,
} from './stickerConfig';

export interface StickerIconProps {
  name: StickerSlot;
  size?: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

export const StickerIcon = React.memo(function StickerIcon({
  name,
  size,
  scale,
  className = '',
  style,
  fallback,
}: StickerIconProps) {
  const combinedStyle: React.CSSProperties = {
    ...(size ? { width: size, height: size } : {}),
    ...(scale !== undefined
      ? ({ '--icon-scale': scale, transform: 'scale(var(--icon-scale, 1))' } as React.CSSProperties)
      : {}),
    ...style,
  };

  if (!SNOOPY_STICKERS_ENABLED) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    switch (name) {
      case 'header':
        return (
          <img
            src="/images/hello-kitty-header.png"
            alt=""
            aria-hidden="true"
            width={size || 28}
            height={size || 28}
            className={className || 'w-7 h-7 object-contain hidden sm:block ml-2'}
            style={combinedStyle}
          />
        );
      case 'kawaiiCard':
        return (
          <img
            src="/hampter/hello_kitty_pin.png"
            alt=""
            aria-hidden="true"
            width={size || 64}
            height={size || 64}
            className={className || 'w-16 h-16 object-contain'}
            style={combinedStyle}
          />
        );
      case 'continueListening':
        return (
          <span
            aria-hidden="true"
            className={className || 'text-[var(--color-vibrant)]'}
            style={combinedStyle}
          >
            ♥
          </span>
        );
      case 'recentlyPlayed':
        return (
          <span
            aria-hidden="true"
            className={className || 'text-[var(--color-vibrant)]'}
            style={combinedStyle}
          >
            ◷
          </span>
        );
      case 'queueTab':
        return (
          <span
            aria-hidden="true"
            className={className || 'text-body px-2 select-none'}
            title="Hello Kitty"
            style={combinedStyle}
          >
            🎀
          </span>
        );
      case 'queueModal':
        return (
          <span aria-hidden="true" className={className} style={combinedStyle}>
            🎀
          </span>
        );
      case 'progressThumb':
        return (
          <img
            src="/hampter/hello_kitty_pin.png"
            alt="Kitty Pin"
            aria-hidden="true"
            width={40}
            height={40}
            className={className}
            style={{
              ...(scale !== undefined
                ? ({ '--icon-scale': scale, transform: 'scale(var(--icon-scale, 1))' } as React.CSSProperties)
                : {}),
              ...style,
              width: 40,
              height: 40,
            }}
          />
        );
    }
  }

  if (name === 'header') {
    return (
      <img
        src="/images/hello-kitty-header.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={combinedStyle}
      />
    );
  }

  const stickerFile = SNOOPY_STICKER_MAP[name];

  return (
    <img
      src={`/stickers/snoopy-v1/${stickerFile}.png`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`object-contain kitty-sticker-wiggle ${className}`}
      style={combinedStyle}
    />
  );
});
