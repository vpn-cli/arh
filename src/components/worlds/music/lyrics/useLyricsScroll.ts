import { useRef, useState, useCallback, useEffect } from 'react';
import { LyricLine } from '@/lib/lyrics';

export function getLineCenter(lineEl: HTMLElement, containerEl: HTMLElement): number {
  let offset = lineEl.offsetTop + lineEl.offsetHeight / 2;
  let curr: HTMLElement | null = lineEl.offsetParent as HTMLElement | null;
  while (curr && curr !== containerEl) {
    offset += curr.offsetTop;
    curr = curr.offsetParent as HTMLElement | null;
  }
  return offset;
}

export function findActiveLyricIndex(lines: LyricLine[], currentPos: number): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].timeMs <= currentPos) {
      return i;
    }
  }
  return -1;
}

export function syncActiveLineWordDelays(
  lineIndex: number,
  currentPosMs: number,
  lineEl: HTMLElement | null,
  lineData: LyricLine | null | undefined
): void {
  if (lineIndex < 0 || !lineEl || !lineData || !lineData.words) return;

  const elapsedWithinLine = Math.max(0, currentPosMs - lineData.timeMs);
  const wordEls = lineEl.querySelectorAll<HTMLElement>('.lyric-word');

  wordEls.forEach((wordEl, wIdx) => {
    const word = lineData.words?.[wIdx];
    if (!word) return;
    const durationMs = word.endMs - word.startMs;
    const delayMs = word.startMs - lineData.timeMs - elapsedWithinLine;

    wordEl.style.animationName = 'none';
    wordEl.style.animationDuration = `${durationMs}ms`;
    wordEl.style.animationDelay = `${delayMs}ms`;
  });

  lineEl.offsetHeight; // force reflow once for the whole line

  wordEls.forEach((wordEl) => {
    wordEl.style.animationName = 'lyric-word-wipe';
  });
}

interface UseLyricsScrollOptions {
  activeLyricIndexRef: React.MutableRefObject<number>;
}

export function useLyricsScroll({ activeLyricIndexRef }: UseLyricsScrollOptions) {
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const lyricsLinesRef = useRef<(HTMLDivElement | null)[]>([]);
  const baseLyricsYRef = useRef<number>(0);
  const manualOffsetRef = useRef<number>(0);
  const isManualBrowsingRef = useRef<boolean>(false);
  const [isManualBrowsing, setIsManualBrowsing] = useState<boolean>(false);
  const manualTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateLyricsPosition = useCallback(
    (targetIndex: number, instant: boolean = false) => {
      const container = lyricsContainerRef.current;
      if (!container) return;

      const lines = lyricsLinesRef.current;
      if (!lines || lines.length === 0) return;

      const idx = targetIndex >= 0 ? targetIndex : 0;
      const activeLine = lines[idx];
      if (!activeLine) return;

      const containerHeight = container.clientHeight;
      const lineCenter = activeLine.offsetTop + activeLine.offsetHeight / 2;
      const baseY = containerHeight / 2 - lineCenter;
      baseLyricsYRef.current = baseY;

      const totalY = isManualBrowsingRef.current
        ? baseY + manualOffsetRef.current
        : baseY;

      if (instant) {
        container.setAttribute('data-instant', 'true');
        container.style.setProperty('--lyrics-y', `${totalY}px`);
        requestAnimationFrame(() => {
          container.removeAttribute('data-instant');
        });
      } else {
        container.style.setProperty('--lyrics-y', `${totalY}px`);
      }
    },
    []
  );

  const resumeToActive = useCallback(() => {
    if (manualTimeoutRef.current) {
      clearTimeout(manualTimeoutRef.current);
      manualTimeoutRef.current = null;
    }
    if (isManualBrowsingRef.current) {
      isManualBrowsingRef.current = false;
      setIsManualBrowsing(false);
    }
    manualOffsetRef.current = 0;

    updateLyricsPosition(activeLyricIndexRef.current, false);
  }, [updateLyricsPosition, activeLyricIndexRef]);

  // Recompute lyrics on container resize
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let isFirst = true;
    const ro = new ResizeObserver(() => {
      if (isFirst) {
        isFirst = false;
        return;
      }
      updateLyricsPosition(activeLyricIndexRef.current, true);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [updateLyricsPosition, activeLyricIndexRef]);

  // Recompute lyrics after document.fonts.ready
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      if (document.fonts.status !== 'loaded') {
        document.fonts.ready.then(() => {
          updateLyricsPosition(activeLyricIndexRef.current, true);
        });
      }
    }
  }, [updateLyricsPosition, activeLyricIndexRef]);

  // Manual wheel and touch browsing with non-passive listeners
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const getClampedOffset = (delta: number) => {
      const lines = lyricsLinesRef.current;
      if (!lines || lines.length === 0) return 0;
      const firstLine = lines[0];
      const lastLine = lines[lines.length - 1];
      if (!firstLine || !lastLine) return 0;

      const containerHeight = container.clientHeight;
      const firstLineCenter = getLineCenter(firstLine, container);
      const lastLineCenter = getLineCenter(lastLine, container);

      const maxY = containerHeight / 2 - firstLineCenter;
      const minY = containerHeight / 2 - lastLineCenter;

      const proposedTotalY =
        baseLyricsYRef.current + manualOffsetRef.current + delta;
      const clampedTotalY = Math.max(minY, Math.min(maxY, proposedTotalY));
      return clampedTotalY - baseLyricsYRef.current;
    };

    const applyDelta = (delta: number) => {
      const newManualOffset = getClampedOffset(delta);
      manualOffsetRef.current = newManualOffset;
      const totalY = baseLyricsYRef.current + newManualOffset;
      container.style.setProperty('--lyrics-y', `${totalY}px`);

      if (!isManualBrowsingRef.current) {
        isManualBrowsingRef.current = true;
        setIsManualBrowsing(true);
      }

      if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
      manualTimeoutRef.current = setTimeout(() => {
        resumeToActive();
      }, 3000);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Non-passive! Page behind does not scroll
      applyDelta(-e.deltaY);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault(); // Non-passive! Page behind does not scroll
        const currentY = e.touches[0].clientY;
        const delta = currentY - touchStartY;
        touchStartY = currentY;
        applyDelta(delta);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [resumeToActive]);

  useEffect(() => {
    return () => {
      if (manualTimeoutRef.current) {
        clearTimeout(manualTimeoutRef.current);
      }
    };
  }, []);

  return {
    lyricsContainerRef,
    lyricsLinesRef,
    baseLyricsYRef,
    manualOffsetRef,
    isManualBrowsingRef,
    isManualBrowsing,
    setIsManualBrowsing,
    manualTimeoutRef,
    updateLyricsPosition,
    resumeToActive,
  };
}
