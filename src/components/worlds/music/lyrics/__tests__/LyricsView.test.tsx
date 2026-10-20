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

    it('returns error status and does not throw if fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const result = await prefetchLyrics('failed-track');
      expect(result).toBeDefined();
      expect(result?.status).toBe('error');
      expect(result?.notFound).toBe(false);
    });

    it('caches error and prevents repeated fetches for the same errored track within 60s', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('503 Upstream Failure'));
      global.fetch = fetchMock;

      // First attempt triggers fetch and caches error
      const first = await prefetchLyrics('flaky-track');
      expect(first?.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second attempt within 60s cooldown returns cached error without re-fetching
      const second = await prefetchLyrics('flaky-track');
      expect(second?.status).toBe('error');
      expect(fetchMock).toHaveBeenCalledTimes(1);
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

    it('renders error view when lyrics status is error', async () => {
      const trackId = 'error-track';
      setCachedLyrics(trackId, {
        status: 'error',
        synced: null,
        plain: null,
        error: 'LRCLIB upstream failure: server_error',
        notFound: false,
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

      expect(screen.getByText('Lyrics are taking a nap')).toBeDefined();
      expect(screen.getByText('TRY AGAIN')).toBeDefined();
    });

    it('renders unsynced plain lyrics with scrollable overflow-y, min-h-0, and allows manual wheel/touch scrolling', async () => {
      const trackId = 'plain-track';
      const plainLyrics = 'Verse 1\nLine 1\nLine 2\n\nVerse 2\nLine 3\nLine 4\n\nOutro\nLast line';
      setCachedLyrics(trackId, {
        synced: null,
        plain: plainLyrics,
      });

      const { container } = render(
        <LyricsView
          trackId={trackId}
          trackDisplay={mockTrackDisplay}
          isPaused={false}
          getPositionMs={() => 0}
          onSeek={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('NOT SYNCED')).toBeDefined();
      expect(screen.getByText(/Verse 1/)).toBeDefined();

      const scrollContainer = container.querySelector('.lyrics-container') as HTMLElement;
      expect(scrollContainer).toBeDefined();

      // Assert container has overflow-y-auto, min-h-0, and custom-scrollbar, and not overflow-hidden
      expect(scrollContainer.classList.contains('overflow-y-auto')).toBe(true);
      expect(scrollContainer.classList.contains('overflow-hidden')).toBe(false);
      expect(scrollContainer.classList.contains('min-h-0')).toBe(true);
      expect(scrollContainer.classList.contains('custom-scrollbar')).toBe(true);
      expect(scrollContainer.classList.contains('overscroll-contain')).toBe(true);

      // Assert manual wheel event is not preventDefault'ed
      const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
      const wheelAllowed = scrollContainer.dispatchEvent(wheelEvent);
      expect(wheelAllowed).toBe(true);
      expect(wheelEvent.defaultPrevented).toBe(false);

      // Assert touchmove event is not preventDefault'ed
      const touchEvent = new Event('touchmove', { bubbles: true, cancelable: true });
      const touchAllowed = scrollContainer.dispatchEvent(touchEvent);
      expect(touchAllowed).toBe(true);
      expect(touchEvent.defaultPrevented).toBe(false);
    });

    it('ensures synced lyrics container uses overflow-hidden and handles wheel events for manual browsing', async () => {
      const trackId = 'synced-scroll-track';
      setCachedLyrics(trackId, {
        synced: attachEstimatedWordTimings([
          { timeMs: 1000, text: 'Synced Line 1' },
          { timeMs: 4000, text: 'Synced Line 2' },
        ]),
        plain: null,
      });

      const { container } = render(
        <LyricsView
          trackId={trackId}
          trackDisplay={mockTrackDisplay}
          isPaused={false}
          getPositionMs={() => 1000}
          onSeek={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const scrollContainer = container.querySelector('.lyrics-container') as HTMLElement;
      expect(scrollContainer.classList.contains('overflow-hidden')).toBe(true);
      expect(scrollContainer.classList.contains('overflow-y-auto')).toBe(false);
      expect(scrollContainer.classList.contains('min-h-0')).toBe(true);

      // For synced lyrics, wheel events are intercepted by custom scroller (default is prevented)
      const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
      act(() => {
        scrollContainer.dispatchEvent(wheelEvent);
      });
      expect(wheelEvent.defaultPrevented).toBe(true);
    });
  });
});
