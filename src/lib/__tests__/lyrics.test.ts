import { describe, it, expect } from 'vitest';
import {
  parseLrc,
  estimateSyllables,
  computeLineSungDuration,
  buildLineWords,
  attachEstimatedWordTimings,
  LYRICS_TIMING_CONFIG,
  LyricLine,
  parseRangeBlocks,
  validateLyricsTimestamps,
  detectLyrics,
  stripTimestamps,
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

describe('range block parser and validation', () => {
  it('parses two-line blocks and spreads lines evenly across the time range', () => {
    const input = `• 0:19 – 0:35 | first line
second line`;

    const parsed = parseRangeBlocks(input);
    expect(parsed.lines).toHaveLength(2);

    // Line 1 starts at 0:19 (19000ms)
    expect(parsed.lines[0].timeMs).toBe(19000);
    expect(parsed.lines[0].text).toBe('first line');

    // Line 2 starts at 0:27 (19000 + (35000 - 19000) / 2 = 27000ms)
    expect(parsed.lines[1].timeMs).toBe(27000);
    expect(parsed.lines[1].text).toBe('second line');

    // LRC output matches standard format
    expect(parsed.lrcText).toBe('[00:19.00] first line\n[00:27.00] second line');

    // Clean plain text has all timestamps and bullets removed
    expect(parsed.plainText).toBe('first line\nsecond line');
  });

  it('converts label-only blocks into a single instrumental marker line at block start', () => {
    const input = `• 0:00 – 0:19 | Intro
• 0:19 – 0:35 | first line
• 0:35 – 0:50 | [Instrumental]
• 0:50 – 1:05 | Outro`;

    const parsed = parseRangeBlocks(input);
    expect(parsed.lines).toHaveLength(4);

    // Block 1 (Intro) -> single marker at 0:00
    expect(parsed.lines[0].timeMs).toBe(0);
    expect(parsed.lines[0].text).toBe('♪');

    // Block 2 (lyric) -> first line at 0:19
    expect(parsed.lines[1].timeMs).toBe(19000);
    expect(parsed.lines[1].text).toBe('first line');

    // Block 3 ([Instrumental]) -> single marker at 0:35
    expect(parsed.lines[2].timeMs).toBe(35000);
    expect(parsed.lines[2].text).toBe('♪');

    // Block 4 (Outro) -> single marker at 0:50
    expect(parsed.lines[3].timeMs).toBe(50000);
    expect(parsed.lines[3].text).toBe('♪');

    expect(parsed.plainText).toBe('♪\nfirst line\n♪\n♪');
  });

  it('supports mixed dash styles (hyphen, en dash, em dash) and optional bullets/hours', () => {
    const input = `0:10 - 0:20 | hyphen block
• 0:20 – 0:30 | en-dash block
1:01:00 — 1:01:30 | em-dash with hours`;

    const parsed = parseRangeBlocks(input);
    expect(parsed.lines).toHaveLength(3);

    // Hyphen block
    expect(parsed.lines[0].timeMs).toBe(10000);
    expect(parsed.lines[0].text).toBe('hyphen block');

    // En-dash block
    expect(parsed.lines[1].timeMs).toBe(20000);
    expect(parsed.lines[1].text).toBe('en-dash block');

    // Em-dash block with hours: 1 hr + 1 min = 3660s = 3660000ms
    expect(parsed.lines[2].timeMs).toBe(3660000);
    expect(parsed.lines[2].text).toBe('em-dash with hours');
  });

  it('fails validation when timestamps are not ascending', () => {
    // End time before start time
    const invalidBlock = `• 0:35 – 0:19 | inverted line`;
    const parsed1 = parseRangeBlocks(invalidBlock);
    const val1 = validateLyricsTimestamps(parsed1.lines, undefined, parsed1.rawBlocks);
    expect(val1.valid).toBe(false);
    expect(val1.reason).toContain('greater than start');

    // Out-of-order blocks
    const outOfOrder = `• 0:40 – 0:50 | later line
• 0:20 – 0:30 | earlier line`;
    const parsed2 = parseRangeBlocks(outOfOrder);
    const val2 = validateLyricsTimestamps(parsed2.lines, undefined, parsed2.rawBlocks);
    expect(val2.valid).toBe(false);
    expect(val2.reason).toContain('Timestamps must be ascending');

    // detectLyrics marks as invalid and falls back to plain preview
    const detection = detectLyrics(outOfOrder);
    expect(detection.isValid).toBe(false);
    expect(detection.previewText).toContain('Timestamps must be ascending');
    expect(detection.lrcText).toBeNull();
  });

  it('fails validation when timestamp exceeds track duration (allowing 5s over)', () => {
    const trackDurationMs = 180000; // 3:00 = 180s
    // Max allowed is 185s (3:05)

    // Case 1: timestamp is 3:04 (184s) -> within 5s over buffer -> VALID
    const withinBuffer = `• 3:00 – 3:04 | outro line`;
    const parsedOk = parseRangeBlocks(withinBuffer);
    const valOk = validateLyricsTimestamps(parsedOk.lines, trackDurationMs, parsedOk.rawBlocks);
    expect(valOk.valid).toBe(true);

    // Case 2: timestamp is 3:10 (190s) -> exceeds 185s -> INVALID
    const exceedsBuffer = `• 3:00 – 3:10 | too late line`;
    const parsedBad = parseRangeBlocks(exceedsBuffer);
    const valBad = validateLyricsTimestamps(parsedBad.lines, trackDurationMs, parsedBad.rawBlocks);
    expect(valBad.valid).toBe(false);
    expect(valBad.reason).toContain('exceeds track duration');

    const detection = detectLyrics(exceedsBuffer, trackDurationMs);
    expect(detection.isValid).toBe(false);
    expect(detection.previewText).toContain('exceeds track duration');
    expect(detection.lrcText).toBeNull();
  });

  it('detectLyrics generates human-readable one-line previews', () => {
    const rangeInput = `• 0:19 – 0:35 | first line
• 0:35 – 3:56 | second line`;
    const rangeDetection = detectLyrics(rangeInput);
    expect(rangeDetection.isValid).toBe(true);
    expect(rangeDetection.type).toBe('synced_range');
    expect(rangeDetection.lineCount).toBe(2);
    expect(rangeDetection.previewText).toBe('Synced, 2 lines, 0:19 to 3:56');

    const plainInput = `Just plain lyrics
Without any timestamps`;
    const plainDetection = detectLyrics(plainInput);
    expect(plainDetection.type).toBe('plain');
    expect(plainDetection.isValid).toBe(true);
    expect(plainDetection.previewText).toBe('Plain text');
  });

  it('stripTimestamps removes all bullets and timestamps cleanly', () => {
    const rangeInput = `• 0:19 – 0:35 | line one
• 0:35 – 0:50 | [Guitar Solo]
• line three`;
    expect(stripTimestamps(rangeInput)).toBe('line one\n♪\nline three');

    const lrcInput = `[00:19.00] line one
[00:35.00] line two`;
    expect(stripTimestamps(lrcInput)).toBe('line one\nline two');
  });
});

