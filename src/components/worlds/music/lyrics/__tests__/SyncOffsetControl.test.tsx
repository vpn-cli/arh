import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncOffsetControl } from '../SyncOffsetControl';
import { applyLyricsOffset, LyricsData, setCachedLyrics } from '../useLyrics';
import { LyricsView } from '../LyricsView';
import { attachEstimatedWordTimings } from '@/lib/lyrics';

describe('Lyrics Sync Offset Subsystem', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  describe('applyLyricsOffset helper', () => {
    it('shifts line timeMs and word startMs/endMs by positive offsetMs', () => {
      const baseLines = attachEstimatedWordTimings([
        { timeMs: 1000, text: 'Hello world' },
      ]);
      const initialWordStart = baseLines[0].words![0].startMs;
      const initialWordEnd = baseLines[0].words![0].endMs;

      const shifted = applyLyricsOffset(baseLines, 250);
      expect(shifted).not.toBeNull();
      expect(shifted![0].timeMs).toBe(1250);
      expect(shifted![0].words![0].startMs).toBe(initialWordStart + 250);
      expect(shifted![0].words![0].endMs).toBe(initialWordEnd + 250);
    });

    it('shifts line timeMs and word timings by negative offsetMs', () => {
      const baseLines = attachEstimatedWordTimings([
        { timeMs: 2000, text: 'Early line' },
      ]);
      const initialWordStart = baseLines[0].words![0].startMs;

      const shifted = applyLyricsOffset(baseLines, -300);
      expect(shifted).not.toBeNull();
      expect(shifted![0].timeMs).toBe(1700);
      expect(shifted![0].words![0].startMs).toBe(initialWordStart - 300);
    });

    it('returns original array when offset is 0 or lines are null', () => {
      const baseLines = attachEstimatedWordTimings([
        { timeMs: 1000, text: 'Unchanged' },
      ]);
      expect(applyLyricsOffset(baseLines, 0)).toBe(baseLines);
      expect(applyLyricsOffset(null, 500)).toBeNull();
    });
  });

  describe('SyncOffsetControl Component', () => {
    it('renders -100ms, current offset display, +100ms, and Save button', () => {
      render(
        <SyncOffsetControl
          trackId="track-1"
          offsetMs={200}
          onOffsetChange={vi.fn()}
          onResync={vi.fn()}
          sessionSecret=""
          onSessionSecretChange={vi.fn()}
        />
      );

      expect(screen.getByText('-100ms')).toBeDefined();
      expect(screen.getByText('+200ms')).toBeDefined();
      expect(screen.getByText('+100ms')).toBeDefined();
      expect(screen.getByText('Save')).toBeDefined();
    });

    it('calls onOffsetChange and onResync when clicking -100ms and +100ms', () => {
      const onOffsetChange = vi.fn();
      const onResync = vi.fn();

      render(
        <SyncOffsetControl
          trackId="track-1"
          offsetMs={0}
          onOffsetChange={onOffsetChange}
          onResync={onResync}
          sessionSecret=""
          onSessionSecretChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('-100ms'));
      expect(onOffsetChange).toHaveBeenCalledWith(-100);
      expect(onResync).toHaveBeenCalled();

      fireEvent.click(screen.getByText('+100ms'));
      expect(onOffsetChange).toHaveBeenCalledWith(100);
      expect(onResync).toHaveBeenCalledTimes(2);
    });

    it('clamps offset between -5000ms and +5000ms', () => {
      const onOffsetChange = vi.fn();
      const onResync = vi.fn();

      const { rerender } = render(
        <SyncOffsetControl
          trackId="track-1"
          offsetMs={5000}
          onOffsetChange={onOffsetChange}
          onResync={onResync}
          sessionSecret=""
          onSessionSecretChange={vi.fn()}
        />
      );

      const plusBtn = screen.getByText('+100ms') as HTMLButtonElement;
      expect(plusBtn.disabled).toBe(true);

      rerender(
        <SyncOffsetControl
          trackId="track-1"
          offsetMs={-5000}
          onOffsetChange={onOffsetChange}
          onResync={onResync}
          sessionSecret=""
          onSessionSecretChange={vi.fn()}
        />
      );

      const minusBtn = screen.getByText('-100ms') as HTMLButtonElement;
      expect(minusBtn.disabled).toBe(true);
    });

    it('saves directly when sessionSecret is already present', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, trackId: 'track-1', offsetMs: 300 }),
      });
      global.fetch = fetchMock;

      const onSessionSecretChange = vi.fn();

      render(
        <SyncOffsetControl
          trackId="track-1"
          offsetMs={300}
          onOffsetChange={vi.fn()}
          onResync={vi.fn()}
          sessionSecret="supersecret"
          onSessionSecretChange={onSessionSecretChange}
        />
      );

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/lyrics', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-scrapbook-secret': 'supersecret',
          },
          body: JSON.stringify({
            trackId: 'track-1',
            offsetMs: 300,
          }),
        });
      });
    });

    it('prompts for admin secret once per session when sessionSecret is empty, and saves successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, trackId: 'track-1', offsetMs: -200 }),
      });
      global.fetch = fetchMock;

      const onSessionSecretChange = vi.fn();

      render(
        <SyncOffsetControl
          trackId="track-1"
          offsetMs={-200}
          onOffsetChange={vi.fn()}
          onResync={vi.fn()}
          sessionSecret=""
          onSessionSecretChange={onSessionSecretChange}
        />
      );

      // Clicking Save opens modal
      fireEvent.click(screen.getByText('Save'));
      expect(screen.getByText('ADMIN SECRET')).toBeDefined();

      const secretInput = screen.getByPlaceholderText('Enter admin secret...');
      fireEvent.change(secretInput, { target: { value: 'my-admin-key' } });

      fireEvent.click(screen.getByText('✓ SAVE'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/lyrics', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-scrapbook-secret': 'my-admin-key',
          },
          body: JSON.stringify({
            trackId: 'track-1',
            offsetMs: -200,
          }),
        });
        expect(onSessionSecretChange).toHaveBeenCalledWith('my-admin-key');
      });
    });

    it('shows error when admin secret is invalid (401)', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
      });
      global.fetch = fetchMock;

      render(
        <SyncOffsetControl
          trackId="track-1"
          offsetMs={100}
          onOffsetChange={vi.fn()}
          onResync={vi.fn()}
          sessionSecret="wrong-secret"
          onSessionSecretChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Invalid Admin Secret.')).toBeDefined();
      });
    });
  });

  describe('LyricsView edit mode header integration', () => {
    const mockTrackDisplay = {
      name: 'Song Title',
      artists: 'Artist Name',
    };

    it('shows SyncOffsetControl when edit mode is toggled on and track has synced lyrics', () => {
      const trackId = 'synced-track-1';
      setCachedLyrics(trackId, {
        synced: attachEstimatedWordTimings([
          { timeMs: 1000, text: 'Hello' },
        ]),
        plain: null,
        offsetMs: 0,
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

      // Initially edit mode is off, so offset controls are not visible
      expect(screen.queryByText('-100ms')).toBeNull();

      // Toggle edit mode ON
      fireEvent.click(screen.getByText('EDIT MODE'));
      expect(screen.getByText('EDIT MODE: ON')).toBeDefined();

      // SyncOffsetControl is now rendered
      expect(screen.getByText('-100ms')).toBeDefined();
      expect(screen.getByText('+100ms')).toBeDefined();
    });

    it('does NOT show SyncOffsetControl for instrumental or unsynced tracks even in edit mode', () => {
      const trackId = 'plain-track-1';
      setCachedLyrics(trackId, {
        synced: null,
        plain: 'Just plain words',
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

      // Toggle edit mode ON
      fireEvent.click(screen.getByText('EDIT MODE'));
      expect(screen.getByText('EDIT MODE: ON')).toBeDefined();

      // Offset control must NOT be rendered because track has no synced lyrics
      expect(screen.queryByText('-100ms')).toBeNull();
    });
  });
});
