import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VinylRecord } from '../VinylRecord';
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
      });

      // Flips back to front
      expect(screen.getByRole('button', { name: /flip record to side b/i })).toBeDefined();
    });
  });

  describe('2. Sleeve on track change', () => {
    it('slides old record into sleeve and new one out over about 450ms', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);

      // Initial cover image
      const img = screen.getByAltText('Album Cover') as HTMLImageElement;
      expect(img.src).toContain('cover1.jpg');

      // Change track to mockTrack2
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
      });

      // Still showing old track during slide-in (~220ms)
      expect(img.src).toContain('cover1.jpg');

      // Advance past slide-in
      act(() => {
        vi.advanceTimersByTime(225);
      });

      // Swapped to new track during slide-out
      expect(img.src).toContain('cover2.jpg');

      // Advance to full 450ms
      act(() => {
        vi.advanceTimersByTime(230);
      });

      expect(img.src).toContain('cover2.jpg');
    });

    it('jumps straight to final state if another track change arrives mid-animation', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} />);
      const img = screen.getByAltText('Album Cover') as HTMLImageElement;

      // Track changes to track2 (starts animation)
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack2} isPaused={false} />);
      });

      // Mid-animation at 100ms: user quickly switches to track3
      act(() => {
        vi.advanceTimersByTime(100);
        rerender(<VinylRecord currentTrack={mockTrack3} isPaused={false} />);
      });

      // Must jump straight to final state with track3 without delay
      expect(img.src).toContain('cover3.jpg');
    });
  });

  describe('3. Like reaction', () => {
    it('renders sticker r2c1 when likeTrigger fires and fades after one turn', () => {
      const { rerender } = render(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={0} />);
      expect(screen.queryByAltText('')).toBeNull();

      // Song saved through LikeButton triggers like reaction
      act(() => {
        rerender(<VinylRecord currentTrack={mockTrack1} isPaused={false} likeTrigger={1} />);
      });

      const stickerImg = document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]');
      expect(stickerImg).not.toBeNull();

      // After 1800ms ride and fade completes
      act(() => {
        vi.advanceTimersByTime(1850);
      });

      const finishedSticker = document.querySelector('img[src="/stickers/snoopy-v1/r2c1.png"]');
      expect(finishedSticker).toBeNull();
    });
  });
});
