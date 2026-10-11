import React from 'react';
import { SNOOPY_STICKERS_ENABLED, moments, MomentSlot } from './stickerConfig';

export interface MomentStickerProps {
  moment: MomentSlot;
  size?: number;
  className?: string;
  fallback?: React.ReactNode;
}

export const MomentSticker = React.memo(function MomentSticker({
  moment,
  size = 64,
  className = '',
  fallback,
}: MomentStickerProps) {
  if (!SNOOPY_STICKERS_ENABLED) {
    return fallback !== undefined ? <>{fallback}</> : null;
  }

  const stickerFile = moments[moment];
  const isBobbing = moment === 'loading';

  return (
    <div
      aria-hidden="true"
      className={`inline-flex items-center justify-center select-none ${
        isBobbing ? 'mw-sticker-bob' : ''
      } ${className}`}
    >
      <img
        src={`/stickers/snoopy-v1/${stickerFile}.png`}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="object-contain max-w-none"
        style={{ width: size, height: size }}
      />
    </div>
  );
});

MomentSticker.displayName = 'MomentSticker';
