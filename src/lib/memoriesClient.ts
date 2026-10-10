import { getFreshToken } from './spotifyClient';

/**
 * Client fetch wrapper for memories API calls.
 * - On 401: uses getFreshToken() (which synchronizes across tabs via navigator.locks.request)
 *   to refresh the session and retries the request once.
 * - On 503: passes upstream error through directly without triggering loginRequiredCallback.
 */
export async function memoriesFetch(
  url: string,
  options: RequestInit = {},
  retryAttempts = 0
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401 && retryAttempts < 1) {
    console.log('[MemoriesClient 401] Session token expired. Refreshing via cross-tab lock and retrying once...');
    const freshToken = await getFreshToken({ silent: true });
    if (freshToken) {
      return memoriesFetch(url, options, retryAttempts + 1);
    }
  }

  return response;
}
