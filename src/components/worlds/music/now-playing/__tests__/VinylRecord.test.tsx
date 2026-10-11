import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VinylRecord, LIKE_REACTION_DURATION_MS } from '../VinylRecord';
import { useMemoriesStore } from '@/store/useMemoriesStore';

vi.mock('@/lib/memoriesClient', () => ({
  memoriesFetch: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
}));

describe('VinylRecord interactions', () => {
  const mockTrack1 = {
    id: 'track1',
    uri: 'spotify:track:track1',
    name: 'Song One',
    album: { images: [{ url: 'https://example.com/cover1.jpg' }] },
  };

  const mockTrack2 = {
    id: 'track2',
    uri: 'spotify:track:track2',
    name: 'Song Two',
    album: { images: [{ url: 'https://example.com/cover2.jpg' }] },
  };

  const mockTrack3 = {
    id: 'track3',
    uri: 'spotify:track:track3',
    name: 'Song Three',
    album: { images: [{ url: 'https://example.com/cover3.jpg' }] },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    useMemoriesStore.setState({
      memories: [
        {
          id: 'mem-1',
          spotifyUri: 'spotify:track:track1',
          entityType: 'track',
          note: 'Summer road trip memory',
          category: 'ROAD TRIP',
          dateLabel: 'Aug 2024',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('1. Flip to side B', () => {
    it('is a real button with accessible label stating what it does', () => {
      render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const button = screen.getByRole('button', { name: /flip record to side b/i });
      expect(button).toBeDefined();
      expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('shows bookmark marker with no pulse animation on front label when current song has a memory', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const marker = screen.getByTitle('Memory saved');
      expect(marker).toBeDefined();

      // Bookmark SVG icon check
      const svg = marker.querySelector('svg');
      expect(svg).not.toBeNull();
      const path = svg?.querySelector('path');
      expect(path?.getAttribute('d')).toContain('M17 3H7');

      // No pulse animation
      expect(marker.className).not.toContain('animate-pulse');

      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
        vi.runOnlyPendingTimers();
      });
      expect(screen.queryByTitle('Memory saved')).toBeNull();
    });

    it('applies .vinyl-flipped class to flipper when flipped', () => {
      const { container } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const flipper = container.querySelector('.vinyl-flipper');
      expect(flipper?.classList.contains('vinyl-flipped')).toBe(false);

      const flipBtn = screen.getByRole('button', { name: /flip record to side b/i });
      act(() => {
        fireEvent.click(flipBtn);
      });

      expect(flipper?.classList.contains('vinyl-flipped')).toBe(true);
    });

    it('applies inert and aria-hidden to the hidden face', () => {
      const { container } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);

      const sideA = screen.getByRole('button', { name: /flip record to side b/i });
      const sideB = container.querySelector('.vinyl-back') as HTMLElement;

      // Initially Side A is visible, Side B is hidden
      expect(sideA.hasAttribute('inert')).toBe(false);
      expect(sideA.getAttribute('aria-hidden')).toBeNull();
      expect(sideB.hasAttribute('inert')).toBe(true);
      expect(sideB.getAttribute('aria-hidden')).toBe('true');

      // Flip to Side B
      act(() => {
        fireEvent.click(sideA);
      });

      // Side A is now hidden, Side B is visible
      expect(sideA.hasAttribute('inert')).toBe(true);
      expect(sideA.getAttribute('aria-hidden')).toBe('true');
      expect(sideB.hasAttribute('inert')).toBe(false);
      expect(sideB.getAttribute('aria-hidden')).toBeNull();
    });

    it('flips to side B on click and shows the saved memory with var(--color-dark) styling', () => {
      render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const flipBtn = screen.getByRole('button', { name: /flip record to side b/i });

      act(() => {
        fireEvent.click(flipBtn);
      });

      const noteEl = screen.getByText('Summer road trip memory');
      const catEl = screen.getByText('ROAD TRIP');
      const editBtn = screen.getByRole('button', { name: /edit memory/i });

      expect(noteEl).toBeDefined();
      expect(catEl).toBeDefined();
      expect(catEl.className).toContain('text-[var(--color-dark)]');
      expect(catEl.className).not.toContain('text-[var(--color-vibrant)]');
      expect(editBtn.className).toContain('text-[var(--color-dark)]');
      expect(editBtn.className).not.toContain('text-[var(--color-vibrant)]');
      expect(screen.getByText('Aug 2024')).toBeDefined();
    });

    it('shows "Add a memory" button on side B when song has no memory and opens editor on click', () => {
      const onAddMemory = vi.fn();
      render(<VinylRecord currentTrack={mockTrack2} isPaused={false} onAddMemory={onAddMemory} />);
      const flipBtn = screen.getByRole('button', { name: /flip record to side b/i });

      act(() => {
        fireEvent.click(flipBtn);
      });

      const addMemBtn = screen.getByRole('button', { name: /^add a memory$/i });
      expect(addMemBtn).toBeDefined();

      act(() => {
        fireEvent.click(addMemBtn);
      });

      expect(onAddMemory).toHaveBeenCalledWith(mockTrack2, 'track');
    });

    it('returns to front side A when track changes', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const flipBtn = screen.getByRole('button', { name: /flip record to side b/i });

      act(() => {
        fireEvent.click(flipBtn);
      });
      expect(screen.getByText('Summer road trip memory')).toBeDefined();

      // Track changes to track2
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
        vi.runOnlyPendingTimers();
      });

      // Flips back to front
      expect(screen.getByRole('button', { name: /flip record to side b/i })).toBeDefined();
    });
  });

  describe('2. Sleeve on track change', () => {
    const mockTrack4 = {
      id: 'track4',
      uri: 'spotify:track:track4',
      name: 'Song Four',
      album: { images: [{ url: 'https://example.com/cover4.jpg' }] },
    };

    const mockTrack5 = {
      id: 'track5',
      uri: 'spotify:track:track5',
      name: 'Song Five',
      album: { images: [{ url: 'https://example.com/cover5.jpg' }] },
    };

    it('slides old record into sleeve and new one out over about 750ms', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);

      // Initial cover image
      const img = screen.getByAltText('Album Cover') as HTMLImageElement;
      expect(img.src).toContain('cover1.jpg');

      // Change track to mockTrack2
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
      });

      // Still showing old track during slide-in (~375ms)
      expect(img.src).toContain('cover1.jpg');

      // Sticker pops up behind sleeve (56px, max-w-none)
      const sleeveSticker = document.querySelector('img[src="/stickers/snoopy-v1/r2c3.png"]') as HTMLImageElement;
      expect(sleeveSticker).not.toBeNull();
      expect(sleeveSticker.classList.contains('max-w-none')).toBe(true);
      expect(sleeveSticker.getAttribute('width')).toBe('56');
      expect(sleeveSticker.getAttribute('height')).toBe('56');

      // Advance past slide-in
      act(() => {
        vi.advanceTimersByTime(380);
      });

      // Swapped to new track during slide-out
      expect(img.src).toContain('cover2.jpg');

      // Advance to full 750ms
      act(() => {
        vi.advanceTimersByTime(380);
      });

      expect(img.src).toContain('cover2.jpg');
      // Sticker disappears when idle
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c3.png"]')).toBeNull();
    });

    it('(a) new, old, new within 100ms plays one full transition', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const img = screen.getByAltText('Album Cover') as HTMLImageElement;

      // t=0ms: change to new track2 (starts transition)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
      });
      expect(img.src).toContain('cover1.jpg');
      expect(document.querySelector('.vinyl-slide-into-sleeve')).not.toBeNull();

      // t=40ms: brief revert to old track1 arrives
      act(() => {
        vi.advanceTimersByTime(40);
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      });
      // Should NOT cancel the animation
      expect(document.querySelector('.vinyl-slide-into-sleeve')).not.toBeNull();

      // t=90ms: new track2 arrives again
      act(() => {
        vi.advanceTimersByTime(50);
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
      });
      // Still in slide-in
      expect(img.src).toContain('cover1.jpg');

      // Advance to 375ms (slide-in finishes, swaps to track2, slide-out starts)
      act(() => {
        vi.advanceTimersByTime(290);
      });
      expect(img.src).toContain('cover2.jpg');
      expect(document.querySelector('.vinyl-slide-to-center')).not.toBeNull();

      // Advance remaining slide-out (375ms)
      act(() => {
        vi.advanceTimersByTime(380);
      });
      expect(img.src).toContain('cover2.jpg');
      expect(document.querySelector('.vinyl-slide-into-sleeve')).toBeNull();
      expect(document.querySelector('.vinyl-slide-to-center')).toBeNull();
    });

    it('(b) a third different track mid-transition jumps to the final state', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const img = screen.getByAltText('Album Cover') as HTMLImageElement;

      // Track changes to track2 (starts animation)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
      });
      expect(document.querySelector('.vinyl-slide-into-sleeve')).not.toBeNull();

      // Mid-animation at 100ms: user quickly switches to genuinely different track3
      act(() => {
        vi.advanceTimersByTime(100);
        rerender(<VinylRecord currentTrack={mockTrack3} isPaused={false} />);
      });

      // Must jump straight to final state with track3 without delay and idle phase
      expect(img.src).toContain('cover3.jpg');
      expect(document.querySelector('.vinyl-slide-into-sleeve')).toBeNull();
      expect(document.querySelector('.vinyl-slide-to-center')).toBeNull();
    });

    it('(c) the sticker cycles through the list in order', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);

      // Change 1: track1 -> track2 (index 0: r2c3)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c3.png"]')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(760);
      });

      // Change 2: track2 -> track3 (index 1: r2c4)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack3} isPaused={false} />);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c4.png"]')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(760);
      });

      // Change 3: track3 -> mockTrack4 (index 2: r3c1)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack4} isPaused={false} />);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r3c1.png"]')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(760);
      });

      // Change 4: mockTrack4 -> mockTrack5 (index 3: r5c2)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack5} isPaused={false} />);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r5c2.png"]')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(760);
      });

      // Change 5: mockTrack5 -> mockTrack1 (wraps to index 0: r2c3)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c3.png"]')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(760);
      });
    });
  });

  describe('3. Like reaction', () => {
    it('renders sticker r2c1 when likeTrigger fires and fades after one turn (4 seconds)', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={0} />);
      expect(screen.queryByAltText('')).toBeNull();

      // Song saved through LikeButton triggers like reaction
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={1} />);
      });

      const stickerImg = document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]');
      expect(stickerImg).not.toBeNull();

      // Still running at halfway (2000ms)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]')).not.toBeNull();

      // After 4000ms duration completes
      act(() => {
        vi.advanceTimersByTime(LIKE_REACTION_DURATION_MS - 2000 + 50);
      });

      const finishedSticker = document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]');
      expect(finishedSticker).toBeNull();
    });

    it('renders sticker image in DOM at 72px, centered on orbit point, with max-w-none', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={0} />);

      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={1} />);
      });

      const stickerImg = document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]') as HTMLImageElement;
      expect(stickerImg).not.toBeNull();
      // Ensure the image inside the 0-width rotator box is not constrained to 0 width by Tailwind img { max-width: 100% }
      expect(stickerImg.classList.contains('max-w-none')).toBe(true);
      expect(stickerImg.classList.contains('w-[72px]')).toBe(true);
      expect(stickerImg.classList.contains('h-[72px]')).toBe(true);
      expect(stickerImg.classList.contains('-translate-x-1/2')).toBe(true);
      expect(stickerImg.classList.contains('-translate-y-1/2')).toBe(true);
      expect(stickerImg.getAttribute('width')).toBe('72');
      expect(stickerImg.getAttribute('height')).toBe('72');

      act(() => {
        vi.advanceTimersByTime(LIKE_REACTION_DURATION_MS + 50);
      });
    });

    it('passes custom property for duration to CSS', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={0} />);

      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={1} />);
      });

      const rotator = document.querySelector('.vinyl-orbit-rotator') as HTMLElement;
      expect(rotator).not.toBeNull();
      expect(rotator.style.getPropertyValue('--vinyl-reaction-duration')).toBe(`${LIKE_REACTION_DURATION_MS}ms`);

      act(() => {
        vi.advanceTimersByTime(LIKE_REACTION_DURATION_MS + 50);
      });
    });

    it('restarts cleanly from the beginning if a second star arrives while reaction is running', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={0} />);

      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={1} />);
      });

      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]')).not.toBeNull();

      // Advance halfway through (2000ms)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]')).not.toBeNull();

      // Second star arrives while reaction is running
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={2} />);
      });

      // Advance by another 2500ms (total 4500ms since star 1, but only 2500ms since star 2)
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      // Reaction should still be active because second star restarted the 4s timer
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]')).not.toBeNull();

      // Advance remaining time for second star (1550ms, exceeding 4000ms from star 2)
      act(() => {
        vi.advanceTimersByTime(1550);
      });
      expect(document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]')).toBeNull();
    });
  });
});
