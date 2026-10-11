import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { StickerIcon } from '../StickerIcon';
import * as config from '../stickerConfig';

describe('Snoopy Stickers & StickerIcon', () => {
  it('has all 19 sticker png files in public/stickers/snoopy-v1/', () => {
    const stickersDir = path.join(process.cwd(), 'public', 'stickers', 'snoopy-v1');
    expect(fs.existsSync(stickersDir)).toBe(true);

    const expectedStickers = [
      'r1c1', 'r1c2', 'r1c3', 'r1c4',
      'r2c1', 'r2c2', 'r2c3', 'r2c4',
      'r3c1', 'r3c2', 'r3c3', 'r3c4',
      'r4c1', 'r4c2', 'r4c3', 'r4c4',
      'r5c1', 'r5c2', 'r5c3',
    ];

    for (const name of expectedStickers) {
      const filePath = path.join(stickersDir, `${name}.png`);
      expect(fs.existsSync(filePath), `Missing ${name}.png`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  it('renders decorative sticker (empty alt, aria-hidden="true") when enabled', () => {
    const { container } = render(<StickerIcon name="header" size={32} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/stickers/snoopy-v1/r4c4.png');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
    expect(img?.style.width).toBe('32px');
    expect(img?.style.height).toBe('32px');
  });

  it('renders correct sticker files for each configured slot', () => {
    const slots: Array<[config.StickerSlot, string, number]> = [
      ['header', '/stickers/snoopy-v1/r4c4.png', 32],
      ['kawaiiCard', '/stickers/snoopy-v1/r4c2.png', 80],
      ['continueListening', '/stickers/snoopy-v1/r5c2.png', 48],
      ['recentlyPlayed', '/stickers/snoopy-v1/r4c1.png', 48],
      ['queueTab', '/stickers/snoopy-v1/r1c4.png', 28],
      ['queueModal', '/stickers/snoopy-v1/r1c4.png', 48],
      ['progressThumb', '/stickers/snoopy-v1/r5c2.png', 36],
    ];

    for (const [slot, expectedSrc, expectedSize] of slots) {
      const { container } = render(<StickerIcon name={slot} size={expectedSize} />);
      const img = container.querySelector('img');
      expect(img?.getAttribute('src')).toBe(expectedSrc);
      expect(img?.style.width).toBe(`${expectedSize}px`);
      expect(img?.style.height).toBe(`${expectedSize}px`);
    }
  });

  it('applies --icon-scale style when scale prop is provided', () => {
    const { container } = render(<StickerIcon name="kawaiiCard" size={80} scale={1.2} />);
    const img = container.querySelector('img');
    expect(img?.style.getPropertyValue('--icon-scale')).toBe('1.2');
  });

  it('restores previous icons when flag is disabled', async () => {
    vi.resetModules();
    vi.doMock('../stickerConfig', () => ({
      SNOOPY_STICKERS_ENABLED: false,
      SNOOPY_STICKER_MAP: {
        header: 'r4c4',
        kawaiiCard: 'r4c2',
        continueListening: 'r5c2',
        recentlyPlayed: 'r4c1',
        queueTab: 'r1c4',
        queueModal: 'r1c4',
        progressThumb: 'r5c2',
      },
    }));

    const { StickerIcon: FallbackStickerIcon } = await import('../StickerIcon');

    // Header restores hello_kitty_pin
    const headerRender = render(<FallbackStickerIcon name="header" size={32} />);
    const headerImg = headerRender.container.querySelector('img');
    expect(headerImg?.getAttribute('src')).toBe('/hampter/hello_kitty_pin.png');

    // KawaiiCard restores hello_kitty_pin
    const cardRender = render(<FallbackStickerIcon name="kawaiiCard" size={80} />);
    const cardImg = cardRender.container.querySelector('img');
    expect(cardImg?.getAttribute('src')).toBe('/hampter/hello_kitty_pin.png');

    // ContinueListening restores heart
    const heartRender = render(<FallbackStickerIcon name="continueListening" size={48} />);
    expect(heartRender.container.textContent).toContain('♥');

    // RecentlyPlayed restores clock symbol
    const recentRender = render(<FallbackStickerIcon name="recentlyPlayed" size={48} />);
    expect(recentRender.container.textContent).toContain('◷');

    // QueueTab restores ribbon
    const tabRender = render(<FallbackStickerIcon name="queueTab" size={28} />);
    expect(tabRender.container.textContent).toContain('🎀');

    // QueueModal restores ribbon
    const modalRender = render(<FallbackStickerIcon name="queueModal" size={48} />);
    expect(modalRender.container.textContent).toContain('🎀');

    // ProgressThumb restores hello_kitty_pin at 40px whatever size is passed
    const thumbRender = render(<FallbackStickerIcon name="progressThumb" size={28} />);
    const thumbImg = thumbRender.container.querySelector('img');
    expect(thumbImg?.getAttribute('src')).toBe('/hampter/hello_kitty_pin.png');
    expect(thumbImg?.getAttribute('width')).toBe('40');
    expect(thumbImg?.getAttribute('height')).toBe('40');
    expect(thumbImg?.style.width).toBe('40px');
    expect(thumbImg?.style.height).toBe('40px');

    vi.doUnmock('../stickerConfig');
    vi.resetModules();
  });
});
