import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useMusicNavigation } from '../useMusicNavigation';

describe('useMusicNavigation', () => {
  it('initializes with default states', () => {
    const { result } = renderHook(() => useMusicNavigation());

    expect(result.current.activeTab).toBe('home');
    expect(result.current.selectedPlaylistId).toBeNull();
    expect(result.current.selectedAlbumId).toBeNull();
    expect(result.current.selectedArtistId).toBeNull();
    expect(result.current.globalSearch).toBe('');
  });

  it('notifies onNavigate on view transitions and updates state', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() => useMusicNavigation({ onNavigate }));

    act(() => {
      result.current.navigate('mix');
    });
    expect(result.current.activeTab).toBe('mix');
    expect(onNavigate).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.openPlaylist('pl-123');
    });
    expect(result.current.selectedPlaylistId).toBe('pl-123');
    expect(result.current.activeTab).toBe('playlists');
    expect(onNavigate).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.openAlbum('alb-456');
    });
    expect(result.current.selectedAlbumId).toBe('alb-456');
    expect(result.current.activeTab).toBe('album');
    expect(onNavigate).toHaveBeenCalledTimes(3);

    act(() => {
      result.current.openArtist('art-789');
    });
    expect(result.current.selectedArtistId).toBe('art-789');
    expect(result.current.activeTab).toBe('artist');
    expect(onNavigate).toHaveBeenCalledTimes(4);

    act(() => {
      result.current.handleSearchChange('lofi');
    });
    expect(result.current.globalSearch).toBe('lofi');
    expect(result.current.activeTab).toBe('search');
    expect(onNavigate).toHaveBeenCalledTimes(5);
  });

  it('does NOT notify onNavigate on handleClearSearch', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() => useMusicNavigation({ onNavigate }));

    act(() => {
      result.current.handleSearchChange('ambient');
    });
    expect(onNavigate).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleClearSearch();
    });
    expect(result.current.globalSearch).toBe('');
    expect(onNavigate).toHaveBeenCalledTimes(1); // Still 1
  });

  it('supports named back handlers with onNavigate notifications', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() => useMusicNavigation({ onNavigate }));

    act(() => {
      result.current.openPlaylist('pl-1');
    });
    expect(onNavigate).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleBackFromPlaylist();
    });
    expect(result.current.selectedPlaylistId).toBeNull();
    expect(onNavigate).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.openAlbum('alb-1');
    });
    act(() => {
      result.current.handleBackFromAlbum();
    });
    expect(result.current.selectedAlbumId).toBeNull();
    expect(result.current.activeTab).toBe('search');
    expect(onNavigate).toHaveBeenCalledTimes(4);

    act(() => {
      result.current.openArtist('art-1');
    });
    act(() => {
      result.current.handleBackFromArtist();
    });
    expect(result.current.selectedArtistId).toBeNull();
    expect(result.current.activeTab).toBe('search');
    expect(onNavigate).toHaveBeenCalledTimes(6);
  });

  it('maintains stable callback references even when onNavigate changes', () => {
    let cb = vi.fn();
    const { result, rerender } = renderHook(
      ({ onNav }) => useMusicNavigation({ onNavigate: onNav }),
      { initialProps: { onNav: cb } }
    );

    const firstNavigate = result.current.navigate;
    const firstOpenPlaylist = result.current.openPlaylist;
    const firstHandleBack = result.current.handleBackFromPlaylist;

    cb = vi.fn();
    rerender({ onNav: cb });

    expect(result.current.navigate).toBe(firstNavigate);
    expect(result.current.openPlaylist).toBe(firstOpenPlaylist);
    expect(result.current.handleBackFromPlaylist).toBe(firstHandleBack);

    act(() => {
      result.current.navigate('vibes');
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
