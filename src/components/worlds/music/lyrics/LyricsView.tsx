import React, {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import './lyrics.css';
import { useLyrics } from './useLyrics';
import {
  useLyricsScroll,
  findActiveLyricIndex,
  syncActiveLineWordDelays,
} from './useLyricsScroll';
import { LyricLines } from './LyricLines';
import {
  LyricsLoadingView,
  LyricsInstrumentalView,
  LyricsPlainView,
  LyricsNotFoundView,
} from './LyricsStates';
import { AddLyricsModal } from './AddLyricsModal';
import { SyncOffsetControl } from './SyncOffsetControl';

export interface LyricsTrackDisplay {
  name?: string;
  artists?: string;
  art?: string | null;
}

export interface LyricsViewProps {
  trackId: string | null;
  trackDisplay: LyricsTrackDisplay;
  isPaused: boolean;
  getPositionMs: () => number;
  onSeek: (ms: number) => void;
  onClose: () => void;
}

export interface LyricsViewHandle {
  resync: (targetMs?: number) => void;
}

/**
 * Breakpoint where LyricsView shifts from covering the right player panel
 * (max-lg:w-[380px] max-lg:right-0) to covering the center main content area
 * (lg:left-64 lg:right-[400px]). Matches the `lg:` Tailwind classes below.
 */
export const LYRICS_OVERLAY_COVERS_CONTENT_MIN_WIDTH = 1024;

export const doesLyricsOverlayCoverContent = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= LYRICS_OVERLAY_COVERS_CONTENT_MIN_WIDTH;
};

export const LyricsView = React.memo(
  forwardRef<LyricsViewHandle, LyricsViewProps>(function LyricsView(
    { trackId, trackDisplay, isPaused, getPositionMs, onSeek, onClose },
    ref
  ) {
    const { lyricsData, setLyricsData, isLyricsLoading, offsetMs, setOffsetMs } =
      useLyrics(trackId);
    const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
    const activeLyricIndexRef = useRef<number>(-1);

    const {
      lyricsContainerRef,
      lyricsLinesRef,
      manualOffsetRef,
      isManualBrowsingRef,
      isManualBrowsing,
      setIsManualBrowsing,
      manualTimeoutRef,
      updateLyricsPosition,
      resumeToActive,
    } = useLyricsScroll({ activeLyricIndexRef });

    // Edit mode & manual lyrics states
    const [editMode, setEditMode] = useState<boolean>(() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('edit') === 'true') return true;
        return window.localStorage.getItem('arh_edit_mode') === 'true';
      }
      return false;
    });

    const [sessionSecret, setSessionSecret] = useState<string>('');
    const [isAddLyricsOpen, setIsAddLyricsOpen] = useState<boolean>(false);
    const [initialLyricsInput, setInitialLyricsInput] = useState<string>('');

    const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      return false;
    });

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);

    const syncDelays = useCallback(
      (lineIdx: number, posMs: number) => {
        if (!lyricsData?.synced) return;
        syncActiveLineWordDelays(
          lineIdx,
          posMs,
          lyricsLinesRef.current[lineIdx],
          lyricsData.synced[lineIdx]
        );
      },
      [lyricsData, lyricsLinesRef]
    );

    // Initial positioning and resync on data/track load
    useLayoutEffect(() => {
      if (manualTimeoutRef.current) {
        clearTimeout(manualTimeoutRef.current);
        manualTimeoutRef.current = null;
      }
      isManualBrowsingRef.current = false;
      manualOffsetRef.current = 0;
      setIsManualBrowsing((prev) => (prev ? false : prev));

      if (!lyricsData?.synced || lyricsData.synced.length === 0) {
        activeLyricIndexRef.current = -1;
        setActiveLyricIndex(-1);
        lyricsLinesRef.current = [];
        return;
      }

      const currentPos = getPositionMs();
      const activeIndex = findActiveLyricIndex(lyricsData.synced, currentPos);

      activeLyricIndexRef.current = activeIndex;
      setActiveLyricIndex(activeIndex);

      updateLyricsPosition(activeIndex, true);
      syncDelays(activeIndex, currentPos);
    }, [
      trackId,
      lyricsData,
      getPositionMs,
      updateLyricsPosition,
      syncDelays,
      manualTimeoutRef,
      isManualBrowsingRef,
      manualOffsetRef,
      setIsManualBrowsing,
      lyricsLinesRef,
    ]);

    // Sync word highlight timing after active line render commits
    useLayoutEffect(() => {
      if (activeLyricIndex < 0) return;
      syncDelays(activeLyricIndex, getPositionMs());
    }, [activeLyricIndex, getPositionMs, syncDelays]);

    // Active-line detection rAF loop while mounted
    useEffect(() => {
      if (isPaused) return;
      let frameId: number;

      const checkLine = () => {
        if (lyricsData?.synced && lyricsData.synced.length > 0) {
          if (lyricsLinesRef.current.length !== lyricsData.synced.length) {
            lyricsLinesRef.current = new Array(lyricsData.synced.length).fill(null);
            activeLyricIndexRef.current = -1;
          }

          const currentPos = getPositionMs();
          const activeIndex = findActiveLyricIndex(lyricsData.synced, currentPos);

          if (activeIndex !== activeLyricIndexRef.current) {
            activeLyricIndexRef.current = activeIndex;
            setActiveLyricIndex(activeIndex);

            if (!isManualBrowsingRef.current) {
              updateLyricsPosition(activeIndex, false);
            }
          }
        }
        frameId = requestAnimationFrame(checkLine);
      };

      frameId = requestAnimationFrame(checkLine);
      return () => cancelAnimationFrame(frameId);
    }, [
      isPaused,
      lyricsData,
      getPositionMs,
      updateLyricsPosition,
      lyricsLinesRef,
      isManualBrowsingRef,
    ]);

    // Expose resync imperative handle for seek & player state updates
    const resync = useCallback(
      (targetMs?: number) => {
        if (!lyricsData?.synced || lyricsData.synced.length === 0) return;
        const currentPos = targetMs !== undefined ? targetMs : getPositionMs();
        const targetIndex = findActiveLyricIndex(lyricsData.synced, currentPos);

        if (targetIndex !== activeLyricIndexRef.current) {
          activeLyricIndexRef.current = targetIndex;
          setActiveLyricIndex(targetIndex);
          if (!isManualBrowsingRef.current) {
            updateLyricsPosition(targetIndex, true);
          }
        }
        syncDelays(targetIndex, currentPos);
      },
      [lyricsData, getPositionMs, updateLyricsPosition, syncDelays, isManualBrowsingRef]
    );

    useImperativeHandle(
      ref,
      () => ({
        resync,
      }),
      [resync]
    );

    // Escape key handler
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isAddLyricsOpen) {
            setIsAddLyricsOpen(false);
          } else {
            onClose();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isAddLyricsOpen]);

    const handleLineClick = useCallback(
      (timeMs: number) => {
        onSeek(timeMs);
        resumeToActive();
      },
      [onSeek, resumeToActive]
    );

    const openAddLyrics = useCallback((initialText: string = '') => {
      setInitialLyricsInput(initialText);
      setIsAddLyricsOpen(true);
    }, []);

    return (
      <div className="absolute top-0 bottom-0 z-40 bg-[var(--color-bg)] flex flex-col pointer-events-auto transition-all duration-300 max-lg:left-auto max-lg:right-0 max-lg:w-[380px] lg:left-64 lg:right-[400px] xl:right-[420px] 2xl:right-[440px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 shrink-0 border-b-2 border-[var(--color-muted)] bg-[var(--color-light)]/50">
          <span className="font-pixel text-sm font-bold text-[var(--color-dark)] flex items-center gap-2">
            <span className="text-[var(--color-vibrant)] text-lg">❝</span> Lyrics
          </span>
          <div className="flex items-center gap-2">
            {editMode && lyricsData?.synced && lyricsData.synced.length > 0 && (
              <SyncOffsetControl
                trackId={trackId}
                offsetMs={offsetMs}
                onOffsetChange={setOffsetMs}
                onResync={resync}
                sessionSecret={sessionSecret}
                onSessionSecretChange={setSessionSecret}
              />
            )}
            <button
              onClick={() => {
                const next = !editMode;
                setEditMode(next);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('arh_edit_mode', next ? 'true' : 'false');
                }
              }}
              className={`font-pixel text-[10px] px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                editMode
                  ? 'bg-[#FFD0DC] text-[#20233F] border-[#20233F] font-bold shadow-xs'
                  : 'bg-white hover:bg-[var(--color-light)] text-[var(--color-dark)]/70 border-[var(--color-muted)]'
              }`}
              title="Toggle Edit Mode (for VPN)"
            >
              {editMode ? 'EDIT MODE: ON' : 'EDIT MODE'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-[var(--color-vibrant)] text-[var(--color-dark)] hover:text-white border border-[var(--color-muted)] transition-colors shadow-xs active:scale-95"
              aria-label="Close Lyrics"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={lyricsContainerRef}
          data-paused={isPaused}
          className={`flex-1 relative select-none lyrics-container ${
            lyricsData?.synced && lyricsData.synced.length > 0
              ? 'overflow-hidden px-6'
              : 'overflow-y-auto px-4'
          }`}
          style={{
            position: 'relative',
            maskImage:
              lyricsData?.synced && lyricsData.synced.length > 0
                ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
                : 'none',
            WebkitMaskImage:
              lyricsData?.synced && lyricsData.synced.length > 0
                ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
                : 'none',
            animationPlayState: isPaused ? 'paused' : 'running',
            ['--lyrics-play-state' as any]: isPaused ? 'paused' : 'running',
          }}
        >
          {isLyricsLoading ? (
            <LyricsLoadingView />
          ) : lyricsData?.synced && lyricsData.synced.length > 0 ? (
            <LyricLines
              lines={lyricsData.synced}
              activeLyricIndex={activeLyricIndex}
              isManualBrowsing={isManualBrowsing}
              isReducedMotion={isReducedMotion}
              lyricsLinesRef={lyricsLinesRef}
              onLineClick={handleLineClick}
            />
          ) : lyricsData?.instrumental ? (
            <LyricsInstrumentalView
              editMode={editMode}
              onAddLyrics={() => openAddLyrics('')}
            />
          ) : lyricsData?.plain ? (
            <LyricsPlainView
              plain={lyricsData.plain}
              editMode={editMode}
              onAddLyrics={() => openAddLyrics(lyricsData.plain || '')}
            />
          ) : (
            <LyricsNotFoundView
              trackName={trackDisplay.name}
              artistName={trackDisplay.artists}
              albumArt={trackDisplay.art}
              editMode={editMode}
              onAddLyrics={() => openAddLyrics('')}
            />
          )}
        </div>

        {/* Back to now pill */}
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 z-50 ${
            isManualBrowsing
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <button
            onClick={resumeToActive}
            className="bg-[var(--color-dark)] text-white font-pixel text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-[var(--color-vibrant)] transition-colors active:scale-95 flex items-center gap-2"
          >
            <span className="text-white/70">↓</span> Back to now
          </button>
        </div>

        {/* Manual Lyrics Modal */}
        <AddLyricsModal
          isOpen={isAddLyricsOpen}
          onClose={() => setIsAddLyricsOpen(false)}
          trackId={trackId}
          trackName={trackDisplay.name}
          artistName={trackDisplay.artists}
          initialLyrics={initialLyricsInput}
          sessionSecret={sessionSecret}
          onSessionSecretChange={setSessionSecret}
          onSaveSuccess={(newData) => setLyricsData(newData)}
        />
      </div>
    );
  })
);
