export const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/spotify/callback`;
  }
  return "http://127.0.0.1:3000/api/spotify/callback";
};

export function redirectToSpotifyAuth() {
  window.location.href = '/api/spotify/login';
}

export function logoutSpotify() {
  window.location.href = '/'; // In a real app we'd have an /api/spotify/logout route
}
