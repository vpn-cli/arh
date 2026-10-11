import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackActionsMenu } from '../TrackActionsMenu';

describe('TrackActionsMenu component', () => {
  const mockTrack = {
    id: 'track-123',
    name: 'Test Song',
    uri: 'spotify:track:track-123',
    artists: [{ id: 'artist-456', name: 'Test Artist' }],
    album: { id: 'album-789', name: 'Test Album' },
    external_urls: { spotify: 'https://open.spotify.com/track/track-123' },
  };

  const defaultProps = {
    track: mockTrack,
    onAddToQueue: vi.fn(),
    onAddToPlaylist: vi.fn(),
    onAddMemory: vi.fn(),
    onOpenArtist: vi.fn(),
    onOpenAlbum: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button and is not open initially', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    const button = screen.getByRole('button', { name: /track options/i });
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens menu on click and lists all available items', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    const button = screen.getByRole('button', { name: /track options/i });
    fireEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    const menu = screen.getByRole('menu');
    expect(menu).toBeTruthy();

    expect(screen.getByRole('menuitem', { name: 'Add to queue' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Add to playlist' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Add memory' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Go to artist' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Go to album' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Open in Spotify' })).toBeTruthy();
  });

  it('calls onAddToQueue and closes menu on item selection', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /track options/i }));

    const item = screen.getByRole('menuitem', { name: 'Add to queue' });
    fireEvent.click(item);

    expect(defaultProps.onAddToQueue).toHaveBeenCalledWith(mockTrack);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('calls onAddToPlaylist and closes menu on item selection', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /track options/i }));

    const item = screen.getByRole('menuitem', { name: 'Add to playlist' });
    fireEvent.click(item);

    expect(defaultProps.onAddToPlaylist).toHaveBeenCalledWith('spotify:track:track-123');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('calls onAddMemory and closes menu on item selection', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /track options/i }));

    const item = screen.getByRole('menuitem', { name: 'Add memory' });
    fireEvent.click(item);

    expect(defaultProps.onAddMemory).toHaveBeenCalledWith(mockTrack, 'track');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('calls onOpenArtist with first artist id', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /track options/i }));

    const item = screen.getByRole('menuitem', { name: 'Go to artist' });
    fireEvent.click(item);

    expect(defaultProps.onOpenArtist).toHaveBeenCalledWith('artist-456');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('calls onOpenAlbum with album id', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /track options/i }));

    const item = screen.getByRole('menuitem', { name: 'Go to album' });
    fireEvent.click(item);

    expect(defaultProps.onOpenAlbum).toHaveBeenCalledWith('album-789');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens in Spotify in new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<TrackActionsMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /track options/i }));

    const item = screen.getByRole('menuitem', { name: 'Open in Spotify' });
    fireEvent.click(item);

    expect(openSpy).toHaveBeenCalledWith('https://open.spotify.com/track/track-123', '_blank');
    expect(screen.queryByRole('menu')).toBeNull();
    openSpy.mockRestore();
  });

  it('closes on Escape key press and returns focus to button', () => {
    render(<TrackActionsMenu {...defaultProps} />);
    const button = screen.getByRole('button', { name: /track options/i });
    fireEvent.click(button);

    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on outside click', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TrackActionsMenu {...defaultProps} />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /track options/i }));
    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('hides items that cannot work for the track', () => {
    const limitedTrack = {
      id: 'track-no-album-no-artist',
      name: 'Solo',
      // no album, no artists
    };

    render(
      <TrackActionsMenu
        track={limitedTrack}
        onAddToQueue={vi.fn()}
        onOpenArtist={vi.fn()}
        onOpenAlbum={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /track options/i }));

    expect(screen.getByRole('menuitem', { name: 'Add to queue' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Go to artist' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Go to album' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Add to playlist' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Add memory' })).toBeNull();
  });

  it('renders disabled button when track is null', () => {
    render(<TrackActionsMenu track={null} />);
    const button = screen.getByRole('button', { name: /track options/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.classList.contains('cursor-not-allowed')).toBe(true);
  });
});
