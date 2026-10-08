export const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/spotify/callback`;
  }
  return "http://127.0.0.1:3000/api/spotify/callback";
};

export function redirectToSpotifyAuth() {
  window.localStorage.setItem('spotify_auth_return', 'true');
  window.location.href = '/api/spotify/login';
}

export async function logoutSpotify() {
  await fetch('/api/spotify/logout', { method: 'POST' });
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
