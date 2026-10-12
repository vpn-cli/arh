let requestTimestamps: number[] = [];

/**
 * Dev-only request counter: logs one line per upstream Spotify request
 * (endpoint + running count per minute) when SPOTIFY_LIVE=1.
 */
export function recordUpstreamSpotifyRequest(urlOrEndpoint: string): void {
  if (process.env.NODE_ENV === 'production' || process.env.SPOTIFY_LIVE !== '1') {
    return;
  }

  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((t) => now - t < 60_000);
  requestTimestamps.push(now);

  const countPerMinute = requestTimestamps.length;
  console.log(`[SPOTIFY LIVE] ${urlOrEndpoint} | ${countPerMinute} req/min`);
}

export function resetRequestTimestampsForTesting(): void {
  requestTimestamps = [];
}
