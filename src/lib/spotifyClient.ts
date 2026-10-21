import PQueue from 'p-queue';
import { recoverPlaybackDevice } from './spotifyRecovery';
import { isSpotifyLocked, setClientSpotifyLock, useSpotifyLockStore, clearClientSpotifyLock } from '@/store/spotifyLockStore';

export { clearClientSpotifyLock };

// Concurrency of 2, interval of 200ms between processing up to 2 items
export const spotifyQueue = new PQueue({ concurrency: 2, interval: 200, intervalCap: 2 });

const loginRequiredSubscribers = new Set<() => void>();
const sessionRecoveredSubscribers = new Set<() => void>();
let customRecoveryHandler: ((reason?: string) => Promise<string>) | null = null;

function notifyLoginRequired() {
  loginRequiredSubscribers.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('[spotifyClient] loginRequired listener error:', err);
    }
  });
}

function notifySessionRecovered() {
  sessionRecoveredSubscribers.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('[spotifyClient] sessionRecovered listener error:', err);
    }
  });
}

export function onLoginRequired(cb: (() => void) | null): () => void {
  if (!cb) {
    loginRequiredSubscribers.clear();
    return () => {};
  }
  loginRequiredSubscribers.add(cb);
  return () => {
    loginRequiredSubscribers.delete(cb);
  };
}

export function onSessionRecovered(cb: (() => void) | null): () => void {
  if (!cb) {
    sessionRecoveredSubscribers.clear();
    return () => {};
  }
  sessionRecoveredSubscribers.add(cb);
  return () => {
    sessionRecoveredSubscribers.delete(cb);
  };
}

export function registerDeviceRecoveryHandler(handler: ((reason?: string) => Promise<string>) | null) {
  customRecoveryHandler = handler;
}

let inFlightTokenPromise: Promise<string | null> | null = null;

async function fetchSessionToken(silent = false): Promise<string | null> {
  const maxAttempts = 2;
  const retryDelayMs = 600;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch('/api/spotify/session', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) {
        if (attempt < maxAttempts - 1) {
          // Wait briefly (~600ms) before retrying to clear transient cold function or upstream blips
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }
        const errBody = await res.json().catch(() => ({}));
        if (!silent) {
          console.error(`[${new Date().toISOString()}] [Spotify Session Token Fetch Failed] Status: ${res.status}`, errBody);
          if (res.status === 401) {
            notifyLoginRequired();
          }
        }
        return null;
      }
      const data = await res.json();
      if (!data.accessToken) {
        if (attempt < maxAttempts - 1) {
          // Wait briefly (~600ms) before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }
        if (!silent) {
          console.error(`[${new Date().toISOString()}] [Spotify Session Token Missing] Response:`, data);
          notifyLoginRequired();
        }
        return null;
      }
      notifySessionRecovered();
      return data.accessToken;
    } catch (err) {
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      if (!silent) {
        console.error(`[${new Date().toISOString()}] [Spotify Session Token Fetch Error]`, err);
      }
      return null;
    }
  }
  return null;
}

export async function getFreshToken(options?: { silent?: boolean }): Promise<string | null> {
  const silent = options?.silent ?? false;
  if (inFlightTokenPromise) {
    return inFlightTokenPromise;
  }

  inFlightTokenPromise = (async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
        return await navigator.locks.request('spotify-token-refresh', async () => {
          return await fetchSessionToken(silent);
        });
      }
      return await fetchSessionToken(silent);
    } finally {
      inFlightTokenPromise = null;
    }
  })();

  return inFlightTokenPromise;
}

export interface RetryAttempts {
  auth: number;
  device: number;
  rateLimit: number;
}

export interface ProxyFetchOptions extends RequestInit {
  isPolling?: boolean;
}

async function doFetch(
  endpoint: string,
  options: ProxyFetchOptions = {},
  retryAttempts: RetryAttempts = { auth: 0, device: 0, rateLimit: 0 }
): Promise<any> {
  if (isSpotifyLocked()) {
    const remaining = useSpotifyLockStore.getState().getRemainingSeconds();
    throw { status: 429, message: 'Spotify is resting', retryAfter: remaining };
  }

  // Strip leading slash if present
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `/api/spotify/proxy/${path}`;
  const method = (options.method || 'GET').toUpperCase();

  const response = await fetch(url, options);

  if (!response.ok) {
    let rawErrorText = '';
    let errorData: any = null;
    try {
      if (typeof response.clone === 'function') {
        rawErrorText = await response.clone().text();
        errorData = JSON.parse(rawErrorText);
      } else if (typeof response.json === 'function') {
        errorData = await response.json();
        rawErrorText = JSON.stringify(errorData);
      } else if (typeof response.text === 'function') {
        rawErrorText = await response.text();
        errorData = JSON.parse(rawErrorText);
      }
    } catch {
      errorData = rawErrorText;
    }

    // Requirement 1: Log status code and response body for every failed Spotify API call
    console.error(
      `[${new Date().toISOString()}] [Spotify API Call Failed] ${method} ${url} - Status: ${response.status}`,
      errorData || rawErrorText
    );

    // Requirement 4: 401 - refresh the token and retry once
    if (response.status === 401) {
      if (retryAttempts.auth < 1) {
        retryAttempts.auth++;
        console.log(`[${new Date().toISOString()}] [Spotify API 401] Refreshing token and retrying once...`);
        const newToken = await getFreshToken();
        if (newToken) {
          return doFetch(endpoint, options, retryAttempts);
        }
      }
      notifyLoginRequired();
      throw { status: 401, message: 'Unauthorized (Session Expired)', details: errorData };
    }

    // Requirement 4: 404 with "Device not found" or no active device - run device recovery for non-GET only, then retry once
    const errorMsg = errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : '');
    const errorReason = errorData?.error?.reason || errorData?.reason || '';
    const isDeviceNotFound =
      response.status === 404 && (
        errorReason === 'NO_ACTIVE_DEVICE' ||
        /device not found/i.test(errorMsg) ||
        /no active device/i.test(errorMsg) ||
        /device not found/i.test(rawErrorText) ||
        /no active device/i.test(rawErrorText)
      );

    if (isDeviceNotFound) {
      if (method !== 'GET' && retryAttempts.device < 1) {
        retryAttempts.device++;
        console.warn(`[${new Date().toISOString()}] [Spotify API 404 Device Not Found] Running recovery for ${method} request, then retrying once...`);
        try {
          const reason = `proxyFetch 404: ${method} ${endpoint}`;
          const recoveryFn = customRecoveryHandler || recoverPlaybackDevice;
          const newDeviceId = await recoveryFn(reason);
          let newEndpoint = endpoint;
          if (newDeviceId) {
            if (newEndpoint.includes('device_id=')) {
              newEndpoint = newEndpoint.replace(/device_id=[^&]+/, `device_id=${encodeURIComponent(newDeviceId)}`);
            } else if (newEndpoint.startsWith('/me/player/play') || newEndpoint.startsWith('me/player/play')) {
              const sep = newEndpoint.includes('?') ? '&' : '?';
              newEndpoint = `${newEndpoint}${sep}device_id=${encodeURIComponent(newDeviceId)}`;
            }
          }
          return doFetch(newEndpoint, options, retryAttempts);
        } catch (recoveryErr: any) {
          console.error(`[${new Date().toISOString()}] [Spotify API Device Recovery Failed]`, recoveryErr);
          throw { status: 404, message: recoveryErr?.message || 'Device not found, recovery failed', details: errorData };
        }
      }
      throw { status: 404, message: 'No active device', reason: 'NO_ACTIVE_DEVICE', isNoActiveDevice: true, details: errorData };
    }

    // Requirement 4: 429 - wait for Retry-After, then retry once
    if (response.status === 429) {
      const retryAfterHeader = response.headers?.get ? response.headers.get('Retry-After') : null;
      let retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : (errorData?.retryAfter || 60);
      if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) retryAfterSeconds = 1;
      const retryAfterMs = retryAfterSeconds * 1000;

      const isLocalLimiter = errorData?.source === 'local-limiter';

      // Notify global lock store to display banner and prevent new requests (upstream Spotify lockout only)
      if (!isLocalLimiter) {
        setClientSpotifyLock(retryAfterSeconds);
      }

      // Pause queue globally
      if (!spotifyQueue.isPaused) {
        spotifyQueue.pause();
        console.warn(`[${new Date().toISOString()}] [Client Throttling] Received 429 (${isLocalLimiter ? 'local-limiter' : 'upstream'}). Pausing queue for ${retryAfterMs}ms`);
        setTimeout(() => {
          if (spotifyQueue.isPaused) spotifyQueue.start();
        }, retryAfterMs);
      }

      // Point 5: Client backoff on local-limiter 429:
      // retry GETs only, max 2 attempts;
      // never retry PUT/POST/DELETE (player commands);
      // drop polling requests instead of retrying them.
      if (isLocalLimiter) {
        const isPolling = options.isPolling === true ||
          (typeof options.headers === 'object' && (options.headers as any)?.['X-Polling'] === 'true');

        if (isPolling) {
          console.warn(`[${new Date().toISOString()}] [Client Rate Limit] Dropping polling request for ${method} ${url}`);
          return null;
        }

        if (method !== 'GET') {
          console.warn(`[${new Date().toISOString()}] [Client Rate Limit] Never retrying mutation ${method} ${url} on local-limiter 429`);
          throw {
            status: 429,
            message: 'Too Many Requests',
            retryAfter: retryAfterSeconds,
            source: 'local-limiter',
            details: errorData,
          };
        }

        // Retry GETs only, max 2 attempts (initial attempt + 1 retry)
        if (retryAttempts.rateLimit < 1) {
          retryAttempts.rateLimit++;
          console.warn(`[${new Date().toISOString()}] [Client Rate Limit] Waiting ${retryAfterSeconds}s for Retry-After, then retrying GET (attempt 2 of 2)...`);
          await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
          return doFetch(endpoint, options, retryAttempts);
        }

        throw {
          status: 429,
          message: 'Too Many Requests',
          retryAfter: retryAfterSeconds,
          source: 'local-limiter',
          details: errorData,
        };
      }

      // Upstream 429 retry logic: retry once
      if (retryAttempts.rateLimit < 1) {
        retryAttempts.rateLimit++;
        console.warn(`[${new Date().toISOString()}] [Spotify API 429 Rate Limit] Waiting ${retryAfterSeconds}s for Retry-After, then retrying once...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
        return doFetch(endpoint, options, retryAttempts);
      }

      throw {
        status: 429,
        message: 'Too Many Requests',
        retryAfter: retryAfterSeconds,
        source: errorData?.source,
        details: errorData,
      };
    }

    // 403 Forbidden
    if (response.status === 403) {
      const isPremiumRequired =
        errorReason === 'PREMIUM_REQUIRED' ||
        /PREMIUM_REQUIRED/i.test(rawErrorText) ||
        /premium required/i.test(errorMsg);

      if (isPremiumRequired) {
        throw {
          status: 403,
          message: 'Spotify Premium required for playback',
          reason: 'PREMIUM_REQUIRED',
          isPremiumRequired: true,
          details: errorData,
        };
      }

      throw { status: 403, message: 'Forbidden', details: errorData };
    }

    // Other non-ok responses
    let finalMsg = response.statusText;
    if (errorData?.error?.message) finalMsg = errorData.error.message;
    else if (errorData?.message) finalMsg = errorData.message;
    throw { status: response.status, message: finalMsg, details: errorData };
  }

  // Some endpoints return empty body on success (e.g. 204 No Content)
  if (response.status === 204) return null;

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function proxyFetch(endpoint: string, options: ProxyFetchOptions = {}): Promise<any> {
  if (isSpotifyLocked()) {
    const remaining = useSpotifyLockStore.getState().getRemainingSeconds();
    throw { status: 429, message: 'Spotify is resting', retryAfter: remaining };
  }
  return spotifyQueue.add(() => doFetch(endpoint, options));
}
