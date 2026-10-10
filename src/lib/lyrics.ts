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
  
  // Matches [mm:ss.xx], [mm:ss.xxx], or [mm:ss]
  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]/;

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

export function parseTimestampToMs(timeStr: string): number | null {
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(?:(\d+):)?(\d{1,2}):(\d{2}(?:\.\d+)?)$/);
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseFloat(match[3]);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

export function formatLrcTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(Math.floor(seconds)).padStart(2, '0');
  const hundredths = String(Math.floor(Math.round((seconds - Math.floor(seconds)) * 100))).padStart(2, '0');
  return `[${mm}:${ss}.${hundredths}]`;
}

export function formatTimeDisplay(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export const RANGE_HEADER_REGEX =
  /^\s*[•\*\-·▪▫◦⁃]?\s*\[?\s*((?:\d+:)?\d{1,2}:\d{2}(?:\.\d+)?)\s*[-–—−―]\s*((?:\d+:)?\d{1,2}:\d{2}(?:\.\d+)?)\s*\]?\s*(?:[\|:]|\s+-\s+|\s+|$)(.*)$/;

const NON_LYRIC_PATTERNS = [
  /^intro(?:duction)?$/i,
  /^outro$/i,
  /^instrumental(?: break)?$/i,
  /^inst$/i,
  /^interlude$/i,
  /^humming$/i,
  /^hum$/i,
  /^(?:pre-?|post-?)?chorus(?: \d+| marker)?$/i,
  /^verse(?: \d+)?$/i,
  /^bridge$/i,
  /^hook$/i,
  /^refrain$/i,
  /^music(?:\s*\.{1,3}|\s*…|\s+starts|\s+begins|\s+break)?$/i,
  /^(?:guitar |piano |drum |sax )?solo$/i,
  /^bgm$/i,
  /^[♪♫♬♩♭♮♯]+$/,
];

export function isNonLyricLabel(rawText: string): boolean {
  if (!rawText) return false;
  let text = rawText
    .replace(/^\s*[•\*\-·▪▫◦⁃]\s*/, '')
    .trim();
  text = text.replace(/^[\[\(\{<](.*)[\]\)\}>]$/, '$1').trim();
  text = text.replace(/[.…!?:;\s]+$/, '').trim();
  if (!text) return true;
  return NON_LYRIC_PATTERNS.some((p) => p.test(text));
}

export function hasRangeTimestamps(text: string): boolean {
  if (!text) return false;
  const lines = text.split('\n');
  return lines.some((l) => RANGE_HEADER_REGEX.test(l));
}

export interface RangeBlock {
  startMs: number;
  endMs: number;
  lines: string[];
}

export interface ParsedRangeResult {
  lines: LyricLine[];
  lrcText: string;
  plainText: string;
  rawBlocks: RangeBlock[];
}

export function parseRangeBlocks(text: string): ParsedRangeResult {
  const rawLines = text.split('\n');
  const blocks: RangeBlock[] = [];
  let currentBlock: RangeBlock | null = null;

  for (const rawLine of rawLines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;

    const match = rawLine.match(RANGE_HEADER_REGEX);
    if (match) {
      const startMs = parseTimestampToMs(match[1]);
      const endMs = parseTimestampToMs(match[2]);
      if (startMs !== null && endMs !== null) {
        currentBlock = {
          startMs,
          endMs,
          lines: [],
        };
        blocks.push(currentBlock);

        const trailingText = (match[3] || '')
          .replace(/^\s*[•\*\-·▪▫◦⁃]\s*/, '')
          .trim();
        if (trailingText) {
          currentBlock.lines.push(trailingText);
        }
        continue;
      }
    }

    if (currentBlock) {
      const cleanLine = trimmedLine.replace(/^\s*[•\*\-·▪▫◦⁃]\s*/, '').trim();
      if (cleanLine) {
        currentBlock.lines.push(cleanLine);
      }
    }
  }

  const resultLines: LyricLine[] = [];
  const plainLines: string[] = [];

  for (const block of blocks) {
    const isOnlyLabel =
      block.lines.length === 0 ||
      (block.lines.length > 0 && block.lines.every((l) => isNonLyricLabel(l)));

    if (isOnlyLabel) {
      resultLines.push({
        timeMs: block.startMs,
        text: '♪',
      });
      plainLines.push('♪');
    } else {
      const count = block.lines.length;
      const duration = Math.max(0, block.endMs - block.startMs);
      const step = count > 0 ? duration / count : 0;

      for (let i = 0; i < count; i++) {
        const timeMs = block.startMs + Math.round(i * step);
        const lineText = block.lines[i];
        resultLines.push({
          timeMs,
          text: lineText,
        });
        plainLines.push(lineText);
      }
    }
  }

  const lrcText = resultLines
    .map((l) => `${formatLrcTimestamp(l.timeMs)} ${l.text}`)
    .join('\n');

  const plainText = plainLines.join('\n');

  return {
    lines: attachEstimatedWordTimings(resultLines),
    lrcText,
    plainText,
    rawBlocks: blocks,
  };
}

export function stripTimestamps(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(RANGE_HEADER_REGEX);
      if (match) {
        const trailing = (match[3] || '').replace(/^\s*[•\*\-·▪▫◦⁃]\s*/, '').trim();
        return isNonLyricLabel(trailing) ? '♪' : trailing;
      }
      const withoutLrc = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      return withoutLrc.replace(/^\s*[•\*\-·▪▫◦⁃]\s*/, '').trim();
    })
    .filter(Boolean)
    .join('\n');
}

export interface LyricsValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateLyricsTimestamps(
  lines: LyricLine[],
  durationMs?: number,
  rawBlocks?: RangeBlock[]
): LyricsValidationResult {
  if (!lines || lines.length === 0) {
    return { valid: true };
  }

  if (rawBlocks) {
    for (const b of rawBlocks) {
      if (b.endMs <= b.startMs) {
        return {
          valid: false,
          reason: `Block end timestamp (${formatTimeDisplay(b.endMs)}) must be greater than start (${formatTimeDisplay(b.startMs)}).`,
        };
      }
    }
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].timeMs < lines[i - 1].timeMs) {
      return {
        valid: false,
        reason: `Timestamps must be ascending (found ${formatTimeDisplay(lines[i].timeMs)} after ${formatTimeDisplay(lines[i - 1].timeMs)}).`,
      };
    }
  }

  if (durationMs && durationMs > 0) {
    const maxAllowedMs = durationMs + 5000;
    const lastLine = lines[lines.length - 1];
    if (lastLine.timeMs > maxAllowedMs) {
      return {
        valid: false,
        reason: `Timestamp ${formatTimeDisplay(lastLine.timeMs)} exceeds track duration (${formatTimeDisplay(durationMs)} + 5s buffer).`,
      };
    }
    if (rawBlocks) {
      for (const b of rawBlocks) {
        if (b.endMs > maxAllowedMs) {
          return {
            valid: false,
            reason: `Timestamp ${formatTimeDisplay(b.endMs)} exceeds track duration (${formatTimeDisplay(durationMs)} + 5s buffer).`,
          };
        }
      }
    }
  }

  return { valid: true };
}

export interface LyricsDetection {
  type: 'synced_range' | 'synced_lrc' | 'plain';
  lineCount: number;
  firstTimestampMs?: number;
  lastTimestampMs?: number;
  previewText: string;
  isValid: boolean;
  validationError?: string;
  lrcText: string | null;
  plainText: string;
  lines: LyricLine[];
}

export function detectLyrics(input: string, durationMs?: number): LyricsDetection {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return {
      type: 'plain',
      lineCount: 0,
      previewText: 'Plain text',
      isValid: true,
      lrcText: null,
      plainText: '',
      lines: [],
    };
  }

  // 1. Check if range block paste
  if (hasRangeTimestamps(trimmed)) {
    const parsed = parseRangeBlocks(trimmed);
    const validation = validateLyricsTimestamps(parsed.lines, durationMs, parsed.rawBlocks);

    const lineCount = parsed.lines.length;
    const firstMs = parsed.rawBlocks[0]?.startMs ?? parsed.lines[0]?.timeMs;
    const lastMs =
      parsed.rawBlocks[parsed.rawBlocks.length - 1]?.endMs ??
      parsed.lines[parsed.lines.length - 1]?.timeMs;

    if (!validation.valid) {
      return {
        type: 'synced_range',
        lineCount,
        firstTimestampMs: firstMs,
        lastTimestampMs: lastMs,
        previewText: `Plain text (${validation.reason})`,
        isValid: false,
        validationError: validation.reason,
        lrcText: null,
        plainText: parsed.plainText || stripTimestamps(trimmed),
        lines: [],
      };
    }

    const preview =
      firstMs !== undefined && lastMs !== undefined
        ? `Synced, ${lineCount} lines, ${formatTimeDisplay(firstMs)} to ${formatTimeDisplay(lastMs)}`
        : `Synced, ${lineCount} lines`;

    return {
      type: 'synced_range',
      lineCount,
      firstTimestampMs: firstMs,
      lastTimestampMs: lastMs,
      previewText: preview,
      isValid: true,
      lrcText: parsed.lrcText,
      plainText: parsed.plainText,
      lines: parsed.lines,
    };
  }

  // 2. Check if standard LRC
  const hasLrcTimestamps = /\[\d{2}:\d{2}(?:\.\d{2,3})?\]/.test(trimmed);
  if (hasLrcTimestamps) {
    const parsedLines = parseLrc(trimmed);
    const plainText = stripTimestamps(trimmed);
    const validation = validateLyricsTimestamps(parsedLines, durationMs);

    const lineCount = parsedLines.length;
    const firstMs = parsedLines[0]?.timeMs;
    const lastMs = parsedLines[parsedLines.length - 1]?.timeMs;

    if (!validation.valid) {
      return {
        type: 'synced_lrc',
        lineCount,
        firstTimestampMs: firstMs,
        lastTimestampMs: lastMs,
        previewText: `Plain text (${validation.reason})`,
        isValid: false,
        validationError: validation.reason,
        lrcText: null,
        plainText,
        lines: [],
      };
    }

    const preview =
      firstMs !== undefined && lastMs !== undefined
        ? `Synced, ${lineCount} lines, ${formatTimeDisplay(firstMs)} to ${formatTimeDisplay(lastMs)}`
        : `Synced, ${lineCount} lines`;

    return {
      type: 'synced_lrc',
      lineCount,
      firstTimestampMs: firstMs,
      lastTimestampMs: lastMs,
      previewText: preview,
      isValid: true,
      lrcText: trimmed,
      plainText,
      lines: parsedLines,
    };
  }

  // 3. Plain text
  const plainLines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  return {
    type: 'plain',
    lineCount: plainLines.length,
    previewText: 'Plain text',
    isValid: true,
    lrcText: null,
    plainText: trimmed,
    lines: [],
  };
}

