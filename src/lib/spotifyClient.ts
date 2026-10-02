import PQueue from 'p-queue';

// Concurrency of 2, interval of 200ms between processing up to 2 items
export const spotifyQueue = new PQueue({ concurrency: 2, interval: 200, intervalCap: 2 });

export async function proxyFetch(endpoint: string, options: RequestInit = {}) {
  return spotifyQueue.add(async () => {
    // Strip leading slash if present
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `/api/spotify/proxy/${path}`;
    
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      const retryAfterSeconds = data.retryAfter || 60;
      // Pause queue globally
      if (!spotifyQueue.isPaused) {
        spotifyQueue.pause();
        const retryAfterMs = retryAfterSeconds * 1000;
        console.warn(`[Client Throttling] Received 429. Pausing queue for ${retryAfterMs}ms`);
        setTimeout(() => spotifyQueue.start(), retryAfterMs);
      }
      throw { status: 429, message: 'Too Many Requests', retryAfter: retryAfterSeconds };
    }
    
    if (response.status === 401) {
      throw { status: 401, message: 'Unauthorized (Session Expired)' };
    }
    
    if (response.status === 403) {
      throw { status: 403, message: 'Forbidden (Missing Scopes)' };
    }
    
    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.clone().json();
        if (errorData?.error?.message) errorMsg = errorData.error.message;
        if (errorData?.error?.reason === 'NO_ACTIVE_DEVICE') errorMsg = 'No active device found! Please select a device from the Cast menu or open Spotify.';
      } catch {}
      throw { status: response.status, message: errorMsg };
    }
    
    // Some endpoints return empty body on success (e.g. 204 No Content)
    if (response.status === 204) return null;
    
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  });
}
