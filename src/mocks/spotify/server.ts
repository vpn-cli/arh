import { setupServer } from 'msw/node';
import { handlers } from './handlers';
import { isSpotifyMockMode, assertMockModeAllowed } from './config';

export const server = setupServer(...handlers);

let isServerRunning = false;

/**
 * Starts the MSW server to intercept requests to api.spotify.com.
 * Hard guard: In production, mock mode is off and returns false (never throws at startup).
 * In dev: Only runs if SPOTIFY_LIVE is not '1'.
 */
export function setupSpotifyMockServer(): boolean {
  if (!assertMockModeAllowed()) {
    return false;
  }

  if (!isSpotifyMockMode()) {
    return false;
  }

  if (!isServerRunning) {
    server.listen({
      // Warn on unhandled requests for non-Spotify URLs (e.g. localhost, lrclib, upstash)
      onUnhandledFrame({ frame, defaults }: { frame: any; defaults: { warn: () => void; error: () => void } }) {
        if ('data' in frame && (frame.data as { request?: Request })?.request) {
          const req = (frame.data as { request: Request }).request;
          const url = new URL(req.url);
          if (url.hostname === 'api.spotify.com' || url.hostname === 'accounts.spotify.com') {
            throw new Error(`[MSW Security Guard] Unhandled request to Spotify passed through: ${req.method} ${req.url}`);
          }
        }
        defaults.warn();
      },
      ...({ onUnhandledRequest: 'warn' } as object),
    });
    isServerRunning = true;
    console.log('[MSW] Spotify mock server started: intercepting api.spotify.com requests.');
  }

  return true;
}

export function teardownSpotifyMockServer(): void {
  if (isServerRunning) {
    server.close();
    isServerRunning = false;
  }
}

export { isSpotifyMockMode, assertMockModeAllowed };
