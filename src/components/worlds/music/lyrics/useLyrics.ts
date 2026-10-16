import { useState, useEffect, useMemo, useCallback } from 'react';
import { attachEstimatedWordTimings, LyricLine } from '@/lib/lyrics';

export type LyricsStatus = 'loading' | 'found' | 'instrumental' | 'not_found' | 'error';

export interface LyricsData {
  status?: LyricsStatus;
  synced: LyricLine[] | null;
  plain: string | null;
  instrumental?: boolean;
  notFound?: boolean;
  source?: string;
  offsetMs?: number;
  error?: string;
  errorTimestamp?: number;
}

const lyricsCache: Record<string, LyricsData | null> = {};
const pendingRequests: Record<string, Promise<LyricsData | null> | undefined> = {};

/**
 * Shifts line time and all word start and end times by offsetMs.
 * A positive offsetMs makes the lyrics appear later.
 */
export function applyLyricsOffset(
  lines: LyricLine[] | null,
  offsetMs: number
): LyricLine[] | null {
  if (!lines || lines.length === 0 || offsetMs === 0) {
    return lines;
  }
  return lines.map((line) => ({
    ...line,
    timeMs: line.timeMs + offsetMs,
    words: line.words?.map((word) => ({
      ...word,
      startMs: word.startMs + offsetMs,
      endMs: word.endMs + offsetMs,
    })),
  }));
}

/**
 * Prefetches lyrics for a track into the module-level cache without touching React state.
 * Accepts optional trackName and artistName so the server route /api/lyrics does not need
 * to call the Spotify proxy to resolve track metadata.
 */
export async function prefetchLyrics(
  trackId: string,
  trackName?: string,
  artistName?: string,
  forceRefresh: boolean = false
): Promise<LyricsData | null> {
  if (!trackId) return null;

  if (!forceRefresh && lyricsCache[trackId] !== undefined) {
    const cached = lyricsCache[trackId];
    if (cached?.status === 'error') {
      const errorAge = Date.now() - (cached.errorTimestamp || 0);
      if (errorAge < 60000) {
        return cached;
      }
      delete lyricsCache[trackId];
    } else {
      return cached;
    }
  }

  const pending = pendingRequests[trackId];
  if (pending && !forceRefresh) {
    return pending;
  }

  const promise = (async () => {
    try {
      const params = new URLSearchParams({ trackId });
      if (trackName) params.set('title', trackName);
      if (artistName) params.set('artist', artistName);
      if (forceRefresh) params.set('refresh', 'true');

      const res = await fetch(`/api/lyrics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.synced) {
          data.synced = attachEstimatedWordTimings(data.synced);
        }
        if (data && typeof data.offsetMs !== 'number') {
          data.offsetMs = 0;
        }
        lyricsCache[trackId] = data;
        return data;
      }

      // Upstream or HTTP error (e.g. 503, 429, 500)
      const errBody = await res.json().catch(() => ({}));
      const errData: LyricsData = {
        status: 'error',
        synced: null,
        plain: null,
        instrumental: false,
        notFound: false,
        error: errBody?.error || `Failed to fetch lyrics (${res.status})`,
        errorTimestamp: Date.now(),
        offsetMs: 0,
      };
      lyricsCache[trackId] = errData;
      return errData;
    } catch (e) {
      console.error(e);
      const errData: LyricsData = {
        status: 'error',
        synced: null,
        plain: null,
        instrumental: false,
        notFound: false,
        error: 'Network connection error',
        errorTimestamp: Date.now(),
        offsetMs: 0,
      };
      lyricsCache[trackId] = errData;
      return errData;
    } finally {
      delete pendingRequests[trackId];
    }
  })();

  pendingRequests[trackId] = promise;
  return promise;
}

export function setCachedLyrics(trackId: string, data: LyricsData | null): void {
  if (!trackId) return;
  lyricsCache[trackId] = data;
}

export function clearCachedLyrics(trackId?: string): void {
  if (trackId) {
    delete lyricsCache[trackId];
    delete pendingRequests[trackId];
  } else {
    for (const key of Object.keys(lyricsCache)) delete lyricsCache[key];
    for (const key of Object.keys(pendingRequests)) delete pendingRequests[key];
  }
}

export function getCachedLyrics(trackId: string): LyricsData | null | undefined {
  return lyricsCache[trackId];
}

export function useLyrics(
  trackId: string | null | undefined,
  trackName?: string,
  artistName?: string
) {
  const cached = trackId ? lyricsCache[trackId] : undefined;

  const [prevTrackId, setPrevTrackId] = useState<string | null | undefined>(trackId);
  const [baseLyricsData, setBaseLyricsData] = useState<LyricsData | null>(() => {
    return cached !== undefined ? cached : null;
  });

  const [offsetMs, setOffsetMsState] = useState<number>(() => {
    return cached?.offsetMs ?? 0;
  });

  const [isLyricsLoading, setIsLyricsLoading] = useState<boolean>(() => {
    return !!trackId && lyricsCache[trackId] === undefined;
  });

  // Adjust state during render when trackId changes
  if (trackId !== prevTrackId) {
    setPrevTrackId(trackId);
    const newCached = trackId ? lyricsCache[trackId] : undefined;
    setBaseLyricsData(newCached !== undefined ? newCached : null);
    setOffsetMsState(newCached?.offsetMs ?? 0);
    setIsLyricsLoading(Boolean(trackId && newCached === undefined));
  }

  const setOffsetMs = useCallback((newOffset: number) => {
    const clamped = Math.max(-5000, Math.min(5000, Math.round(newOffset)));
    setOffsetMsState(clamped);
    if (trackId && lyricsCache[trackId]) {
      lyricsCache[trackId] = {
        ...lyricsCache[trackId]!,
        offsetMs: clamped,
      };
    }
  }, [trackId]);

  const setLyricsData = useCallback((data: LyricsData | null) => {
    setBaseLyricsData(data);
    if (data?.offsetMs !== undefined) {
      setOffsetMsState(data.offsetMs);
    }
  }, []);

  const retryLyrics = useCallback(async () => {
    if (!trackId) return;
    clearCachedLyrics(trackId);
    setIsLyricsLoading(true);
    const data = await prefetchLyrics(trackId, trackName, artistName, true);
    setBaseLyricsData(data);
    setOffsetMsState(data?.offsetMs ?? 0);
    setIsLyricsLoading(false);
  }, [trackId, trackName, artistName]);

  useEffect(() => {
    if (!trackId || lyricsCache[trackId] !== undefined) {
      return;
    }

    let isCancelled = false;

    prefetchLyrics(trackId, trackName, artistName).then((data) => {
      if (isCancelled) return;
      setBaseLyricsData(data);
      setOffsetMsState(data?.offsetMs ?? 0);
      setIsLyricsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [trackId, trackName, artistName]);

  // Derived shifted lyrics computed when lyrics load or offset changes (never per frame)
  const lyricsData = useMemo<LyricsData | null>(() => {
    if (!baseLyricsData) return null;
    return {
      ...baseLyricsData,
      offsetMs,
      synced: applyLyricsOffset(baseLyricsData.synced, offsetMs),
    };
  }, [baseLyricsData, offsetMs]);

  return {
    lyricsData,
    setLyricsData,
    isLyricsLoading,
    offsetMs,
    setOffsetMs,
    retryLyrics,
  };
}
