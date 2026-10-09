import { useState, useEffect, useRef } from 'react';
import { attachEstimatedWordTimings, LyricLine } from '@/lib/lyrics';

export interface LyricsData {
  synced: LyricLine[] | null;
  plain: string | null;
  instrumental?: boolean;
  notFound?: boolean;
  source?: string;
}

const lyricsCache: Record<string, LyricsData | null> = {};
const pendingRequests: Record<string, Promise<LyricsData | null> | undefined> = {};

/**
 * Prefetches lyrics for a track into the module-level cache without touching React state.
 */
export async function prefetchLyrics(trackId: string): Promise<LyricsData | null> {
  if (!trackId) return null;
  if (lyricsCache[trackId] !== undefined) {
    return lyricsCache[trackId];
  }
  const pending = pendingRequests[trackId];
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      const res = await fetch(`/api/lyrics?trackId=${encodeURIComponent(trackId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.synced) {
          data.synced = attachEstimatedWordTimings(data.synced);
        }
        lyricsCache[trackId] = data;
        return data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      delete pendingRequests[trackId];
    }
    return null;
  })();

  pendingRequests[trackId] = promise;
  return promise;
}

export function setCachedLyrics(trackId: string, data: LyricsData | null): void {
  if (!trackId) return;
  lyricsCache[trackId] = data;
}

export function getCachedLyrics(trackId: string): LyricsData | null | undefined {
  return lyricsCache[trackId];
}

export function useLyrics(trackId: string | null | undefined) {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(() => {
    if (trackId && lyricsCache[trackId] !== undefined) {
      return lyricsCache[trackId];
    }
    return null;
  });
  const [isLyricsLoading, setIsLyricsLoading] = useState<boolean>(() => {
    return !!trackId && lyricsCache[trackId] === undefined;
  });

  const currentTrackIdRef = useRef<string | null | undefined>(trackId);
  currentTrackIdRef.current = trackId;

  useEffect(() => {
    if (!trackId) {
      setLyricsData(null);
      setIsLyricsLoading(false);
      return;
    }

    if (lyricsCache[trackId] !== undefined) {
      setLyricsData(lyricsCache[trackId]);
      setIsLyricsLoading(false);
      return;
    }

    setIsLyricsLoading(true);
    let isCancelled = false;

    prefetchLyrics(trackId).then((data) => {
      if (isCancelled || currentTrackIdRef.current !== trackId) return;
      setLyricsData(data);
      setIsLyricsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [trackId]);

  return {
    lyricsData,
    setLyricsData,
    isLyricsLoading,
  };
}
