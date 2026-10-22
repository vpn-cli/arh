import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, render } from '@testing-library/react';
import { useLyricsTrackDisplay } from '../useLyricsTrackDisplay';
import type { LyricsTrackDisplay } from '../LyricsView';

describe('useLyricsTrackDisplay (T2)', () => {
  it('stabilizes lyricsTrackDisplay reference when currentTrack is re-set with a new object having identical primitives', () => {
    const trackInstance1 = {
      id: 'track-1',
      name: 'See You Again',
      artists: [{ name: 'Tyler, The Creator' }, { name: 'Kali Uchis' }],
      album: { images: [{ url: 'https://example.com/art.jpg' }] },
      position_ms: 0,
    };

    const { result, rerender } = renderHook<any, { track: any }>(
      ({ track }) => useLyricsTrackDisplay(track),
      { initialProps: { track: trackInstance1 } }
    );

    const initialDisplay = result.current.lyricsTrackDisplay;
    expect(result.current.full).toBe('Tyler, The Creator, Kali Uchis');
    expect(result.current.primary).toBe('Tyler, The Creator');
    expect(result.current.artUrl).toBe('https://example.com/art.jpg');
    expect(initialDisplay).toEqual({
      name: 'See You Again',
      artists: 'Tyler, The Creator, Kali Uchis',
      primaryArtist: 'Tyler, The Creator',
      art: 'https://example.com/art.jpg',
    });

    // Simulate SDK playback event: new object reference for the same track (e.g. seek, pause, position)
    const trackInstance2 = {
      id: 'track-1',
      name: 'See You Again',
      artists: [{ name: 'Tyler, The Creator' }, { name: 'Kali Uchis' }],
      album: { images: [{ url: 'https://example.com/art.jpg' }] },
      position_ms: 45000,
    };
    expect(trackInstance2).not.toBe(trackInstance1);

    rerender({ track: trackInstance2 });

    // Reference equality MUST be preserved across re-renders
    expect(result.current.lyricsTrackDisplay).toBe(initialDisplay);

    // When a truly new track arrives, reference must update
    const trackInstance3 = {
      id: 'track-2',
      name: 'EARFQUAKE',
      artists: [{ name: 'Tyler, The Creator' }],
      album: { images: [{ url: 'https://example.com/earfquake.jpg' }] },
    };

    rerender({ track: trackInstance3 });

    expect(result.current.lyricsTrackDisplay).not.toBe(initialDisplay);
    expect(result.current.lyricsTrackDisplay.name).toBe('EARFQUAKE');
    expect(result.current.lyricsTrackDisplay.primaryArtist).toBe('Tyler, The Creator');
  });

  it('prevents React.memo consumer re-renders when currentTrack object reference changes with identical primitives', () => {
    const renderSpy = vi.fn();

    const MemoChild = React.memo(function MemoChild({
      display,
    }: {
      display: LyricsTrackDisplay;
    }) {
      renderSpy(display);
      return <div data-testid="child">{display.name}</div>;
    });

    function TestParent({ track }: { track: any }) {
      const { lyricsTrackDisplay } = useLyricsTrackDisplay(track);
      return <MemoChild display={lyricsTrackDisplay} />;
    }

    const trackA1 = {
      id: 'track-42',
      name: 'Back Home',
      artists: [{ name: 'Yeat' }, { name: 'Joji' }],
      album: { images: ['https://example.com/album.jpg'] },
    };

    const { rerender } = render(<TestParent track={trackA1} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with new object reference for trackA
    const trackA2 = {
      id: 'track-42',
      name: 'Back Home',
      artists: [{ name: 'Yeat' }, { name: 'Joji' }],
      album: { images: ['https://example.com/album.jpg'] },
      isPaused: true,
    };
    rerender(<TestParent track={trackA2} />);

    // MemoChild MUST NOT re-render because lyricsTrackDisplay reference was stable
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with a different track ID
    const trackB = {
      id: 'track-99',
      name: 'New Song',
      artists: [{ name: 'New Artist' }],
      album: { images: [] },
    };
    rerender(<TestParent track={trackB} />);

    // MemoChild re-renders for genuine track change
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });
});
