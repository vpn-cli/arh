import { NextRequest, NextResponse } from 'next/server';

export async function POST(request?: Request | NextRequest) {
  const response = NextResponse.json({ success: true });
  const cookieNames = [
    'spotify_access_token',
    'spotify_token_expires_at',
    'spotify_refresh_token',
    'spotify_code_verifier',
  ];

  // 1. Delete host-only cookies
  for (const name of cookieNames) {
    response.cookies.delete(name);
  }

  // 2. Delete legacy domain-scoped cookies for existing visitors
  if (request?.url) {
    try {
      const url = new URL(request.url);
      const hostname = url.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        for (const name of cookieNames) {
          response.headers.append(
            'Set-Cookie',
            `${name}=; Path=/; Domain=${hostname}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly${secureFlag}`
          );
        }
      }
    } catch {}
  }

  return response;
}
