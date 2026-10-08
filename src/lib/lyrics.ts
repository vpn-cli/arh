export interface LyricWord {
  text: string;
  startMs: number;
  endMs: number;
}

export interface LyricLine {
  timeMs: number;
  text: string;
  words?: LyricWord[];
  timingSource?: 'estimated' | 'word';
}

export const LYRICS_TIMING_CONFIG = {
  gapRatio: 0.92,
  baseDurationMs: 400,
  msPerChar: 95,
};

/**
 * Counts vowel groups in a word to estimate syllables (minimum 1 per word).
 */
export function estimateSyllables(word: string): number {
  const matches = word.toLowerCase().match(/[aeiouy]+/g);
  return Math.max(1, matches ? matches.length : 1);
}

/**
 * Splits a line into distinct words while preserving valid tokens.
 */
export function splitLineIntoWords(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return ['♪'];
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length > 0 ? words : ['♪'];
}

/**
 * Computes the sung duration of a line:
 * min(gap to next line * 0.92, 400ms + 95ms per character).
 */
export function computeLineSungDuration(
  line: LyricLine,
  nextLine?: LyricLine,
  config = LYRICS_TIMING_CONFIG
): number {
  const charCount = line.text.trim().length;
  const charBasedDuration = config.baseDurationMs + config.msPerChar * charCount;

  if (!nextLine || nextLine.timeMs <= line.timeMs) {
    return charBasedDuration;
  }

  const gap = nextLine.timeMs - line.timeMs;
  const gapBasedDuration = gap * config.gapRatio;

  return Math.min(gapBasedDuration, charBasedDuration);
}

/**
 * Splits the line sung duration across words in proportion to estimated syllables.
 */
export function buildLineWords(
  line: LyricLine,
  sungDuration: number
): LyricWord[] {
  const rawWords = splitLineIntoWords(line.text);
  const syllables = rawWords.map(w => estimateSyllables(w));
  const totalSyllables = syllables.reduce((acc, s) => acc + s, 0) || 1;

  let currentOffset = 0;
  const words: LyricWord[] = [];

  for (let i = 0; i < rawWords.length; i++) {
    const isLast = i === rawWords.length - 1;
    const wordDuration = isLast
      ? Math.max(50, Math.round(sungDuration - currentOffset))
      : Math.max(50, Math.round((syllables[i] / totalSyllables) * sungDuration));

    const startMs = line.timeMs + currentOffset;
    const endMs = isLast
      ? line.timeMs + Math.round(sungDuration)
      : startMs + wordDuration;

    words.push({
      text: rawWords[i],
      startMs,
      endMs: Math.max(startMs + 50, endMs),
    });

    currentOffset += wordDuration;
  }

  return words;
}

/**
 * Attaches estimated word timings to an array of lyric lines.
 * If a line already provides real word timings (`timingSource: "word"`), it is preserved.
 * Computed once per track, not per frame.
 */
export function attachEstimatedWordTimings(
  lines: LyricLine[],
  config = LYRICS_TIMING_CONFIG
): LyricLine[] {
  return lines.map((line, i) => {
    // If a future source provides real word timings, preserve it
    if (line.timingSource === 'word' && line.words && line.words.length > 0) {
      return line;
    }

    const nextLine = lines[i + 1];
    const sungDuration = computeLineSungDuration(line, nextLine, config);
    const words = buildLineWords(line, sungDuration);

    return {
      ...line,
      words,
      timingSource: 'estimated' as const,
    };
  });
}

export function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  
  // Matches [mm:ss.xx] or [mm:ss.xxx]
  const timeRegex = /\[(\d{2}):(\d{2}\.\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2]);
      const timeMs = Math.floor((min * 60 + sec) * 1000);
      const text = line.replace(timeRegex, '').trim();
      
      result.push({ timeMs, text });
    }
  }

  return attachEstimatedWordTimings(result);
}
