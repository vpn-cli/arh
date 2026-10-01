const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";

export const getRedirectUri = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/`;
  }
  return "http://127.0.0.1:3000/";
};

function generateRandomString(length: number) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function redirectToSpotifyAuth() {
  try {
    if (!SPOTIFY_CLIENT_ID) {
      alert("ERROR: NEXT_PUBLIC_SPOTIFY_CLIENT_ID is missing from your .env file! Please restart your terminal.");
      return;
    }

    const codeVerifier = generateRandomString(64);
    window.localStorage.setItem('spotify_code_verifier', codeVerifier);

    if (!window.crypto || !window.crypto.subtle) {
      alert("ERROR: Your browser does not support the required cryptography features (window.crypto.subtle is undefined). Please ensure you are accessing this via a secure context (localhost or 127.0.0.1).");
      return;
    }

    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const scope = 'streaming user-read-email user-read-private user-library-read playlist-read-private playlist-read-collaborative';
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    // Save intent so we know to load music world on return
    window.localStorage.setItem('spotify_auth_return', "true");

    const params = {
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: getRedirectUri(),
      show_dialog: 'true', // Forces the permissions screen to appear so new scopes are granted
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  } catch (error: any) {
    alert("Authentication Error: " + error.message);
    console.error(error);
  }
}

export async function exchangeToken(code: string) {
  const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
  
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier || "",
    }),
  }

  const body = await fetch("https://accounts.spotify.com/api/token", payload);
  const response = await body.json();
  
  if (response.access_token) {
    window.localStorage.setItem('spotify_access_token', response.access_token);
    if (response.refresh_token) {
      window.localStorage.setItem('spotify_refresh_token', response.refresh_token);
    }
    return response.access_token;
  }
  
  return null;
}

export function getAccessToken() {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('spotify_access_token');
  }
  return null;
}

export function logoutSpotify() {
  window.localStorage.removeItem('spotify_access_token');
  window.localStorage.removeItem('spotify_refresh_token');
  window.localStorage.removeItem('spotify_code_verifier');
  // Set auth return so we spawn directly into music world upon reload
  window.localStorage.setItem('spotify_auth_return', 'true');
  window.location.reload();
}
