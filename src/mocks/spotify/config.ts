/**
 * Spotify Mock Mode Configuration & Hard Production Guard.
 * 
 * Rules:
 * - In development (NODE_ENV !== 'production'), mock mode is ON by default unless SPOTIFY_LIVE=1.
 * - In production (NODE_ENV === 'production'), mock mode is simply off.
 * - If SPOTIFY_LIVE or mock settings look wrong in production, log one warning instead of throwing.
 * - Never throw at startup.
 */

let hasWarnedProduction = false;

export function isSpotifyMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') {
    if (!hasWarnedProduction && process.env.SPOTIFY_LIVE !== '1') {
      hasWarnedProduction = true;
      console.warn(
        '[Spotify Mock] Production mode active: mock mode is strictly off. SPOTIFY_LIVE or mock configuration ignored.'
      );
    }
    return false;
  }
  return process.env.SPOTIFY_LIVE !== '1';
}

export function resetProductionGuardWarningForTesting(): void {
  hasWarnedProduction = false;
}

export function assertMockModeAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    if (!hasWarnedProduction) {
      hasWarnedProduction = true;
      console.warn(
        '[Spotify Mock] Production mode active: mock mode is strictly off.'
      );
    }
    return false;
  }
  return true;
}

export function getMockSpotifyProduct(): 'premium' | 'free' {
  if (process.env.NODE_ENV === 'production') {
    return 'premium';
  }
  const isFree =
    process.env.NEXT_PUBLIC_MOCK_SPOTIFY_PRODUCT === 'free' ||
    process.env.MOCK_SPOTIFY_PRODUCT === 'free';
  return isFree ? 'free' : 'premium';
}

export const MOCK_ACCESS_TOKEN = 'mock_spotify_access_token';
export const MOCK_REFRESH_TOKEN = 'mock_spotify_refresh_token';
export const MOCK_USER_ID = 'mock-user';
