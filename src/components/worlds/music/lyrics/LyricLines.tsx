import React from 'react';
import { LyricLine } from '@/lib/lyrics';

export interface LyricLinesProps {
  lines: LyricLine[];
  activeLyricIndex: number;
  isManualBrowsing: boolean;
  isReducedMotion: boolean;
  lyricsLinesRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onLineClick: (timeMs: number) => void;
}

export function LyricLines({
  lines,
  activeLyricIndex,
  isManualBrowsing,
  isReducedMotion,
  lyricsLinesRef,
  onLineClick,
}: LyricLinesProps) {
  return (
    <div className="flex flex-col gap-[3vh] sm:gap-[4vh] text-center w-full py-8">
      {lines.map((line, i) => {
        const prevLine = lines[i - 1];
        const isLongGap = i > 0 && prevLine && line.timeMs - prevLine.timeMs > 8000;
        const isActive = i === activeLyricIndex;
        const distance = activeLyricIndex === -1 ? 0 : Math.abs(i - activeLyricIndex);
        const isNearby = distance <= 6;

        let opacity = 0.25;
        let blurPx = 3;
        let scale = 1;

        if (isActive) {
          opacity = 1;
          blurPx = 0;
          scale = isReducedMotion ? 1 : 1.06;
        } else if (activeLyricIndex === -1) {
          opacity = 0.5;
          blurPx = 0;
          scale = 1;
        } else if (distance === 1) {
          opacity = 0.5;
          blurPx = 1;
          scale = 1;
        } else if (distance === 2) {
          opacity = 0.35;
          blurPx = 2;
          scale = 1;
        } else if (isNearby) {
          opacity = 0.25;
          blurPx = 3;
          scale = 1;
        } else {
          opacity = isManualBrowsing ? 0.25 : 0;
          blurPx = 0;
          scale = 1;
        }

        if (isManualBrowsing) {
          blurPx = 0;
        }

        let delayMs = 0;
        if (!isReducedMotion && !isManualBrowsing && activeLyricIndex !== -1 && isNearby) {
          if (i >= activeLyricIndex) {
            const step = Math.min(i - activeLyricIndex, 8);
            delayMs = step * 40;
          }
        }

        const durationMs = isReducedMotion || isManualBrowsing ? 0 : 600;

        return (
          <React.Fragment key={i}>
            {isLongGap && (
              <div
                className="flex justify-center items-center gap-3 py-6 select-none"
                style={{
                  transform: 'translateY(var(--lyrics-y, 0px))',
                  transitionProperty: isNearby ? 'transform' : 'none',
                  transitionDuration: isNearby ? `${durationMs}ms` : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  transitionDelay: isNearby ? `${delayMs}ms` : '0ms',
                }}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-[var(--color-dark)] ${
                    activeLyricIndex === i - 1
                      ? 'interlude-dot-1'
                      : activeLyricIndex < i - 1
                      ? 'opacity-25 scale-75'
                      : 'opacity-0 scale-0'
                  } transition-all duration-300`}
                />
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-[var(--color-dark)] ${
                    activeLyricIndex === i - 1
                      ? 'interlude-dot-2'
                      : activeLyricIndex < i - 1
                      ? 'opacity-25 scale-75'
                      : 'opacity-0 scale-0'
                  } transition-all duration-300`}
                />
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-[var(--color-dark)] ${
                    activeLyricIndex === i - 1
                      ? 'interlude-dot-3'
                      : activeLyricIndex < i - 1
                      ? 'opacity-25 scale-75'
                      : 'opacity-0 scale-0'
                  } transition-all duration-300`}
                />
              </div>
            )}
            <div
              ref={(el) => {
                lyricsLinesRef.current[i] = el;
              }}
              onClick={() => onLineClick(line.timeMs)}
              className={`relative w-full max-w-[640px] mx-auto font-pixel font-bold text-center leading-relaxed origin-center cursor-pointer select-none hover:opacity-100 transition-opacity ${
                isActive ? 'lyric-line-active' : ''
              }`}
              style={{
                fontSize: 'clamp(1.5rem, 2.2vw, 2.25rem)',
                transform: `translateY(var(--lyrics-y, 0px)) ${scale !== 1 ? `scale(${scale})` : ''}`,
                opacity,
                filter: isNearby && blurPx > 0 ? `blur(${blurPx}px)` : 'none',
                transitionProperty: isNearby ? 'transform, opacity, filter' : 'none',
                transitionDuration: isNearby ? `${durationMs}ms, ${durationMs}ms, 250ms` : '0ms',
                transitionTimingFunction: isNearby
                  ? 'cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1), ease'
                  : undefined,
                transitionDelay: isNearby ? `${delayMs}ms, ${delayMs}ms, 0ms` : undefined,
                willChange: isNearby ? 'transform, opacity' : undefined,
              }}
            >
              <div
                className={`absolute right-[100%] mr-4 top-1/2 -translate-y-1/2 text-[var(--color-vibrant)] text-2xl transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              >
                ♥
              </div>
              {line.words && line.words.length > 0 ? (
                line.words.map((word, wIdx, arr) => {
                  const wordDurationMs = word.endMs - word.startMs;
                  const wordDelayMs = word.startMs - line.timeMs;

                  return (
                    <React.Fragment key={wIdx}>
                      <span
                        className={`lyric-word ${isActive ? 'lyric-word-active' : ''}`}
                        style={
                          isActive && !isReducedMotion
                            ? {
                                animationDuration: `${wordDurationMs}ms`,
                                animationDelay: `${wordDelayMs}ms`,
                              }
                            : undefined
                        }
                      >
                        {word.text}
                      </span>
                      {wIdx < arr.length - 1 ? ' ' : ''}
                    </React.Fragment>
                  );
                })
              ) : (
                line.text || '♪'
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
