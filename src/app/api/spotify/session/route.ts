import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

  if (!accessToken && refreshToken) {
    // Attempt refresh
    const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
    const payload = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    };
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", payload);
      if (response.ok) {
        const data = await response.json();
        accessToken = data.access_token;
        const res = NextResponse.json({ accessToken });
        res.cookies.set('spotify_access_token', data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: data.expires_in,
        });
        if (data.refresh_token) {
          res.cookies.set('spotify_refresh_token', data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        }
        return res;
      } else {
        // Refresh failed, clear cookies
        const res = NextResponse.json({ error: 'Session expired' }, { status: 401 });
        res.cookies.delete('spotify_access_token');
        res.cookies.delete('spotify_refresh_token');
        return res;
      }
    } catch (e) {
      console.error("Session route token refresh failed:", e);
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  return NextResponse.json({ accessToken });
}
