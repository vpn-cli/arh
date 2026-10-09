import { useState, useEffect, useMemo, useCallback } from 'react';
import { attachEstimatedWordTimings, LyricLine } from '@/lib/lyrics';

export interface LyricsData {
  synced: LyricLine[] | null;
  plain: string | null;
  instrumental?: boolean;
  notFound?: boolean;
  source?: string;
  offsetMs?: number;
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
        if (data && typeof data.offsetMs !== 'number') {
          data.offsetMs = 0;
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

  useEffect(() => {
    if (!trackId || lyricsCache[trackId] !== undefined) {
      return;
    }

    let isCancelled = false;

    prefetchLyrics(trackId).then((data) => {
      if (isCancelled) return;
      setBaseLyricsData(data);
      setOffsetMsState(data?.offsetMs ?? 0);
      setIsLyricsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [trackId]);

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
  };
}
