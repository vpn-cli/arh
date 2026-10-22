import { useMemo } from 'react';
import { getArtistNames } from '@/lib/artistNames';
import type { LyricsTrackDisplay } from './LyricsView';

export interface UseLyricsTrackDisplayResult {
  full: string;
  primary: string;
  artUrl: string | null;
  lyricsTrackDisplay: LyricsTrackDisplay;
}

/**
 * Computes lyricsTrackDisplay and primitive artist strings for currentTrack.
 * Memoizes on primitive fields ([id, name, full, primary, artUrl]) so SDK
 * playback state events (seek, pause, position) that emit new track object
 * references do not create new trackDisplay objects or trigger re-renders.
 */
export function useLyricsTrackDisplay(currentTrack: any): UseLyricsTrackDisplayResult {
  const { full, primary } = getArtistNames(currentTrack);
  const artUrl =
    currentTrack?.album?.images?.[0]?.url ||
    (typeof currentTrack?.album?.images?.[0] === 'string' ? currentTrack.album.images[0] : null) ||
    null;

  const lyricsTrackDisplay = useMemo(
    () => ({
      name: currentTrack?.name,
      artists: full,
      primaryArtist: primary,
      art: artUrl,
    }),
    [currentTrack?.id, currentTrack?.name, full, primary, artUrl]
  );

  return { full, primary, artUrl, lyricsTrackDisplay };
}
