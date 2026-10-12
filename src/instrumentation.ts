export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { isSpotifyMockMode, setupSpotifyMockServer } = await import('@/mocks/spotify/server');
    if (isSpotifyMockMode()) {
      setupSpotifyMockServer();
    }
  }
}
