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

  it('renders scooter progress handle sticker at 36px at rest', () => {
    const { container } = render(
      <ProgressBar
        getPositionMs={() => 0}
        onSeek={vi.fn()}
        onDragSeek={vi.fn()}
      />
    );

    const thumbImg = container.querySelector('.progress-thumb img');
    expect(thumbImg).not.toBeNull();
    expect(thumbImg?.getAttribute('src')).toBe('/stickers/snoopy-v1/r5c2.png');
    expect(thumbImg?.getAttribute('width')).toBe('36');
    expect(thumbImg?.getAttribute('height')).toBe('36');
    expect(thumbImg?.style.width).toBe('36px');
    expect(thumbImg?.style.height).toBe('36px');
    expect(thumbImg?.className).toContain('translate-x-1/2');
    expect(thumbImg?.className).toContain('-translate-y-1/2');
    expect(thumbImg?.classList.contains('scale-125')).toBe(false);
  });

  it('applies scale 1.25 while dragging and reverts when drag ends', () => {
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

    // Simulate pointer up to end drag
    fireEvent.pointerUp(slider, { clientX: 100, pointerId: 1 });
    expect(thumbImg?.classList.contains('scale-125')).toBe(false);
  });
});
