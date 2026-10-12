import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { isSpotifyMockMode, MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN } from '@/mocks/spotify/config';

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";

function base64URLEncode(str: Buffer) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer: string) {
  return crypto.createHash('sha256').update(buffer).digest();
}

export async function GET(request: Request) {
  // In mock mode: yield fake session/token without Spotify OAuth
  if (isSpotifyMockMode()) {
    const returnUrl = new URL('/', request.url);
    const response = NextResponse.redirect(returnUrl);
    const expiresAt = Date.now() + 3600 * 1000;
    response.cookies.set('spotify_access_token', MOCK_ACCESS_TOKEN, {
      httpOnly: true,
      secure: false,
      path: '/',
      maxAge: 3600,
    });
    response.cookies.set('spotify_token_expires_at', String(expiresAt), {
      httpOnly: true,
      secure: false,
      path: '/',
      maxAge: 3600,
    });
    response.cookies.set('spotify_refresh_token', MOCK_REFRESH_TOKEN, {
      httpOnly: true,
      secure: false,
      path: '/',
      maxAge: 3600 * 24 * 30,
    });
    return response;
  }

  if (!SPOTIFY_CLIENT_ID) {
    return NextResponse.json({ error: 'Missing SPOTIFY_CLIENT_ID' }, { status: 500 });
  }

  const url = new URL(request.url);
  let host = url.host;
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    host = '127.0.0.1:3000'; // Force exactly this for dev
  }
  const protocol = url.protocol;
  const redirectUri = `${protocol}//${host}/api/spotify/callback`;

  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  const scope = 'streaming user-read-email user-read-private user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-top-read user-read-playback-state user-modify-playback-state user-read-recently-played';
  const authUrl = new URL("https://accounts.spotify.com/authorize");

  const params = {
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
    show_dialog: 'true',
  };

  authUrl.search = new URLSearchParams(params).toString();

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('spotify_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });

  return response;
}
