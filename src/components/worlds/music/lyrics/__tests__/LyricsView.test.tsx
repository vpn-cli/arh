import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LyricsView, LyricsViewHandle } from '../LyricsView';
import { prefetchLyrics, getCachedLyrics, setCachedLyrics } from '../useLyrics';
import { findActiveLyricIndex, syncActiveLineWordDelays } from '../useLyricsScroll';
import { attachEstimatedWordTimings } from '@/lib/lyrics';

describe('Lyrics Modules & Extraction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('useLyrics & prefetchLyrics', () => {
    it('prefetchLyrics fills module-level cache and attaches estimated timings', async () => {
      const mockTrackId = 'test-track-123';
      const rawData = {
        synced: [
          { timeMs: 1000, text: 'First line of the song' },
          { timeMs: 4000, text: 'Second line here' },
        ],
        plain: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => JSON.parse(JSON.stringify(rawData)),
      } as any);

      const result = await prefetchLyrics(mockTrackId);
      expect(result).not.toBeNull();
      expect(result?.synced).toHaveLength(2);
      expect(result?.synced?.[0].words).toBeDefined();

      const cached = getCachedLyrics(mockTrackId);
      expect(cached).toEqual(result);
    });

    it('returns null and does not throw if fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const result = await prefetchLyrics('failed-track');
      expect(result).toBeNull();
    });
  });

  describe('useLyricsScroll helpers', () => {
    const timedLines = attachEstimatedWordTimings([
      { timeMs: 1000, text: 'First' },
      { timeMs: 3000, text: 'Second' },
      { timeMs: 6000, text: 'Third' },
    ]);

    it('findActiveLyricIndex identifies correct active line given playback timestamp', () => {
      expect(findActiveLyricIndex(timedLines, 500)).toBe(-1);
      expect(findActiveLyricIndex(timedLines, 1000)).toBe(0);
      expect(findActiveLyricIndex(timedLines, 2500)).toBe(0);
      expect(findActiveLyricIndex(timedLines, 3000)).toBe(1);
      expect(findActiveLyricIndex(timedLines, 5999)).toBe(1);
      expect(findActiveLyricIndex(timedLines, 7000)).toBe(2);
    });

    it('syncActiveLineWordDelays applies correct animation delays to word elements', () => {
      const div = document.createElement('div');
      div.innerHTML = '<span class="lyric-word">First</span>';
      syncActiveLineWordDelays(0, 1200, div, timedLines[0]);
      const wordEl = div.querySelector<HTMLElement>('.lyric-word');
      expect(wordEl?.style.animationName).toBe('lyric-word-wipe');
    });
  });

  describe('LyricsView Component', () => {
    const mockTrackDisplay = {
      name: 'Song Title',
      artists: 'Artist Name',
      art: 'https://example.com/art.jpg',
    };

    it('renders synced lyrics and calls onSeek and onClose', async () => {
      const trackId = 'synced-track';
      setCachedLyrics(trackId, {
        synced: attachEstimatedWordTimings([
          { timeMs: 1000, text: 'Line One' },
          { timeMs: 4000, text: 'Line Two' },
        ]),
        plain: null,
      });

      const onSeek = vi.fn();
      const onClose = vi.fn();
      const getPositionMs = vi.fn().mockReturnValue(1500);

      render(
        <LyricsView
          trackId={trackId}
          trackDisplay={mockTrackDisplay}
          isPaused={false}
          getPositionMs={getPositionMs}
          onSeek={onSeek}
          onClose={onClose}
        />
      );

      expect(screen.getByText('One')).toBeDefined();
      expect(screen.getByText('Two')).toBeDefined();

      // Clicking line calls onSeek
      fireEvent.click(screen.getByText('Two'));
      expect(onSeek).toHaveBeenCalledWith(4000);

      // Close button calls onClose
      fireEvent.click(screen.getByLabelText('Close Lyrics'));
      expect(onClose).toHaveBeenCalled();
    });

    it('exposes resync() handle to resynchronize active line and word timing', async () => {
      const trackId = 'resync-track';
      setCachedLyrics(trackId, {
        synced: attachEstimatedWordTimings([
          { timeMs: 0, text: 'Intro' },
          { timeMs: 5000, text: 'Verse' },
        ]),
        plain: null,
      });

      let currentPos = 500;
      const getPositionMs = () => currentPos;
      const ref = createRef<LyricsViewHandle>();

      render(
        <LyricsView
          ref={ref}
          trackId={trackId}
          trackDisplay={mockTrackDisplay}
          isPaused={false}
          getPositionMs={getPositionMs}
          onSeek={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.resync).toBe('function');

      // Update position and call resync
      currentPos = 5500;
      act(() => {
        ref.current?.resync();
      });

      // Active line should now be Verse
      const verseWord = screen.getByText('Verse');
      expect(verseWord.classList.contains('lyric-word-active')).toBe(true);
      expect(verseWord.parentElement?.classList.contains('lyric-line-active')).toBe(true);
    });

    it('renders instrumental view when track is instrumental', async () => {
      const trackId = 'instrumental-track';
      setCachedLyrics(trackId, {
        synced: null,
        plain: null,
        instrumental: true,
      });

      render(
        <LyricsView
          trackId={trackId}
          trackDisplay={mockTrackDisplay}
          isPaused={false}
          getPositionMs={() => 0}
          onSeek={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('INSTRUMENTAL')).toBeDefined();
      expect(screen.getByText('This track is an instrumental')).toBeDefined();
    });

    it('renders not-found view when lyrics are not found', async () => {
      const trackId = 'missing-track';
      setCachedLyrics(trackId, {
        synced: null,
        plain: null,
        notFound: true,
      });

      render(
        <LyricsView
          trackId={trackId}
          trackDisplay={mockTrackDisplay}
          isPaused={false}
          getPositionMs={() => 0}
          onSeek={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('No lyrics found for this track')).toBeDefined();
      expect(screen.getByText('Song Title')).toBeDefined();
    });
  });
});
