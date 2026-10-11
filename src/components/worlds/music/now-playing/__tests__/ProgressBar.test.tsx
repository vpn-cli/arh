import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

describe('ProgressBar', () => {
  beforeEach(() => {
    useSpotifyPlayerStore.setState({
      player: { seek: vi.fn() } as any,
      duration: 180000,
      isPaused: false,
    });
  });

  it('renders scooter progress handle sticker at 36px at rest sitting on track bottom edge with origin at wheel line', () => {
    const { container } = render(
      <ProgressBar
        getPositionMs={() => 0}
        onSeek={vi.fn()}
        onDragSeek={vi.fn()}
      />
    );

    const thumbImg = container.querySelector('.progress-thumb img') as HTMLImageElement | null;
    expect(thumbImg).not.toBeNull();
    expect(thumbImg?.getAttribute('src')).toBe('/stickers/snoopy-v1/r5c2.png');
    expect(thumbImg?.getAttribute('width')).toBe('36');
    expect(thumbImg?.getAttribute('height')).toBe('36');
    expect(thumbImg?.style.width).toBe('36px');
    expect(thumbImg?.style.height).toBe('36px');
    expect(thumbImg?.className).toContain('translate-x-1/2');
    expect(thumbImg?.className).toContain('bottom-2');
    expect(thumbImg?.className).not.toContain('-translate-y-1/2');
    expect(thumbImg?.className).toContain('origin-bottom');
    expect(thumbImg?.style.transformOrigin).toBe('center bottom');
    expect(thumbImg?.classList.contains('scale-125')).toBe(false);

    // Track scales upward from origin-bottom so bottom edge does not move
    const track = container.querySelector('.progress-track') as HTMLDivElement | null;
    expect(track).not.toBeNull();
    expect(track?.className).toContain('origin-bottom');

    // Root container provides fixed clear spacing above the bar
    const root = container.firstChild as HTMLDivElement | null;
    expect(root?.className).toContain('mt-4');
  });

  it('applies scale 1.25 while dragging and reverts when drag ends, with origin at wheel line', () => {
    const { container, getByRole } = render(
      <ProgressBar
        getPositionMs={() => 0}
        onSeek={vi.fn()}
        onDragSeek={vi.fn()}
      />
    );

    const slider = getByRole('slider');
    const thumbImg = container.querySelector('.progress-thumb img');

    // Simulate pointer down to drag
    fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1 });
    expect(thumbImg?.classList.contains('scale-125')).toBe(true);
    expect(thumbImg?.className).toContain('origin-bottom');

    // Simulate pointer up to end drag
    fireEvent.pointerUp(slider, { clientX: 100, pointerId: 1 });
    expect(thumbImg?.classList.contains('scale-125')).toBe(false);
  });

  it('preserves centred position for Hello Kitty fallback when flag is off', async () => {
    vi.resetModules();
    const mockConfig = {
      SNOOPY_STICKERS_ENABLED: false,
      SNOOPY_STICKER_MAP: {
        progressThumb: 'r5c2',
      },
    };
    vi.doMock('../../stickerConfig', () => mockConfig);
    vi.doMock('../stickerConfig', () => mockConfig);
    vi.doMock('./stickerConfig', () => mockConfig);
    vi.doMock('@/components/worlds/music/stickerConfig', () => mockConfig);

    const { ProgressBar: FallbackProgressBar } = await import('../ProgressBar');

    const { container } = render(
      <FallbackProgressBar
        getPositionMs={() => 0}
        onSeek={vi.fn()}
        onDragSeek={vi.fn()}
      />
    );

    const thumbImg = container.querySelector('.progress-thumb img') as HTMLImageElement | null;
    expect(thumbImg).not.toBeNull();
    expect(thumbImg?.getAttribute('src')).toBe('/hampter/hello_kitty_pin.png');
    expect(thumbImg?.className).toContain('top-1/2');
    expect(thumbImg?.className).toContain('-translate-y-1/2');
    expect(thumbImg?.className).toContain('translate-x-1/2');
    expect(thumbImg?.className).not.toContain('bottom-2');
    expect(thumbImg?.className).toContain('origin-center');
    expect(thumbImg?.style.transformOrigin).toBe('center center');

    vi.doUnmock('../../stickerConfig');
    vi.doUnmock('../stickerConfig');
    vi.doUnmock('./stickerConfig');
    vi.doUnmock('@/components/worlds/music/stickerConfig');
    vi.resetModules();
  });
});
