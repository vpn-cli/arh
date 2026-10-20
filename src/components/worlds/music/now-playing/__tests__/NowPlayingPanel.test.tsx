import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NowPlayingPanel } from '../NowPlayingPanel';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

describe('NowPlayingPanel', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    useSpotifyPlayerStore.setState({
      currentTrack: {
        id: 'track-1',
        name: 'Bad Romance',
        artists: [{ id: 'artist-1', name: 'Lady Gaga' }],
        album: {
          id: 'album-1',
          name: 'The Fame Monster',
          images: [{ url: 'https://example.com/cover.jpg' }]
        },
        duration_ms: 294000
      },
      isPaused: false,
      accountTier: 'premium'
    });
  });

  it('renders artist line with text-body, font-pixel, medium weight, and truncate', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NowPlayingPanel
          showLyrics={false}
          onToggleLyrics={() => {}}
          isSaved={false}
          toggleSaveTrack={async () => {}}
          getPositionMs={() => 0}
          onSeek={() => {}}
          onDragSeek={() => {}}
          token="mock-token"
          togglePlay={async () => {}}
          prevTrack={() => {}}
          nextTrack={() => {}}
          toggleShuffle={async () => {}}
          toggleRepeat={async () => {}}
          onExpandQueue={() => {}}
          playQueueItem={async () => {}}
          playTrack={async () => {}}
          playContextTrack={async () => {}}
          handleAddToQueue={async () => {}}
        />
      </QueryClientProvider>
    );

    const titleEl = screen.getByText('Bad Romance');
    expect(titleEl).toBeDefined();
    expect(titleEl.className).toContain('text-title');

    const artistEl = screen.getByText('Lady Gaga');
    expect(artistEl).toBeDefined();
    expect(artistEl.className).toContain('text-body');
    expect(artistEl.className).toContain('font-pixel');
    expect(artistEl.className).toContain('font-medium');
    expect(artistEl.className).toContain('truncate');
  });

  it('renders long multi-artist string with text-body and truncate', () => {
    useSpotifyPlayerStore.setState({
      currentTrack: {
        id: 'track-2',
        name: 'Die Hard',
        artists: [
          { id: 'a1', name: 'Kendrick Lamar' },
          { id: 'a2', name: 'Blxst' },
          { id: 'a3', name: 'Amanda Reif' }
        ],
        album: {
          id: 'album-2',
          name: 'Mr. Morale & the Big Steppers',
          images: [{ url: 'https://example.com/cover2.jpg' }]
        },
        duration_ms: 200000
      }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <NowPlayingPanel
          showLyrics={false}
          onToggleLyrics={() => {}}
          isSaved={false}
          toggleSaveTrack={async () => {}}
          getPositionMs={() => 0}
          onSeek={() => {}}
          onDragSeek={() => {}}
          token="mock-token"
          togglePlay={async () => {}}
          prevTrack={() => {}}
          nextTrack={() => {}}
          toggleShuffle={async () => {}}
          toggleRepeat={async () => {}}
          onExpandQueue={() => {}}
          playQueueItem={async () => {}}
          playTrack={async () => {}}
          playContextTrack={async () => {}}
          handleAddToQueue={async () => {}}
        />
      </QueryClientProvider>
    );

    const longArtistEl = screen.getByText('Kendrick Lamar, Blxst, Amanda Reif');
    expect(longArtistEl).toBeDefined();
    expect(longArtistEl.className).toContain('text-body');
    expect(longArtistEl.className).toContain('truncate');
  });
});
