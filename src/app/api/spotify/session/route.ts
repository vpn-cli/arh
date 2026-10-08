import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshSpotifyToken } from '@/lib/server/spotifyAuthServer';

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;
  const expiresAtStr = cookieStore.get('spotify_token_expires_at')?.value;
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

  // Refresh if token is missing or expires within 60 seconds
  const isExpiringSoon = !expiresAt || (expiresAt - Date.now() <= 60_000);

  if ((!accessToken || isExpiringSoon) && refreshToken) {
    const refreshResult = await refreshSpotifyToken(refreshToken);

    if (refreshResult.success) {
      accessToken = refreshResult.accessToken;
      const newExpiresAt = refreshResult.expiresAt;
      const res = NextResponse.json({ accessToken, expiresAt: newExpiresAt });
      
      res.cookies.set('spotify_access_token', refreshResult.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: refreshResult.expiresIn,
      });
      res.cookies.set('spotify_token_expires_at', String(newExpiresAt), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      if (refreshResult.refreshToken) {
        res.cookies.set('spotify_refresh_token', refreshResult.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
      return res;
    } else {
      // Differentiate between revoked token (invalid_grant) and transient blip / Spotify 5xx
      if (refreshResult.isInvalidGrant) {
        console.warn(`[${new Date().toISOString()}] [Spotify Session] Refresh token rejected with invalid_grant. Clearing session cookies.`);
        const res = NextResponse.json(
          { error: 'Session expired', details: refreshResult.errorText },
          { status: 401 }
        );
        res.cookies.delete('spotify_access_token');
        res.cookies.delete('spotify_token_expires_at');
        res.cookies.delete('spotify_refresh_token');
        return res;
      } else {
        // Transient network or Spotify 5xx error: DO NOT delete cookies.
        console.warn(`[${new Date().toISOString()}] [Spotify Session] Transient refresh error (${refreshResult.status}). Retaining cookies.`);
        if (accessToken && expiresAt > Date.now()) {
          // Current access token hasn't strictly expired yet; return it with warning
          return NextResponse.json({
            accessToken,
            expiresAt,
            warning: 'Upstream refresh failed; retained existing access token',
          });
        }

        return NextResponse.json(
          {
            error: 'Spotify auth service temporarily unavailable',
            retryable: true,
            details: refreshResult.errorText,
          },
          { status: 503 }
        );
      }
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  return NextResponse.json({ accessToken, expiresAt });
}
