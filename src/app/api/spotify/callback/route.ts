import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const codeVerifier = request.cookies.get('spotify_code_verifier')?.value;

  if (!codeVerifier) {
    return NextResponse.json({ error: 'Missing code_verifier cookie' }, { status: 400 });
  }

  const host = request.headers.get('host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto')
    ? `${request.headers.get('x-forwarded-proto')}:`
    : url.protocol;
  const redirectUri = `${protocol}//${host}/api/spotify/callback`;

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  };

  try {
    const body = await fetch("https://accounts.spotify.com/api/token", payload);
    const response = await body.json();

    if (response.access_token) {
      // Create a response that redirects back to the main app
      const res = NextResponse.redirect(`${protocol}//${host}/?spotify_auth=success`);
      
      // Set secure HttpOnly host-only cookies
      res.cookies.set('spotify_access_token', response.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: response.expires_in,
      });

      const expiresAt = Date.now() + (response.expires_in * 1000);
      res.cookies.set('spotify_token_expires_at', String(expiresAt), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      if (response.refresh_token) {
        res.cookies.set('spotify_refresh_token', response.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
      
      res.cookies.delete('spotify_code_verifier');

      // Cleanup legacy domain-scoped cookies for existing visitors
      const legacyDomain = (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
        ? undefined
        : url.hostname;
      if (legacyDomain) {
        const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        const cookieNames = [
          'spotify_access_token',
          'spotify_token_expires_at',
          'spotify_refresh_token',
          'spotify_code_verifier',
        ];
        for (const name of cookieNames) {
          res.headers.append(
            'Set-Cookie',
            `${name}=; Path=/; Domain=${legacyDomain}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly${secureFlag}`
          );
        }
      }

      return res;
    } else {
      console.error("Spotify token exchange error:", response);
      return NextResponse.redirect(`${protocol}//${host}/?spotify_auth=error`);
    }
  } catch (error) {
    console.error("Token exchange failed:", error);
    // TODO: Sentry.captureException(error)
    return NextResponse.redirect(`${protocol}//${host}/?spotify_auth=error`);
  }
}
