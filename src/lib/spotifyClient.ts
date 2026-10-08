import PQueue from 'p-queue';
import { recoverPlaybackDevice } from './spotifyRecovery';

// Concurrency of 2, interval of 200ms between processing up to 2 items
export const spotifyQueue = new PQueue({ concurrency: 2, interval: 200, intervalCap: 2 });

let loginRequiredCallback: (() => void) | null = null;
let customRecoveryHandler: (() => Promise<string>) | null = null;

export function onLoginRequired(cb: (() => void) | null) {
  loginRequiredCallback = cb;
}

export function registerDeviceRecoveryHandler(handler: (() => Promise<string>) | null) {
  customRecoveryHandler = handler;
}

let inFlightTokenPromise: Promise<string | null> | null = null;

async function fetchSessionToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/spotify/session', {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error(`[${new Date().toISOString()}] [Spotify Session Token Fetch Failed] Status: ${res.status}`, errBody);
      if (res.status === 401) {
        loginRequiredCallback?.();
      }
      return null;
    }
    const data = await res.json();
    if (!data.accessToken) {
      console.error(`[${new Date().toISOString()}] [Spotify Session Token Missing] Response:`, data);
      loginRequiredCallback?.();
      return null;
    }
    return data.accessToken;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [Spotify Session Token Fetch Error]`, err);
    return null;
  }
}

export async function getFreshToken(): Promise<string | null> {
  if (inFlightTokenPromise) {
    return inFlightTokenPromise;
  }

  inFlightTokenPromise = (async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
        return await navigator.locks.request('spotify-token-refresh', async () => {
          return await fetchSessionToken();
        });
      }
      return await fetchSessionToken();
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

async function doFetch(
  endpoint: string,
  options: RequestInit = {},
  retryAttempts: RetryAttempts = { auth: 0, device: 0, rateLimit: 0 }
): Promise<any> {
  // Strip leading slash if present
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `/api/spotify/proxy/${path}`;

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
      `[${new Date().toISOString()}] [Spotify API Call Failed] ${options.method || 'GET'} ${url} - Status: ${response.status}`,
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
      loginRequiredCallback?.();
      throw { status: 401, message: 'Unauthorized (Session Expired)', details: errorData };
    }

    // Requirement 4: 404 with "Device not found" or no active device - run device recovery, then retry once
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
      if (retryAttempts.device < 1) {
        retryAttempts.device++;
        console.warn(`[${new Date().toISOString()}] [Spotify API 404 Device Not Found] Running recovery, then retrying once...`);
        try {
          const recoveryFn = customRecoveryHandler || recoverPlaybackDevice;
          const newDeviceId = await recoveryFn();
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
      throw { status: 404, message: 'Device not found', details: errorData };
    }

    // Requirement 4: 429 - wait for Retry-After, then retry once
    if (response.status === 429) {
      const retryAfterHeader = response.headers?.get ? response.headers.get('Retry-After') : null;
      let retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : (errorData?.retryAfter || 60);
      if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) retryAfterSeconds = 1;
      const retryAfterMs = retryAfterSeconds * 1000;

      // Pause queue globally
      if (!spotifyQueue.isPaused) {
        spotifyQueue.pause();
        console.warn(`[${new Date().toISOString()}] [Client Throttling] Received 429. Pausing queue for ${retryAfterMs}ms`);
        setTimeout(() => {
          if (spotifyQueue.isPaused) spotifyQueue.start();
        }, retryAfterMs);
      }

      if (retryAttempts.rateLimit < 1) {
        retryAttempts.rateLimit++;
        console.warn(`[${new Date().toISOString()}] [Spotify API 429 Rate Limit] Waiting ${retryAfterSeconds}s for Retry-After, then retrying once...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
        return doFetch(endpoint, options, retryAttempts);
      }

      throw { status: 429, message: 'Too Many Requests', retryAfter: retryAfterSeconds, details: errorData };
    }

    // 403 Forbidden
    if (response.status === 403) {
      throw { status: 403, message: 'Forbidden (Missing Scopes)', details: errorData };
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

export async function proxyFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  return spotifyQueue.add(() => doFetch(endpoint, options));
}
