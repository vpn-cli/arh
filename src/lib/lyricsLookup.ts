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
  primaryArtist?: string;
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
 * live recordings, edition, verse, remix, and tempo modification suffixes from a track title.
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

  // 6. Strip verse markers: "- Talwiinder Verse", "- ... Verse", "(... Verse)"
  cleaned = cleaned.replace(/\s*-\s*.*?\bverse\b.*$/gi, '');
  cleaned = cleaned.replace(/\s*[\(\[].*?\bverse\b.*?[\)\]]/gi, '');

  // 7. Strip remix markers: "- ... Remix", "(... Remix)"
  cleaned = cleaned.replace(/\s*-\s*.*?\bremix\b.*$/gi, '');
  cleaned = cleaned.replace(/\s*[\(\[].*?\bremix\b.*?[\)\]]/gi, '');

  // 8. Strip acoustic / slowed / reverb / sped up markers
  cleaned = cleaned.replace(/\s*-\s*.*?\b(?:slowed(?:\s*\+\s*reverb)?|reverb|sped\s*up|speed(?:\s*ed)?\s*up|nightcore|daycore|acoustic)\b.*$/gi, '');
  cleaned = cleaned.replace(/\s*[\(\[].*?\b(?:slowed(?:\s*\+\s*reverb)?|reverb|sped\s*up|speed(?:\s*ed)?\s*up|nightcore|daycore|acoustic)\b.*?[\)\]]/gi, '');

  // 9. Clean up trailing dashes, symbols, or excessive whitespace
  cleaned = cleaned.replace(/\s*-\s*$/, '').replace(/\s+/g, ' ').trim();

  return cleaned || title.trim();
}

/**
 * Checks if the title indicates tempo modifications (slowed, reverb, sped up, nightcore).
 * When true, synced lyrics must never be used because the audio timestamps will not align.
 */
export function isTempoModifiedTitle(title: string): boolean {
  if (!title) return false;
  return /\b(?:slowed|reverb|sped\s*up|speed(?:\s*ed)?\s*up|nightcore|daycore)\b/i.test(title);
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

export { getArtistNames, type TrackArtistSource } from './artistNames';

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
 * Applies duration threshold and tempo check:
 * - If isTempoModified is true: drop syncedLyrics (keep plain).
 * - If duration difference > 3 seconds, discard syncedLyrics and keep only plainLyrics.
 */
export function processCandidateLyrics(
  candidate: LrclibTrack,
  spotifyDurationSec: number,
  isTempoModified: boolean = false
): ProcessedLyrics {
  if (candidate.instrumental) {
    return {
      syncedLyrics: null,
      plainLyrics: null,
      instrumental: true,
    };
  }

  // Tempo modified songs (slowed/reverb/sped up) must never use synced lyrics
  if (isTempoModified) {
    const plain = candidate.plainLyrics || (candidate.syncedLyrics ? extractPlainFromLrc(candidate.syncedLyrics) : null);
    return {
      syncedLyrics: null,
      plainLyrics: plain,
      instrumental: false,
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

const LRCLIB_USER_AGENT = 'punkrose.fm/1.0 (+https://punkrose.fm; https://github.com/vpn-cli/arh)';
const TOTAL_LOOKUP_BUDGET_MS = 8000;

export type UpstreamErrorKind = 'timeout' | 'rate_limited' | 'server_error' | 'network_error';

export interface LookupOutcome {
  result: ProcessedLyrics | null;
  matchedStep: ChainStep;
  hasUpstreamError: boolean;
  upstreamError?: UpstreamErrorKind;
  lrclibRecordId?: number;
}

interface FetchResult<T> {
  status: 'hit' | 'not_found' | 'error';
  data?: T;
  error?: UpstreamErrorKind;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes an HTTP request to LRCLIB with:
 * - Deadline enforcement (skips if remaining budget < 600ms)
 * - Individual timeout capped at Math.min(3000ms, remainingBudget)
 * - At most 1 retry with jittered backoff for 5xx and timeouts only
 * - Immediate handling of 429 Retry-After header
 */
async function fetchLrclibWithRetry<T>(
  url: string,
  deadline: number,
  isSearch: boolean = false
): Promise<FetchResult<T>> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 600) {
      return { status: 'error', error: 'timeout' };
    }

    const timeoutMs = Math.min(3000, remaining);

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': LRCLIB_USER_AGENT },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 200) {
        const json = await res.json();
        if (isSearch) {
          return { status: 'hit', data: Array.isArray(json) ? (json as any) : [] };
        }
        if (
          json &&
          (json.instrumental ||
            (json.syncedLyrics && json.syncedLyrics.trim().length > 0) ||
            (json.plainLyrics && json.plainLyrics.trim().length > 0))
        ) {
          return { status: 'hit', data: json as any };
        }
        return { status: 'not_found' };
      }

      if (res.status === 404) {
        return isSearch ? { status: 'hit', data: [] as any } : { status: 'not_found' };
      }

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After');
        const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 2;
        const retryAfterMs = (isNaN(retryAfterSec) ? 2 : retryAfterSec) * 1000;

        if (attempt >= 1 || Date.now() + retryAfterMs > deadline) {
          return { status: 'error', error: 'rate_limited' };
        }
        await sleep(retryAfterMs);
        continue;
      }

      // 5xx server error
      if (res.status >= 500) {
        if (attempt === 0) {
          const remainingAfter = deadline - Date.now();
          if (remainingAfter > 1200) {
            const jitter = 400 + Math.floor(Math.random() * 200);
            await sleep(jitter);
            continue;
          }
        }
        return { status: 'error', error: 'server_error' };
      }

      return { status: 'error', error: 'server_error' };
    } catch (e: any) {
      const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
      if (attempt === 0) {
        const remainingAfter = deadline - Date.now();
        if (remainingAfter > 1200) {
          const jitter = 400 + Math.floor(Math.random() * 200);
          await sleep(jitter);
          continue;
        }
      }
      return { status: 'error', error: isTimeout ? 'timeout' : 'network_error' };
    }
  }

  return { status: 'error', error: 'timeout' };
}

/**
 * Executes the 4-step LRCLIB lookup chain:
 * a. /api/get with track, artist, album, duration (with primary artist fallback)
 * b. /api/get without album (with primary artist fallback)
 * c. /api/search with cleaned track_name and primary artist_name
 * d. /api/search with q = cleaned title + primary artist
 *
 * Enforces an overall 8s budget deadline and tracks upstream failures so they are NEVER cached as negative not_found.
 */
export async function lookupLyrics(query: LookupQuery): Promise<LookupOutcome> {
  const { title, artist, album, durationSec } = query;
  const cleanedTitle = cleanTrackTitle(title);
  const primaryArtist = query.primaryArtist ?? getPrimaryArtist(artist);
  const isTempoModified = isTempoModifiedTitle(title);

  const deadline = Date.now() + TOTAL_LOOKUP_BUDGET_MS;
  let encounteredError: UpstreamErrorKind | undefined = undefined;

  // Helper for /api/get
  const fetchGet = async (params: Record<string, string>): Promise<FetchResult<LrclibTrack>> => {
    const url = `https://lrclib.net/api/get?${new URLSearchParams(params).toString()}`;
    return fetchLrclibWithRetry<LrclibTrack>(url, deadline, false);
  };

  // Helper for /api/search
  const fetchSearch = async (params: Record<string, string>): Promise<FetchResult<LrclibTrack[]>> => {
    const url = `https://lrclib.net/api/search?${new URLSearchParams(params).toString()}`;
    return fetchLrclibWithRetry<LrclibTrack[]>(url, deadline, true);
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
        result: processCandidateLyrics(resA.data, durationSec, isTempoModified),
        matchedStep: 'a',
        hasUpstreamError: false,
        lrclibRecordId: resA.data.id,
      };
    } else if (resA.status === 'error') {
      encounteredError = resA.error;
    } else if (resA.status === 'not_found' && primaryArtist && primaryArtist !== artist) {
      // Primary artist fallback for step a: try raw title with primary artist first, then cleaned title if distinct
      let resAFallback = await fetchGet({
        track_name: title,
        artist_name: primaryArtist,
        album_name: album,
        duration: durationSec.toString(),
      });
      if (resAFallback.status === 'not_found' && cleanedTitle && cleanedTitle !== title) {
        resAFallback = await fetchGet({
          track_name: cleanedTitle,
          artist_name: primaryArtist,
          album_name: album,
          duration: durationSec.toString(),
        });
      }
      if (resAFallback.status === 'hit' && resAFallback.data) {
        return {
          result: processCandidateLyrics(resAFallback.data, durationSec, isTempoModified),
          matchedStep: 'a',
          hasUpstreamError: false,
          lrclibRecordId: resAFallback.data.id,
        };
      } else if (resAFallback.status === 'error') {
        encounteredError = resAFallback.error;
      }
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
      result: processCandidateLyrics(resB.data, durationSec, isTempoModified),
      matchedStep: 'b',
      hasUpstreamError: false,
      lrclibRecordId: resB.data.id,
    };
  } else if (resB.status === 'error') {
    encounteredError = resB.error;
  } else if (resB.status === 'not_found' && primaryArtist && primaryArtist !== artist) {
    // Primary artist fallback for step b: try raw title with primary artist first, then cleaned title if distinct
    let resBFallback = await fetchGet({
      track_name: title,
      artist_name: primaryArtist,
      duration: durationSec.toString(),
    });
    if (resBFallback.status === 'not_found' && cleanedTitle && cleanedTitle !== title) {
      resBFallback = await fetchGet({
        track_name: cleanedTitle,
        artist_name: primaryArtist,
        duration: durationSec.toString(),
      });
    }
    if (resBFallback.status === 'hit' && resBFallback.data) {
      return {
        result: processCandidateLyrics(resBFallback.data, durationSec, isTempoModified),
        matchedStep: 'b',
        hasUpstreamError: false,
        lrclibRecordId: resBFallback.data.id,
      };
    } else if (resBFallback.status === 'error') {
      encounteredError = resBFallback.error;
    }
  }

  // Search steps: track whether at least one search query ran and succeeded cleanly
  let searchCleanHitOrMiss = false;

  // Step c: /api/search with track_name and artist_name
  const resC = await fetchSearch({
    track_name: cleanedTitle,
    artist_name: primaryArtist,
  });
  if (resC.status === 'hit' && resC.data) {
    searchCleanHitOrMiss = true;
    const bestC = pickBestSearchResult(resC.data, {
      title: cleanedTitle,
      artist: primaryArtist,
      durationSec,
    });
    if (bestC) {
      return {
        result: processCandidateLyrics(bestC, durationSec, isTempoModified),
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
    searchCleanHitOrMiss = true;
    const bestD = pickBestSearchResult(resD.data, {
      title: cleanedTitle,
      artist: primaryArtist,
      durationSec,
    });
    if (bestD) {
      return {
        result: processCandidateLyrics(bestD, durationSec, isTempoModified),
        matchedStep: 'd',
        hasUpstreamError: false,
        lrclibRecordId: bestD.id,
      };
    }
  } else if (resD.status === 'error') {
    encounteredError = resD.error;
  }

  // If a search step cleanly succeeded (200 OK array with no matches),
  // then the song is truly not found, regardless of any earlier transient /api/get 5xx.
  if (searchCleanHitOrMiss) {
    return {
      result: null,
      matchedStep: 'none',
      hasUpstreamError: false,
    };
  }

  // If no hit was found and search couldn't cleanly run (all errored or budget ran out), report upstream error
  if (encounteredError || Date.now() >= deadline) {
    return {
      result: null,
      matchedStep: 'none',
      hasUpstreamError: true,
      upstreamError: encounteredError || 'timeout',
    };
  }

  // Clean "no results" response
  return {
    result: null,
    matchedStep: 'none',
    hasUpstreamError: false,
  };
}
