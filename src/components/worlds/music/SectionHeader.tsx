"use client";

import React from 'react';
import { StickerIcon } from './StickerIcon';
import { StickerSlot } from './stickerConfig';

export interface SectionHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  sticker?: StickerSlot | React.ReactNode;
  stickerSize?: number;
  actions?: React.ReactNode;
  className?: string;
  headingTag?: 'h1' | 'h2' | 'h3';
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  subtitle,
  sticker,
  stickerSize = 40,
  actions,
  className = '',
  headingTag: HeadingTag = 'h2',
}: SectionHeaderProps) {
  const renderedSticker = React.useMemo(() => {
    if (!sticker) return null;
    if (typeof sticker === 'string') {
      return (
        <StickerIcon
          name={sticker as StickerSlot}
          size={stickerSize}
          className="inline-block object-contain shrink-0"
        />
      );
    }
    return sticker;
  }, [sticker, stickerSize]);

  return (
    <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0 ${className}`}>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {renderedSticker}
          <HeadingTag className="font-pixel text-heading font-bold text-[var(--color-dark)] tracking-wide truncate">
            {title}
          </HeadingTag>
        </div>
        {subtitle && (
          <div className="font-pixel text-caption text-[var(--color-dark)] mt-1 font-medium opacity-80 leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </header>
  );
});
