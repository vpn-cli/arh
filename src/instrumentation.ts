export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'production') {
    const { isSpotifyMockMode, setupSpotifyMockServer } = await import('@/mocks/spotify/server');
    if (isSpotifyMockMode()) {
      setupSpotifyMockServer();
    }
  }
}
