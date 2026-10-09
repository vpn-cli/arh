import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { isValidContextUri } from '../SpotifyPlayerUI';
import { MixSection } from '../MixSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks used in MixSection
const mockMixTracks = [
  { id: 'track1', uri: 'spotify:track:track1', name: 'Track One', artists: [{ name: 'Artist A' }] },
  { id: 'track2', uri: 'spotify:track:track2', name: 'Track Two', artists: [{ name: 'Artist B' }] },
  { id: 'track3', uri: 'spotify:track:track3', name: 'Track Three', artists: [{ name: 'Artist C' }] },
];

vi.mock('@/hooks/useSpotify', () => ({
  useBirthdayMix: () => ({
    data: mockMixTracks,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRecentlyPlayed: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
  useTopTracks: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
  useTopArtists: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
  usePlaylists: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

describe('isValidContextUri guard', () => {
  it('identifies valid Spotify context URIs', () => {
    expect(isValidContextUri('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M')).toBe(true);
    expect(isValidContextUri('spotify:album:1DFixLWuPkv3KT3TnV35if')).toBe(true);
    expect(isValidContextUri('spotify:artist:06HL4z0CvFAxyc27GXpf02')).toBe(true);
    expect(isValidContextUri('spotify:show:4rOoJ6Egrf8K2IrywzwOMk')).toBe(true);
  });

  it('rejects invalid or non-context URIs', () => {
    // Not a valid Spotify context URI
    expect(isValidContextUri('spotify:mix')).toBe(false);
    expect(isValidContextUri('spotify:track:4cOdK2wGLETKBW3PvgPWqT')).toBe(false);
    expect(isValidContextUri('37i9dQZF1DXcBWIGoYBM5M')).toBe(false);
    expect(isValidContextUri('')).toBe(false);
    expect(isValidContextUri(undefined)).toBe(false);
    expect(isValidContextUri(null)).toBe(false);
    expect(isValidContextUri({ uri: 'spotify:playlist:123' })).toBe(false);
    expect(isValidContextUri(12345)).toBe(false);
  });
});

describe('MixSection playback', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    onPlayTrack: vi.fn(),
    onPlayTracks: vi.fn(),
    onAddToQueue: vi.fn(),
    onAddToPlaylist: vi.fn(),
    onClickArtist: vi.fn(),
    onClickPlaylist: vi.fn(),
    onAddMemory: vi.fn(),
    rateLimitTimer: null,
  };

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MixSection {...defaultProps} />
      </QueryClientProvider>
    );

  it('plays whole mix starting at tapped song without passing context URI', () => {
    renderComponent();

    // Tap the second song in the mix: "Track Two"
    const trackTwoButton = screen.getByRole('button', { name: /Play Track Two by Artist B/i });
    fireEvent.click(trackTwoButton);

    // Should call onPlayTracks with:
    // 1. All mix track URIs
    // 2. All mix track objects
    // 3. Offset position set to 1 (the index of Track Two)
    expect(defaultProps.onPlayTracks).toHaveBeenCalledWith(
      ['spotify:track:track1', 'spotify:track:track2', 'spotify:track:track3'],
      mockMixTracks,
      1
    );

    // Should NOT call onPlayTrack (especially not with 'spotify:mix' context URI)
    expect(defaultProps.onPlayTrack).not.toHaveBeenCalled();
  });

  it('plays whole mix starting at tapped first song (index 0)', () => {
    renderComponent();

    const trackOneButton = screen.getByRole('button', { name: /Play Track One by Artist A/i });
    fireEvent.click(trackOneButton);

    expect(defaultProps.onPlayTracks).toHaveBeenCalledWith(
      ['spotify:track:track1', 'spotify:track:track2', 'spotify:track:track3'],
      mockMixTracks,
      0
    );
  });
});
