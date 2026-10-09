/**
 * Lyrics Lookup and Matching Library
 * Supports 4-step LRCLIB fallback chain, candidate similarity matching,
 * duration threshold checks, and LRC parsing.
 */

export interface LrclibTrack {
  id?: number;
  name?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

export interface LookupQuery {
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  durationSec: number;
}

export interface ProcessedLyrics {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  instrumental: boolean;
}

export type ChainStep = 'a' | 'b' | 'c' | 'd' | 'none';

/**
 * Strips featuring artists, remasters, radio edits, single versions,
 * live recordings, and edition suffixes from a track title.
 */
export function cleanTrackTitle(title: string): string {
  if (!title) return '';

  let cleaned = title;

  // 1. Strip featuring artists in brackets/parentheses: (feat. ...), [ft. ...], (with ...)
  cleaned = cleaned.replace(/\s*[\(\[](?:feat\.?|ft\.?|with)\s+[^)\]]+[\)\]]/gi, '');
  // Also strip standalone "feat. ...", "ft. ...", "with ..." at the end
  cleaned = cleaned.replace(/\s+(?:feat\.?|ft\.?|with)\s+.*$/gi, '');

  // 2. Strip remastered markers: "- Remastered 2014", "- 2011 Remaster", "(Remastered)", etc.
  cleaned = cleaned.replace(/\s*-\s*.*?\bremaster(?:ed)?(?:\s+\d{4})?.*$/gi, '');
  cleaned = cleaned.replace(/\s*[\(\[].*?\bremaster(?:ed)?(?:\s+\d{4})?.*?[\)\]]/gi, '');

  // 3. Strip radio edits, single/album versions, mixes
  cleaned = cleaned.replace(/\s*-\s*.*?\b(?:radio edit|single version|album version|single edit|original mix|club mix|extended mix|extended version)\b.*$/gi, '');
  cleaned = cleaned.replace(/\s*[\(\[].*?\b(?:radio edit|single version|album version|single edit|original mix|club mix|extended mix|extended version)\b.*?[\)\]]/gi, '');

  // 4. Strip live recordings: "(Live at ...)", "- Live", etc.
  cleaned = cleaned.replace(/\s*-\s*.*?\blive(?:\s+at|\s+\d{4}|\s+session)?\b.*$/gi, '');
  cleaned = cleaned.replace(/\s*[\(\[].*?\blive(?:\s+at|\s+\d{4}|\s+session)?.*?[\)\]]/gi, '');

  // 5. Strip bonus track / deluxe / anniversary edition markers
  cleaned = cleaned.replace(/\s*[\(\[].*?\b(?:bonus track|deluxe edition|anniversary edition|mono|stereo)\b.*?[\)\]]/gi, '');

  // 6. Clean up trailing dashes, symbols, or excessive whitespace
  cleaned = cleaned.replace(/\s*-\s*$/, '').replace(/\s+/g, ' ').trim();

  return cleaned || title.trim();
}

/**
 * Extracts primary artist from Spotify artist name or artist list.
 * Strips features or secondary artists.
 */
export function getPrimaryArtist(artists: string | { name: string }[] | undefined): string {
  if (!artists) return '';
  const raw = Array.isArray(artists) ? artists[0]?.name || '' : artists;
  // Take part before "feat.", "ft.", "with", ",", "&"
  const primary = raw.split(/\s+(?:feat\.?|ft\.?|with|&)\s+|,/i)[0].trim();
  return primary || raw.trim();
}

/**
 * Normalizes strings for loose title/artist matching.
 * Converts to lowercase, strips accents, removes punctuation.
 */
export function normalizeForMatching(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"״`´]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Checks if a candidate track closely matches the target track title and artist.
 * Prevents false positives (e.g. "Yellow Submarine" matching "Yellow").
 */
export function isCloseMatch(
  target: { title: string; artist: string },
  candidate: LrclibTrack
): boolean {
  const targetCleanTitle = cleanTrackTitle(target.title);
  const candCleanTitle = cleanTrackTitle(candidate.trackName || candidate.name || '');

  const normTargetTitle = normalizeForMatching(targetCleanTitle);
  const normCandTitle = normalizeForMatching(candCleanTitle);

  if (!normTargetTitle || !normCandTitle) return false;

  // 1. Artist Matching
  const targetPrimaryArtist = normalizeForMatching(getPrimaryArtist(target.artist));
  const candPrimaryArtist = normalizeForMatching(getPrimaryArtist(candidate.artistName || ''));
  const normCandFullArtist = normalizeForMatching(candidate.artistName || '');

  // Strip leading "the " for comparison if needed
  const stripThe = (s: string) => s.replace(/^the\s+/, '');
  const tArtBase = stripThe(targetPrimaryArtist);
  const cArtBase = stripThe(candPrimaryArtist);

  const artistMatches =
    tArtBase === cArtBase ||
    targetPrimaryArtist === candPrimaryArtist ||
    candPrimaryArtist.startsWith(targetPrimaryArtist) ||
    normCandFullArtist.includes(targetPrimaryArtist) ||
    levenshteinDistance(tArtBase, cArtBase) <= Math.max(1, Math.floor(tArtBase.length * 0.2));

  if (!artistMatches) return false;

  // 2. Title Matching
  if (normTargetTitle === normCandTitle) return true;

  const tTitleBase = stripThe(normTargetTitle);
  const cTitleBase = stripThe(normCandTitle);
  if (tTitleBase === cTitleBase) return true;

  // Word token comparison
  const targetWords = tTitleBase.split(' ').filter(Boolean);
  const candWords = cTitleBase.split(' ').filter(Boolean);

  // If word counts match exactly or difference is at most 1 word and words overlap heavily
  if (targetWords.join(' ') === candWords.join(' ')) return true;

  // Check Levenshtein distance on normalized titles
  const maxLen = Math.max(tTitleBase.length, cTitleBase.length);
  const lenDiff = Math.abs(tTitleBase.length - cTitleBase.length);

  // If length difference is more than 30% of target title, reject (prevents "Yellow Submarine" matching "Yellow")
  if (lenDiff > Math.max(2, Math.floor(tTitleBase.length * 0.3))) {
    return false;
  }

  const dist = levenshteinDistance(tTitleBase, cTitleBase);
  const maxAllowedDist = Math.max(1, Math.floor(maxLen * 0.2)); // at most 20% edits

  return dist <= maxAllowedDist;
}

/**
 * Extracts plain text from LRC formatted string by removing timestamps.
 */
export function extractPlainFromLrc(lrc: string): string {
  if (!lrc) return '';
  return lrc
    .split('\n')
    .map(line => line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Filters and selects the best candidate from a search result list:
 * 1. Must closely match title and artist
 * 2. Must have lyrics or be instrumental
 * 3. Prefers results with syncedLyrics
 * 4. Then closest duration
 */
export function pickBestSearchResult(
  candidates: LrclibTrack[],
  target: { title: string; artist: string; durationSec: number }
): LrclibTrack | null {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const valid = candidates.filter(cand => {
    // Must closely match
    if (!isCloseMatch(target, cand)) return false;

    // Must have content
    const hasSynced = Boolean(cand.syncedLyrics && cand.syncedLyrics.trim().length > 0);
    const hasPlain = Boolean(cand.plainLyrics && cand.plainLyrics.trim().length > 0);
    const isInstrumental = Boolean(cand.instrumental);

    return hasSynced || hasPlain || isInstrumental;
  });

  if (valid.length === 0) return null;

  // Sort: syncedLyrics first, then closest duration
  valid.sort((a, b) => {
    const aSynced = a.syncedLyrics && a.syncedLyrics.trim().length > 0 ? 1 : 0;
    const bSynced = b.syncedLyrics && b.syncedLyrics.trim().length > 0 ? 1 : 0;

    if (bSynced !== aSynced) {
      return bSynced - aSynced;
    }

    const aDiff = Math.abs((a.duration || 0) - target.durationSec);
    const bDiff = Math.abs((b.duration || 0) - target.durationSec);
    return aDiff - bDiff;
  });

  return valid[0] || null;
}

/**
 * Applies the 3-second duration threshold:
 * If duration difference > 3 seconds, discard syncedLyrics and keep only plainLyrics.
 */
export function processCandidateLyrics(
  candidate: LrclibTrack,
  spotifyDurationSec: number
): ProcessedLyrics {
  if (candidate.instrumental) {
    return {
      syncedLyrics: null,
      plainLyrics: null,
      instrumental: true,
    };
  }

  const candDuration = candidate.duration || 0;
  const durationDiff = Math.abs(candDuration - spotifyDurationSec);

  // If candidate has duration specified and diff > 3s, drop syncedLyrics
  if (candDuration > 0 && durationDiff > 3) {
    const plain = candidate.plainLyrics || (candidate.syncedLyrics ? extractPlainFromLrc(candidate.syncedLyrics) : null);
    return {
      syncedLyrics: null,
      plainLyrics: plain,
      instrumental: false,
    };
  }

  return {
    syncedLyrics: candidate.syncedLyrics || null,
    plainLyrics: candidate.plainLyrics || (candidate.syncedLyrics ? extractPlainFromLrc(candidate.syncedLyrics) : null),
    instrumental: false,
  };
}

const LRCLIB_USER_AGENT = 'Arh-Music-Player (https://github.com/vipin/arh)';

export type UpstreamErrorKind = 'timeout' | 'rate_limited' | 'server_error' | 'network_error';

export interface LookupOutcome {
  result: ProcessedLyrics | null;
  matchedStep: ChainStep;
  hasUpstreamError: boolean;
  upstreamError?: UpstreamErrorKind;
  lrclibRecordId?: number;
}

/**
 * Executes the 4-step LRCLIB lookup chain:
 * a. /api/get with track, artist, album, duration
 * b. /api/get again without album
 * c. /api/search with cleaned track_name and primary artist_name
 * d. /api/search with q = cleaned title + primary artist
 *
 * Tracks upstream failures (timeout, 429, 5xx) so they are NEVER cached as negative not_found.
 */
export async function lookupLyrics(query: LookupQuery): Promise<LookupOutcome> {
  const { title, artist, album, durationSec } = query;
  const cleanedTitle = cleanTrackTitle(title);
  const primaryArtist = getPrimaryArtist(artist);

  let encounteredError: UpstreamErrorKind | undefined = undefined;

  // Helper for /api/get
  const fetchGet = async (
    params: Record<string, string>
  ): Promise<{ status: 'hit' | 'not_found' | 'error'; data?: LrclibTrack; error?: UpstreamErrorKind }> => {
    try {
      const url = `https://lrclib.net/api/get?${new URLSearchParams(params).toString()}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': LRCLIB_USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });

      if (res.status === 200) {
        const data: LrclibTrack = await res.json();
        if (
          data &&
          (data.instrumental ||
            (data.syncedLyrics && data.syncedLyrics.trim().length > 0) ||
            (data.plainLyrics && data.plainLyrics.trim().length > 0))
        ) {
          return { status: 'hit', data };
        }
        return { status: 'not_found' };
      }

      if (res.status === 404) {
        return { status: 'not_found' };
      }

      if (res.status === 429) {
        return { status: 'error', error: 'rate_limited' };
      }

      if (res.status >= 500) {
        return { status: 'error', error: 'server_error' };
      }

      return { status: 'error', error: 'server_error' };
    } catch (e: any) {
      if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
        return { status: 'error', error: 'timeout' };
      }
      return { status: 'error', error: 'network_error' };
    }
  };

  // Helper for /api/search
  const fetchSearch = async (
    params: Record<string, string>
  ): Promise<{ status: 'hit' | 'not_found' | 'error'; data?: LrclibTrack[]; error?: UpstreamErrorKind }> => {
    try {
      const url = `https://lrclib.net/api/search?${new URLSearchParams(params).toString()}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': LRCLIB_USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });

      if (res.status === 200) {
        const data = await res.json();
        return { status: 'hit', data: Array.isArray(data) ? data : [] };
      }

      if (res.status === 404) {
        return { status: 'not_found', data: [] };
      }

      if (res.status === 429) {
        return { status: 'error', error: 'rate_limited' };
      }

      if (res.status >= 500) {
        return { status: 'error', error: 'server_error' };
      }

      return { status: 'error', error: 'server_error' };
    } catch (e: any) {
      if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
        return { status: 'error', error: 'timeout' };
      }
      return { status: 'error', error: 'network_error' };
    }
  };

  // Step a: /api/get with track, artist, album, duration
  if (album && album.trim().length > 0) {
    const resA = await fetchGet({
      track_name: title,
      artist_name: artist,
      album_name: album,
      duration: durationSec.toString(),
    });
    if (resA.status === 'hit' && resA.data) {
      return {
        result: processCandidateLyrics(resA.data, durationSec),
        matchedStep: 'a',
        hasUpstreamError: false,
        lrclibRecordId: resA.data.id,
      };
    } else if (resA.status === 'error') {
      encounteredError = resA.error;
    }
  }

  // Step b: /api/get without album
  const resB = await fetchGet({
    track_name: title,
    artist_name: artist,
    duration: durationSec.toString(),
  });
  if (resB.status === 'hit' && resB.data) {
    return {
      result: processCandidateLyrics(resB.data, durationSec),
      matchedStep: 'b',
      hasUpstreamError: false,
      lrclibRecordId: resB.data.id,
    };
  } else if (resB.status === 'error') {
    encounteredError = resB.error;
  }

  // Step c: /api/search with track_name and artist_name
  const resC = await fetchSearch({
    track_name: cleanedTitle,
    artist_name: primaryArtist,
  });
  if (resC.status === 'hit' && resC.data) {
    const bestC = pickBestSearchResult(resC.data, {
      title: cleanedTitle,
      artist: primaryArtist,
      durationSec,
    });
    if (bestC) {
      return {
        result: processCandidateLyrics(bestC, durationSec),
        matchedStep: 'c',
        hasUpstreamError: false,
        lrclibRecordId: bestC.id,
      };
    }
  } else if (resC.status === 'error') {
    encounteredError = resC.error;
  }

  // Step d: /api/search with q = cleaned title + primary artist
  const resD = await fetchSearch({
    q: `${cleanedTitle} ${primaryArtist}`.trim(),
  });
  if (resD.status === 'hit' && resD.data) {
    const bestD = pickBestSearchResult(resD.data, {
      title: cleanedTitle,
      artist: primaryArtist,
      durationSec,
    });
    if (bestD) {
      return {
        result: processCandidateLyrics(bestD, durationSec),
        matchedStep: 'd',
        hasUpstreamError: false,
        lrclibRecordId: bestD.id,
      };
    }
  } else if (resD.status === 'error') {
    encounteredError = resD.error;
  }

  // If no hit was found, check whether an upstream error occurred during lookup
  if (encounteredError) {
    return {
      result: null,
      matchedStep: 'none',
      hasUpstreamError: true,
      upstreamError: encounteredError,
    };
  }

  // Clean "no results" response
  return {
    result: null,
    matchedStep: 'none',
    hasUpstreamError: false,
  };
}
