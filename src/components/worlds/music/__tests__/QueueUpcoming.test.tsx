import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueModal } from '../QueueModal';
import { QueuePanel } from '../now-playing/QueuePanel';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

let mockLiveQueueData: { queue: any[] } | null = null;

vi.mock('@/hooks/useSpotify', () => ({
  useRecentlyPlayed: () => ({ data: [], isLoading: false }),
  usePlayerQueue: () => ({ data: mockLiveQueueData, isLoading: false }),
}));

vi.mock('../StickerIcon', () => ({
  StickerIcon: () => <span data-testid="sticker-icon" />,
}));

const sampleTracks = [
  { id: 't0', uri: 'spotify:track:0', name: 'Song 0', artists: [{ name: 'Artist 0' }], duration_ms: 180000 },
  { id: 't1', uri: 'spotify:track:1', name: 'Song 1', artists: [{ name: 'Artist 1' }], duration_ms: 200000 },
  { id: 't2', uri: 'spotify:track:2', name: 'Song 2', artists: [{ name: 'Artist 2' }], duration_ms: 210000 },
  { id: 't3', uri: 'spotify:track:3', name: 'Song 3', artists: [{ name: 'Artist 3' }], duration_ms: 220000 },
  { id: 't4', uri: 'spotify:track:4', name: 'Song 4', artists: [{ name: 'Artist 4' }], duration_ms: 240000 },
];

describe('Up Next Queue Upcoming Display and Store Index Mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSpotifyPlayerStore.setState({
      queue: sampleTracks.map((t) => ({ track: t, contextUri: undefined })),
      queueIndex: 2,
      currentTrack: sampleTracks[2],
    });
  });

  describe('QueueModal', () => {
    it('with a queue of 5 and index 2: shows 2 rows numbered 1 and 2, and counts upcoming only', () => {
      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      // Current song (Song 2) is in the Now Playing banner, but NOT in Up Next list
      expect(screen.getByText('Up Next (2 tracks)')).toBeTruthy();
      expect(screen.getByText('Up Next (2)')).toBeTruthy();
      expect(screen.getByText('2 Tracks')).toBeTruthy();

      // Only Song 3 and Song 4 are in the upcoming rows
      expect(screen.queryByText('Song 0')).toBeNull();
      expect(screen.queryByText('Song 1')).toBeNull();
      expect(screen.getByText('Song 3')).toBeTruthy();
      expect(screen.getByText('Song 4')).toBeTruthy();

      // Row numbering starts at 1 and 2
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.queryByText('3')).toBeNull();
      expect(screen.queryByText('4')).toBeNull();
      expect(screen.queryByText('5')).toBeNull();
    });

    it('playing displayed row 2 sets store index 4', () => {
      const playMock = vi.fn((idx: number) => {
        useSpotifyPlayerStore.getState().setQueueIndex(idx);
      });

      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
          playQueueItem={playMock}
        />
      );

      // Displayed row 2 is Song 4 (store index 4)
      const playButtons = screen.getAllByTitle('Play this track');
      expect(playButtons).toHaveLength(2);

      fireEvent.click(playButtons[1]);
      expect(playMock).toHaveBeenCalledWith(4);
      expect(useSpotifyPlayerStore.getState().queueIndex).toBe(4);
    });

    it('removing displayed row 1 removes store index 3', () => {
      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      // Displayed row 1 is Song 3 (store index 3)
      const removeButtons = screen.getAllByTitle('Remove from Queue');
      expect(removeButtons).toHaveLength(2);

      fireEvent.click(removeButtons[0]);

      const state = useSpotifyPlayerStore.getState();
      expect(state.queue).toHaveLength(4);
      expect(state.queue.map((q) => q.track.id)).toEqual(['t0', 't1', 't2', 't4']);
      expect(state.queueIndex).toBe(2);
    });

    it('a drag within the upcoming rows maps to the right store indexes (e.g. 3 to 4)', () => {
      const reorderSpy = vi.spyOn(useSpotifyPlayerStore.getState(), 'reorderQueue');

      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      const song3Row = screen.getByText('Song 3').closest('.mw-row')!;
      const song4Row = screen.getByText('Song 4').closest('.mw-row')!;

      fireEvent.dragStart(song3Row, { dataTransfer: { effectAllowed: 'move' } });
      fireEvent.dragOver(song4Row);
      fireEvent.drop(song4Row);

      expect(reorderSpy).toHaveBeenCalledWith(3, 4);
    });

    it('shuffle queue shuffles only upcoming tracks, keeping current track at index 2', () => {
      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      const shuffleButton = screen.getByRole('button', { name: /shuffle queue/i });
      fireEvent.click(shuffleButton);

      const state = useSpotifyPlayerStore.getState();
      expect(state.queueIndex).toBe(2);
      expect(state.queue[0].track.id).toBe('t0');
      expect(state.queue[1].track.id).toBe('t1');
      expect(state.queue[2].track.id).toBe('t2');
      // Tracks 3 and 4 are the ones shuffled
      const upcomingIds = [state.queue[3].track.id, state.queue[4].track.id].sort();
      expect(upcomingIds).toEqual(['t3', 't4']);
    });

    it('shows the empty state when nothing is upcoming (current index at last track)', () => {
      useSpotifyPlayerStore.setState({
        queueIndex: 4,
        currentTrack: sampleTracks[4],
      });

      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      expect(screen.getByText('Queue is Empty')).toBeTruthy();
      expect(screen.getByText('Up Next (0)')).toBeTruthy();
      expect(screen.getByText('0 Tracks')).toBeTruthy();
    });

    it('does not violate rules of hooks when toggling isOpen from false to true and back', () => {
      const { rerender } = render(
        <QueueModal
          isOpen={false}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );
      expect(screen.queryByText('Up Next (2)')).toBeNull();

      rerender(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );
      expect(screen.getByText('Up Next (2)')).toBeTruthy();

      rerender(
        <QueueModal
          isOpen={false}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );
      expect(screen.queryByText('Up Next (2)')).toBeNull();
    });
  });

  describe('QueuePanel', () => {
    it('with a queue of 5 and index 2: shows 2 rows numbered 1 and 2, and tab count 2', () => {
      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={vi.fn()}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      expect(screen.getByText('Queue (2)')).toBeTruthy();
      expect(screen.getByText('Song 3')).toBeTruthy();
      expect(screen.getByText('Song 4')).toBeTruthy();
      expect(screen.queryByText('Song 0')).toBeNull();
      expect(screen.queryByText('Song 1')).toBeNull();
      expect(screen.queryByText('Song 2')).toBeNull();

      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('playing displayed row 2 calls playQueueItem with store index 4', () => {
      const playMock = vi.fn().mockResolvedValue(undefined);

      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={playMock}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      const song4Row = screen.getByText('Song 4').closest('.mw-row')!;
      fireEvent.click(song4Row);

      expect(playMock).toHaveBeenCalledWith(4);
    });

    it('removing displayed row 1 removes store index 3', () => {
      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={vi.fn()}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      const removeButtons = screen.getAllByTitle('Remove from queue');
      expect(removeButtons).toHaveLength(2);

      fireEvent.click(removeButtons[0]);

      const state = useSpotifyPlayerStore.getState();
      expect(state.queue).toHaveLength(4);
      expect(state.queue.map((q) => q.track.id)).toEqual(['t0', 't1', 't2', 't4']);
      expect(state.queueIndex).toBe(2);
    });

    it('a drag within the upcoming rows maps to the right store indexes (e.g. 3 to 4)', () => {
      const reorderSpy = vi.spyOn(useSpotifyPlayerStore.getState(), 'reorderQueue');

      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={vi.fn()}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      const song3Row = screen.getByText('Song 3').closest('.mw-row')!;
      const song4Row = screen.getByText('Song 4').closest('.mw-row')!;

      fireEvent.dragStart(song3Row, { dataTransfer: { effectAllowed: 'move' } });
      fireEvent.dragOver(song4Row);
      fireEvent.drop(song4Row);

      expect(reorderSpy).toHaveBeenCalledWith(3, 4);
    });

    it('shows the empty state when nothing is upcoming', () => {
      useSpotifyPlayerStore.setState({
        queueIndex: 4,
        currentTrack: sampleTracks[4],
      });

      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={vi.fn()}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      expect(screen.getByText('QUEUE IS EMPTY')).toBeTruthy();
      expect(screen.getByText('Queue (0)')).toBeTruthy();
    });
  });

  describe('Move up and live queue guarantees', () => {
    it('move up is disabled on the first upcoming track to prevent moving above current song', () => {
      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      const moveUpButtons = screen.getAllByTitle('Move Up');
      expect(moveUpButtons).toHaveLength(2);

      // First upcoming row (Song 3 at store index 3, since current is index 2) cannot move up
      expect(moveUpButtons[0].hasAttribute('disabled')).toBe(true);

      // Second upcoming row (Song 4 at store index 4) can move up
      expect(moveUpButtons[1].hasAttribute('disabled')).toBe(false);
    });

    it('shows Spotify live queue as it is when store queue is empty', () => {
      useSpotifyPlayerStore.setState({
        queue: [],
        queueIndex: -1,
        currentTrack: null,
      });

      mockLiveQueueData = {
        queue: [
          { id: 'live-1', name: 'Live Track 1', uri: 'spotify:track:live1', duration_ms: 100000 },
          { id: 'live-2', name: 'Live Track 2', uri: 'spotify:track:live2', duration_ms: 110000 },
          { id: 'live-3', name: 'Live Track 3', uri: 'spotify:track:live3', duration_ms: 120000 },
        ],
      };

      // In QueueModal
      const { unmount } = render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      expect(screen.getByText('Up Next (3 tracks)')).toBeTruthy();
      expect(screen.getByText('Live Track 1')).toBeTruthy();
      expect(screen.getByText('Live Track 2')).toBeTruthy();
      expect(screen.getByText('Live Track 3')).toBeTruthy();
      unmount();

      // In QueuePanel
      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={vi.fn()}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      expect(screen.getByText('Queue (3)')).toBeTruthy();
      expect(screen.getByText('Live Track 1')).toBeTruthy();
      expect(screen.getByText('Live Track 2')).toBeTruthy();
      expect(screen.getByText('Live Track 3')).toBeTruthy();
    });
  });

  describe('Unknown tracks bug fix (tracks carrying track: true)', () => {
    it('isQueueItem, toQueueItem, and extractTrack correctly handle track objects with track: true', async () => {
      const { isQueueItem, toQueueItem, extractTrack } = await import(
        '../playback/playbackHelpers'
      );

      const trackWithTrackTrue = {
        id: 'mix-1',
        uri: 'spotify:track:mix1',
        name: 'Mix Track',
        artists: [{ name: 'Mix Artist' }],
        duration_ms: 180000,
        track: true,
      };

      // A track object carrying track: true is NOT a queue entry
      expect(isQueueItem(trackWithTrackTrue)).toBe(false);

      // toQueueItem wraps it in { track: trackWithTrackTrue } rather than confusing track: true
      const queueItem = toQueueItem(trackWithTrackTrue, 'spotify:playlist:mix');
      expect(queueItem.track).toEqual(trackWithTrackTrue);
      expect(queueItem.track.name).toBe('Mix Track');
      expect(queueItem.contextUri).toBe('spotify:playlist:mix');

      // extractTrack extracts the track itself
      expect(extractTrack(trackWithTrackTrue)).toEqual(trackWithTrackTrue);
      expect(extractTrack(queueItem)).toEqual(trackWithTrackTrue);

      // A genuine queue item is recognized
      expect(isQueueItem(queueItem)).toBe(true);
    });

    it('QueueModal and QueuePanel render track title and artist instead of Unknown Track when tracks have track: true', () => {
      const mixTracks = [
        { id: 'm0', uri: 'spotify:track:m0', name: 'Mix Song 0', artists: [{ name: 'Artist A' }], track: true, duration_ms: 180000 },
        { id: 'm1', uri: 'spotify:track:m1', name: 'Mix Song 1', artists: [{ name: 'Artist B' }], track: true, duration_ms: 200000 },
      ];

      useSpotifyPlayerStore.setState({
        queue: mixTracks.map((t) => ({ track: t, contextUri: undefined })),
        queueIndex: 0,
        currentTrack: mixTracks[0],
      });

      const { unmount } = render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      // Must display the real track name and artist, NOT "Unknown Track"
      expect(screen.getByText('Mix Song 1')).toBeTruthy();
      expect(screen.getByText('Artist B')).toBeTruthy();
      expect(screen.queryByText('Unknown Track')).toBeNull();
      unmount();

      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={vi.fn()}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      expect(screen.getByText('Mix Song 1')).toBeTruthy();
      expect(screen.getByText('Artist B')).toBeTruthy();
      expect(screen.queryByText('Unknown Track')).toBeNull();
    });
  });

  describe('Live queue copy resets queueIndex to -1 and Next/Prev handle -1', () => {
    it('copying live queue in QueueModal sets queueIndex to -1', () => {
      useSpotifyPlayerStore.setState({
        queue: [],
        queueIndex: 2,
        currentTrack: null,
      });

      mockLiveQueueData = {
        queue: [
          { id: 'live-1', name: 'Live Track 1', uri: 'spotify:track:live1', duration_ms: 100000 },
          { id: 'live-2', name: 'Live Track 2', uri: 'spotify:track:live2', duration_ms: 110000 },
        ],
      };

      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      // Trigger action that invokes ensureQueueInitialized (e.g. remove on row 0)
      const removeButtons = screen.getAllByTitle('Remove from Queue');
      fireEvent.click(removeButtons[0]);

      const state = useSpotifyPlayerStore.getState();
      // Store queue was initialized from live queue and item 0 was removed
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].track.name).toBe('Live Track 2');
      // queueIndex was set to -1 on copy
      expect(state.queueIndex).toBe(-1);
    });

    it('copying live queue in QueuePanel sets queueIndex to -1', () => {
      useSpotifyPlayerStore.setState({
        queue: [],
        queueIndex: 2,
        currentTrack: null,
      });

      mockLiveQueueData = {
        queue: [
          { id: 'live-1', name: 'Live Track 1', uri: 'spotify:track:live1', duration_ms: 100000 },
          { id: 'live-2', name: 'Live Track 2', uri: 'spotify:track:live2', duration_ms: 110000 },
        ],
      };

      render(
        <QueuePanel
          onExpand={vi.fn()}
          playQueueItem={vi.fn()}
          playTrack={vi.fn()}
          playContextTrack={vi.fn()}
          handleAddToQueue={vi.fn()}
          token="test-token"
        />
      );

      const removeButtons = screen.getAllByTitle('Remove from queue');
      fireEvent.click(removeButtons[0]);

      const state = useSpotifyPlayerStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].track.name).toBe('Live Track 2');
      expect(state.queueIndex).toBe(-1);
    });

    it('computeNextQueueIndex and computePrevQueueIndex properly handle queueIndex = -1', async () => {
      const { computeNextQueueIndex, computePrevQueueIndex } = await import(
        '../playback/playbackHelpers'
      );

      // Next track with queueIndex -1 moves to index 0
      expect(computeNextQueueIndex('off', 3, -1)).toBe(0);
      expect(computeNextQueueIndex('context', 3, -1)).toBe(0);
      expect(computeNextQueueIndex('track', 3, -1)).toBe(0);

      // Prev track with queueIndex -1 does not go negative
      expect(computePrevQueueIndex('off', 3, -1)).toBeNull();
      expect(computePrevQueueIndex('track', 3, -1)).toBeNull();
      // Context repeat wraps to last track
      expect(computePrevQueueIndex('context', 3, -1)).toBe(2);
    });
  });

  describe('Footer summary duration formatting in QueueModal', () => {
    it('displays only song count when total duration is 0', () => {
      const zeroDurationTracks = [
        { id: 'z0', uri: 'spotify:track:z0', name: 'Zero 0', duration_ms: 0 },
        { id: 'z1', uri: 'spotify:track:z1', name: 'Zero 1', duration_ms: 0 },
        { id: 'z2', uri: 'spotify:track:z2', name: 'Zero 2', duration_ms: 0 },
      ];

      useSpotifyPlayerStore.setState({
        queue: zeroDurationTracks.map((t) => ({ track: t, contextUri: undefined })),
        queueIndex: 0,
        currentTrack: zeroDurationTracks[0],
      });

      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      // 2 upcoming songs with 0 duration: displays "2 songs", not "2 songs · 0 min"
      expect(screen.getByText('2 songs')).toBeTruthy();
      expect(screen.queryByText(/· 0 min/)).toBeNull();
    });

    it('displays single song without "· 0 min" when duration is 0', () => {
      const zeroDurationTracks = [
        { id: 'z0', uri: 'spotify:track:z0', name: 'Zero 0', duration_ms: 0 },
        { id: 'z1', uri: 'spotify:track:z1', name: 'Zero 1', duration_ms: 0 },
      ];

      useSpotifyPlayerStore.setState({
        queue: zeroDurationTracks.map((t) => ({ track: t, contextUri: undefined })),
        queueIndex: 0,
        currentTrack: zeroDurationTracks[0],
      });

      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      expect(screen.getByText('1 song')).toBeTruthy();
      expect(screen.queryByText(/· 0 min/)).toBeNull();
    });

    it('displays song count and duration text when duration is > 0', () => {
      const positiveTracks = [
        { id: 'p0', uri: 'spotify:track:p0', name: 'Pos 0', duration_ms: 180000 },
        { id: 'p1', uri: 'spotify:track:p1', name: 'Pos 1', duration_ms: 120000 },
        { id: 'p2', uri: 'spotify:track:p2', name: 'Pos 2', duration_ms: 120000 },
      ];

      useSpotifyPlayerStore.setState({
        queue: positiveTracks.map((t) => ({ track: t, contextUri: undefined })),
        queueIndex: 0,
        currentTrack: positiveTracks[0],
      });

      render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          onPlayTrack={vi.fn()}
        />
      );

      // 2 upcoming songs with 120000 + 120000 = 240000 ms (4 min)
      expect(screen.getByText('2 songs · 4 min')).toBeTruthy();
    });
  });
});
