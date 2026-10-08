import { describe, it, expect } from 'vitest';
import {
  parseLrc,
  estimateSyllables,
  computeLineSungDuration,
  buildLineWords,
  attachEstimatedWordTimings,
  LYRICS_TIMING_CONFIG,
  LyricLine,
} from '../lyrics';

describe('lyrics word timing estimation', () => {
  it('counts vowel groups as syllables with minimum 1 per word', () => {
    expect(estimateSyllables('the')).toBe(1);
    expect(estimateSyllables('apple')).toBe(2);
    expect(estimateSyllables('beautiful')).toBe(3);
    expect(estimateSyllables('rhythm')).toBe(1);
    expect(estimateSyllables('fly')).toBe(1);
    expect(estimateSyllables('queue')).toBe(1);
    expect(estimateSyllables('shh')).toBe(1);
    expect(estimateSyllables('123')).toBe(1);
  });

  it('computes sung duration as min(gap * 0.92, 400ms + 95ms per character)', () => {
    const line: LyricLine = { timeMs: 1000, text: 'Hello world' }; // 11 characters -> 400 + 95*11 = 1445ms
    const nextLineLongGap: LyricLine = { timeMs: 10000, text: 'Next line' }; // gap = 9000ms -> 9000 * 0.92 = 8280ms
    const nextLineShortGap: LyricLine = { timeMs: 2000, text: 'Next line' }; // gap = 1000ms -> 1000 * 0.92 = 920ms

    // Long gap: character-based duration wins
    expect(computeLineSungDuration(line, nextLineLongGap)).toBe(1445);

    // Short gap: gap-based duration wins
    expect(computeLineSungDuration(line, nextLineShortGap)).toBe(920);

    // No next line: character-based duration
    expect(computeLineSungDuration(line)).toBe(1445);
  });

  it('allows tuning of LYRICS_TIMING_CONFIG numbers', () => {
    const customConfig = {
      gapRatio: 0.8,
      baseDurationMs: 500,
      msPerChar: 100,
    };
    const line: LyricLine = { timeMs: 1000, text: 'Hi' }; // 2 chars -> 500 + 100*2 = 700ms
    const nextLine: LyricLine = { timeMs: 2000, text: 'Next' }; // gap = 1000ms -> 1000 * 0.8 = 800ms
    expect(computeLineSungDuration(line, nextLine, customConfig)).toBe(700);
  });

  it('splits line duration across words in proportion to syllables', () => {
    // "Hello beautiful world"
    // "Hello" -> 2 syllables
    // "beautiful" -> 3 syllables
    // "world" -> 1 syllable
    // Total syllables = 6
    const line: LyricLine = { timeMs: 5000, text: 'Hello beautiful world' };
    const words = buildLineWords(line, 600);

    expect(words).toHaveLength(3);
    expect(words[0].text).toBe('Hello');
    expect(words[0].startMs).toBe(5000);
    expect(words[0].endMs).toBe(5200); // 2/6 * 600 = 200ms

    expect(words[1].text).toBe('beautiful');
    expect(words[1].startMs).toBe(5200);
    expect(words[1].endMs).toBe(5500); // 3/6 * 600 = 300ms

    expect(words[2].text).toBe('world');
    expect(words[2].startMs).toBe(5500);
    expect(words[2].endMs).toBe(5600); // 1/6 * 600 = 100ms
  });

  it('parses LRC and attaches estimated word timings once per track', () => {
    const lrc = `[00:01.00]First line
[00:05.00]Second line here`;

    const parsed = parseLrc(lrc);
    expect(parsed).toHaveLength(2);

    expect(parsed[0].timingSource).toBe('estimated');
    expect(parsed[0].words).toBeDefined();
    expect(parsed[0].words!.length).toBe(2);
    expect(parsed[0].words![0].text).toBe('First');
    expect(parsed[0].words![1].text).toBe('line');

    expect(parsed[1].timingSource).toBe('estimated');
    expect(parsed[1].words).toBeDefined();
    expect(parsed[1].words!.length).toBe(3);
  });

  it('preserves existing real word timings if timingSource is "word"', () => {
    const linesWithRealWords: LyricLine[] = [
      {
        timeMs: 1000,
        text: 'Custom timed line',
        timingSource: 'word',
        words: [
          { text: 'Custom', startMs: 1000, endMs: 1400 },
          { text: 'timed', startMs: 1400, endMs: 1800 },
          { text: 'line', startMs: 1800, endMs: 2200 },
        ],
      },
    ];

    const result = attachEstimatedWordTimings(linesWithRealWords);
    expect(result[0].timingSource).toBe('word');
    expect(result[0].words![0].endMs).toBe(1400);
  });
});
