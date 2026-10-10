import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  HeroSlideshow,
  STILL_MS,
  ANIMATED_MS,
  FADE_MS,
  PRELOAD_LEAD_MS,
  SAFETY_TIMEOUT_MS,
  _resetSlideshowStateForTesting,
} from '../HeroSlideshow';
import { SlideLayer } from '../SlideLayer';

const mockProps = {
  currentTrack: null,
  isPaused: false,
  heroArt: '/soundscape_ref/finalui.png',
  birthdayMixTracks: [],
  likedTracks: [],
  onNavigate: () => {},
  playTracks: () => {},
  togglePlay: () => {},
};

describe('HeroSlideshow constants', () => {
  it('has expected timing constants for 3 minute stays and 15s preloading', () => {
    expect(STILL_MS).toBe(180000);
    expect(ANIMATED_MS).toBe(180000);
    expect(FADE_MS).toBe(800);
    expect(PRELOAD_LEAD_MS).toBe(15000);
    expect(SAFETY_TIMEOUT_MS).toBe(10000);
  });
});

describe('SlideLayer object-position', () => {
  it('applies object-position: 65% 50% to the slide image', () => {
    const slide = {
      src: '/slideshow/m-dd-0ec7bd04.webp',
      width: 1600,
      height: 364,
      animated: false,
    };

    const { container } = render(
      <SlideLayer
        slide={slide}
        isPriority={true}
        opacity={1}
        isFading={false}
      />
    );

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.style.objectPosition).toBe('65% 50%');
  });
});

describe('HeroSlideshow render', () => {
  it('renders hero content and backdrop', () => {
    render(<HeroSlideshow {...mockProps} />);
    expect(screen.getByText("GOOD EVENING")).toBeDefined();
    expect(screen.getByText("Let's listen together ♡")).toBeDefined();
  });
});

describe('HeroSlideshow fake timer tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetSlideshowStateForTesting();

    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => 1600,
    });
    HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('(a) STILL_MS 5000 advances after about 5s', async () => {
    const { container } = render(
      <HeroSlideshow {...mockProps} stillMs={5000} preloadLeadMs={15000} />
    );

    await act(async () => {
      await Promise.resolve();
    });

    const initialImg = container.querySelector('img');
    expect(initialImg).not.toBeNull();
    const initialSrc = initialImg?.src;

    // At 2400ms: with duration 5000ms, preloadLead = min(15000, 2500) = 2500ms
    // Preload delay = 5000 - 2500 = 2500ms, so before 2500ms only 1 slide is rendered
    await act(async () => {
      vi.advanceTimersByTime(2400);
      await Promise.resolve();
    });
    expect(container.querySelectorAll('img').length).toBe(1);

    // At 2600ms: preload has started (2 images)
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(container.querySelectorAll('img').length).toBe(2);

    // At 5000ms: advance timer expires and crossfade starts
    await act(async () => {
      vi.advanceTimersByTime(2400);
      await Promise.resolve();
    });

    // Crossfade completes (FADE_MS = 800ms)
    await act(async () => {
      vi.advanceTimersByTime(FADE_MS);
      await Promise.resolve();
    });

    const currentImg = container.querySelector('img');
    expect(currentImg?.src).not.toBe(initialSrc);
  });

  it('(b) STILL_MS 180000 advances after 3 minutes with preload starting 15s before', async () => {
    const { container } = render(
      <HeroSlideshow {...mockProps} stillMs={180000} preloadLeadMs={15000} />
    );

    await act(async () => {
      await Promise.resolve();
    });

    const initialSrc = container.querySelector('img')?.src;
    expect(initialSrc).toBeDefined();

    // Preload lead = min(15000, 90000) = 15000ms
    // Preload delay = 180,000 - 15,000 = 165,000ms.
    // At 160,000ms: preload has not started yet
    await act(async () => {
      vi.advanceTimersByTime(160000);
      await Promise.resolve();
    });
    expect(container.querySelectorAll('img').length).toBe(1);

    // At 165,000ms (15s before 3 min): preload triggers
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(container.querySelectorAll('img').length).toBe(2);

    // At 180,000ms (full 3 minutes): advance triggers crossfade
    await act(async () => {
      vi.advanceTimersByTime(15000);
      await Promise.resolve();
    });

    // Allow crossfade to finish
    await act(async () => {
      vi.advanceTimersByTime(FADE_MS);
      await Promise.resolve();
    });

    const newSrc = container.querySelector('img')?.src;
    expect(newSrc).not.toBe(initialSrc);
  });

  it('(c) hide then show the tab mid-slide and confirm it advances after the remaining time', async () => {
    const { container } = render(
      <HeroSlideshow {...mockProps} stillMs={5000} preloadLeadMs={15000} />
    );

    await act(async () => {
      await Promise.resolve();
    });

    const initialSrc = container.querySelector('img')?.src;

    // Advance 2000ms into the 5000ms slide (3000ms remaining)
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    // Hide tab
    await act(async () => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    // Advance 10,000ms while tab is hidden (slideshow must remain paused)
    await act(async () => {
      vi.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    // Confirm it did NOT advance while hidden
    expect(container.querySelector('img')?.src).toBe(initialSrc);

    // Show tab again
    await act(async () => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    // Advance 2500ms (not yet at remaining 3000ms)
    await act(async () => {
      vi.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    expect(container.querySelector('img')?.src).toBe(initialSrc);

    // Advance remaining 500ms + FADE_MS (crossfade finishes)
    await act(async () => {
      vi.advanceTimersByTime(500 + FADE_MS);
      await Promise.resolve();
    });

    // Confirms it advances after the remaining time
    expect(container.querySelector('img')?.src).not.toBe(initialSrc);
  });

  it('(d) a slide that fails to load is skipped', async () => {
    let callCount = 0;
    HTMLImageElement.prototype.decode = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Image decode error'));
    });

    const { container } = render(
      <HeroSlideshow {...mockProps} stillMs={5000} preloadLeadMs={15000} />
    );

    await act(async () => {
      await Promise.resolve();
    });

    const initialSrc = container.querySelector('img')?.src;

    // Advance to preload time (2500ms) where next slide is mounted and decode fails
    await act(async () => {
      vi.advanceTimersByTime(2500);
      await Promise.resolve();
    });

    // Allow third slide decode to succeed
    HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);

    // Advance to 5000ms + FADE_MS
    await act(async () => {
      vi.advanceTimersByTime(2500 + FADE_MS);
      await Promise.resolve();
    });

    // Confirm the slideshow advanced to the skipped slide
    const finalSrc = container.querySelector('img')?.src;
    expect(finalSrc).not.toBe(initialSrc);
  });
});
