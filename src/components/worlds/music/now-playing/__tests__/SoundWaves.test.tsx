import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoundWaves } from '../SoundWaves';
import { usePlayerVolumeStore } from '@/providers/volumeStore';

describe('SoundWaves', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlayerVolumeStore.setState({ volume: 0.8 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders 14 soundwave bars with rounded pill shape', () => {
    const { container } = render(
      <SoundWaves currentTrack={{ id: 't1' }} isPaused={false} />
    );

    const bars = container.querySelectorAll('.soundwave-bar');
    expect(bars.length).toBe(14);
    expect(bars[0].className).toContain('rounded-full');
  });

  it('drives container --wave-level higher when playing and sinks low (0.15) when paused', () => {
    const { container, rerender } = render(
      <SoundWaves currentTrack={{ id: 't1' }} isPaused={false} />
    );

    const waveContainer = container.querySelector('.soundwave-bar')?.parentElement as HTMLElement;
    expect(waveContainer).not.toBeNull();
    const playingLevel = parseFloat(waveContainer.style.getPropertyValue('--wave-level'));
    expect(playingLevel).toBeGreaterThan(0.5);

    rerender(<SoundWaves currentTrack={{ id: 't1' }} isPaused={true} />);
    const pausedLevel = parseFloat(waveContainer.style.getPropertyValue('--wave-level'));
    expect(pausedLevel).toBe(0.15);
  });

  it('displays resting sticker r5c3 after being paused for 10 seconds and hides when playing', () => {
    const { rerender } = render(
      <SoundWaves currentTrack={{ id: 't1' }} isPaused={true} />
    );

    const stickerContainer = screen.getByTestId('resting-wave-sticker');
    expect(stickerContainer.className).toContain('opacity-0');

    // Advance 5 seconds (not yet)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(stickerContainer.className).toContain('opacity-0');

    // Advance remaining 5 seconds (10 seconds total)
    act(() => {
      vi.advanceTimersByTime(5050);
    });
    expect(stickerContainer.className).toContain('opacity-100');

    // Resume playing -> fades out immediately
    rerender(<SoundWaves currentTrack={{ id: 't1' }} isPaused={false} />);
    expect(stickerContainer.className).toContain('opacity-0');
  });

  it('triggers ripple on bars when likeTrigger fires', () => {
    const { container, rerender } = render(
      <SoundWaves currentTrack={{ id: 't1' }} isPaused={false} likeTrigger={0} />
    );

    expect(container.querySelectorAll('.is-rippling').length).toBe(0);

    rerender(<SoundWaves currentTrack={{ id: 't1' }} isPaused={false} likeTrigger={1} />);
    expect(container.querySelectorAll('.is-rippling').length).toBe(14);

    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(container.querySelectorAll('.is-rippling').length).toBe(0);
  });
});
