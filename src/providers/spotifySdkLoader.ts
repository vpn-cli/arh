import { isSpotifyMockMode } from '@/mocks/spotify/config';

/**
 * Loads the Spotify Web Playback SDK.
 * In mock mode: do NOT load the SDK script from sdk.scdn.co.
 * Instead, injects the stub player that simulates playback.
 */
export function loadSpotifySDK(onReady: () => void): void {
  if (typeof window === 'undefined') return;

  if (window.Spotify) {
    onReady();
    return;
  }

  if (isSpotifyMockMode()) {
    import('@/mocks/spotify/stubPlayer').then(({ MockSpotifyPlayer }) => {
      window.Spotify = { Player: MockSpotifyPlayer };
      onReady();
    });
    return;
  }

  window.onSpotifyWebPlaybackSDKReady = onReady;
  if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
  }
}
