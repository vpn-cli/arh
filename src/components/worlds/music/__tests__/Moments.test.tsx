import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { moments, MomentSlot } from '../stickerConfig';
import { MomentSticker } from '../MomentSticker';

describe('Part C: Moments stickers', () => {
  const allMoments: { slot: MomentSlot; file: string }[] = [
    { slot: 'queueEmpty', file: 'r5c3' },
    { slot: 'searchEmpty', file: 'r5c1' },
    { slot: 'lyricsMissing', file: 'r4c1' },
    { slot: 'loading', file: 'r2c3' },
    { slot: 'error', file: 'r5c1' },
    { slot: 'addedToQueue', file: 'r5c2' },
    { slot: 'addedToPlaylist', file: 'r3c1' },
    { slot: 'memorySaved', file: 'r3c4' },
  ];

  describe('One test per moment that the mapped sticker renders', () => {
    it('renders mapped sticker r5c3 for queueEmpty', () => {
      const { container } = render(<MomentSticker moment="queueEmpty" size={64} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r5c3.png');
      expect(img.getAttribute('width')).toBe('64');
      expect(img.getAttribute('height')).toBe('64');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders mapped sticker r5c1 for searchEmpty', () => {
      const { container } = render(<MomentSticker moment="searchEmpty" size={64} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r5c1.png');
      expect(img.getAttribute('width')).toBe('64');
      expect(img.getAttribute('height')).toBe('64');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders mapped sticker r4c1 for lyricsMissing', () => {
      const { container } = render(<MomentSticker moment="lyricsMissing" size={64} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r4c1.png');
      expect(img.getAttribute('width')).toBe('64');
      expect(img.getAttribute('height')).toBe('64');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders mapped sticker r2c3 for loading with gentle bob animation', () => {
      const { container } = render(<MomentSticker moment="loading" size={64} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r2c3.png');
      expect(img.getAttribute('width')).toBe('64');
      expect(img.getAttribute('height')).toBe('64');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');

      // Loading uses gentle bob class
      const wrapper = container.querySelector('.mw-sticker-bob');
      expect(wrapper).not.toBeNull();
    });

    it('renders mapped sticker r5c1 for error and does not bob', () => {
      const { container } = render(<MomentSticker moment="error" size={64} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r5c1.png');
      expect(img.getAttribute('width')).toBe('64');
      expect(img.getAttribute('height')).toBe('64');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');

      // Error state does not move
      const wrapper = container.querySelector('.mw-sticker-bob');
      expect(wrapper).toBeNull();
    });

    it('renders mapped sticker r5c2 for addedToQueue', () => {
      const { container } = render(<MomentSticker moment="addedToQueue" size={48} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r5c2.png');
      expect(img.getAttribute('width')).toBe('48');
      expect(img.getAttribute('height')).toBe('48');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders mapped sticker r3c1 for addedToPlaylist', () => {
      const { container } = render(<MomentSticker moment="addedToPlaylist" size={48} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r3c1.png');
      expect(img.getAttribute('width')).toBe('48');
      expect(img.getAttribute('height')).toBe('48');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders mapped sticker r3c4 for memorySaved', () => {
      const { container } = render(<MomentSticker moment="memorySaved" size={48} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('/stickers/snoopy-v1/r3c4.png');
      expect(img.getAttribute('width')).toBe('48');
      expect(img.getAttribute('height')).toBe('48');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Configuration mappings in stickerConfig.ts', () => {
    it('has all 8 moments correctly configured in moments map', () => {
      allMoments.forEach(({ slot, file }) => {
        expect(moments[slot]).toBe(file);
      });
    });
  });
});
