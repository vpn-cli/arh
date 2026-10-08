import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { attachEstimatedWordTimings, LyricLine } from '@/lib/lyrics';

// Test component mirroring the lyrics view rendering in SpotifyPlayerUI
function LyricsTestView({
  lines,
  activeIndex,
  isPaused,
  currentPos,
  isReduced = false,
}: {
  lines: LyricLine[];
  activeIndex: number;
  isPaused: boolean;
  currentPos: number;
  isReduced?: boolean;
}) {
  return (
    <div
      data-testid="lyrics-container"
      data-paused={isPaused}
      className="lyrics-container"
      style={{
        animationPlayState: isPaused ? 'paused' : 'running',
        ['--lyrics-play-state' as any]: isPaused ? 'paused' : 'running',
      }}
    >
      {lines.map((line, i) => {
        const isActive = i === activeIndex;
        const activeElapsed = isActive ? Math.max(0, currentPos - line.timeMs) : 0;

        return (
          <div
            key={i}
            data-testid={`lyric-line-${i}`}
            className={`lyric-line ${isActive ? 'lyric-line-active' : ''}`}
          >
            {line.words && line.words.length > 0 ? (
              line.words.map((word, wIdx, arr) => {
                const durationMs = word.endMs - word.startMs;
                const delayMs = (word.startMs - line.timeMs) - activeElapsed;

                return (
                  <React.Fragment key={wIdx}>
                    <span
                      data-testid={`word-${i}-${wIdx}`}
                      className={`lyric-word ${isActive ? 'lyric-word-active' : ''}`}
                      style={
                        isActive && !isReduced
                          ? {
                              animationDuration: `${durationMs}ms`,
                              animationDelay: `${delayMs}ms`,
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
        );
      })}
    </div>
  );
}

describe('Lyrics Word Highlighting View', () => {
  const rawLines: LyricLine[] = [
    { timeMs: 0, text: 'Hello beautiful world' },
    { timeMs: 4000, text: 'Second line singing' },
  ];
  const timedLines = attachEstimatedWordTimings(rawLines);

  it('renders words as inline-block spans with .lyric-word class', () => {
    const { getByTestId } = render(
      <LyricsTestView
        lines={timedLines}
        activeIndex={0}
        isPaused={false}
        currentPos={0}
      />
    );

    const word0 = getByTestId('word-0-0');
    expect(word0.classList.contains('lyric-word')).toBe(true);
    expect(word0.textContent).toBe('Hello');

    const word1 = getByTestId('word-0-1');
    expect(word1.classList.contains('lyric-word')).toBe(true);
    expect(word1.textContent).toBe('beautiful');

    const word2 = getByTestId('word-0-2');
    expect(word2.classList.contains('lyric-word')).toBe(true);
    expect(word2.textContent).toBe('world');
  });

  it('assigns .lyric-line-active, animation-duration, and animation-delay only to active line', () => {
    const { getByTestId } = render(
      <LyricsTestView
        lines={timedLines}
        activeIndex={0}
        isPaused={false}
        currentPos={0}
      />
    );

    const activeLine = getByTestId('lyric-line-0');
    expect(activeLine.classList.contains('lyric-line-active')).toBe(true);

    const word0 = getByTestId('word-0-0');
    expect(word0.classList.contains('lyric-word-active')).toBe(true);
    expect(word0.style.animationDuration).toMatch(/ms$/);
    expect(word0.style.animationDelay).toBe('0ms');

    const word1 = getByTestId('word-0-1');
    expect(word1.classList.contains('lyric-word-active')).toBe(true);
    expect(word1.style.animationDuration).toMatch(/ms$/);
    // word1 delay should match word0's duration
    const word0Duration = parseInt(word0.style.animationDuration);
    expect(parseInt(word1.style.animationDelay)).toBe(word0Duration);

    // Inactive line 1 should NOT have active class or per-word inline styles
    const inactiveLine = getByTestId('lyric-line-1');
    expect(inactiveLine.classList.contains('lyric-line-active')).toBe(false);

    const inactiveWord0 = getByTestId('word-1-0');
    expect(inactiveWord0.classList.contains('lyric-word-active')).toBe(false);
    expect(inactiveWord0.style.animationDuration).toBe('');
    expect(inactiveWord0.style.animationDelay).toBe('');
  });

  it('subtracts elapsed time from every word delay when opening or seeking mid-line', () => {
    // Current position 500ms into the active line (timeMs = 0)
    const { getByTestId } = render(
      <LyricsTestView
        lines={timedLines}
        activeIndex={0}
        isPaused={false}
        currentPos={500}
      />
    );

    const word0 = getByTestId('word-0-0');
    // Original delay was 0ms; with 500ms elapsed, new delay is -500ms
    expect(word0.style.animationDelay).toBe('-500ms');

    const word1 = getByTestId('word-0-1');
    const word0Duration = timedLines[0].words![0].endMs - timedLines[0].words![0].startMs;
    expect(parseInt(word1.style.animationDelay)).toBe(word0Duration - 500);
  });

  it('sets animationPlayState and --lyrics-play-state to paused on the container when paused', () => {
    const { getByTestId } = render(
      <LyricsTestView
        lines={timedLines}
        activeIndex={0}
        isPaused={true}
        currentPos={0}
      />
    );

    const container = getByTestId('lyrics-container');
    expect(container.getAttribute('data-paused')).toBe('true');
    expect(container.style.animationPlayState).toBe('paused');
    expect(container.style.getPropertyValue('--lyrics-play-state')).toBe('paused');
  });

  it('disables wipe animations when prefers-reduced-motion is active', () => {
    const { getByTestId } = render(
      <LyricsTestView
        lines={timedLines}
        activeIndex={0}
        isPaused={false}
        currentPos={0}
        isReduced={true}
      />
    );

    const activeLine = getByTestId('lyric-line-0');
    expect(activeLine.classList.contains('lyric-line-active')).toBe(true);

    const word0 = getByTestId('word-0-0');
    // Word should not have animation duration or delay styles when reduced motion is preferred
    expect(word0.style.animationDuration).toBe('');
    expect(word0.style.animationDelay).toBe('');
  });
});
