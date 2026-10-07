export interface LyricLine {
  timeMs: number;
  text: string;
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

  return result;
}
