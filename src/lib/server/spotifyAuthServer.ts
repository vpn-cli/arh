export interface TokenRefreshSuccess {
  success: true;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface TokenRefreshFailure {
  success: false;
  status: number;
  isInvalidGrant: boolean;
  errorText: string;
  retryable: boolean;
}

export type TokenRefreshResult = TokenRefreshSuccess | TokenRefreshFailure;

/**
 * Server-side helper to refresh a Spotify access token via the Authorization Code with PKCE flow.
 * Stateless and serverless-safe: does not rely on in-memory maps or shared server state.
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<TokenRefreshResult> {
  if (!refreshToken) {
    return {
      success: false,
      status: 400,
      isInvalidGrant: true,
      errorText: 'No refresh token provided',
      retryable: false,
    };
  }

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
    const responseText = await response.text();

    if (response.ok) {
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { access_token: responseText };
      }

      const expiresIn = data.expires_in || 3600;
      const newRefreshToken = data.refresh_token || refreshToken;
      const expiresAt = Date.now() + (expiresIn * 1000);

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: newRefreshToken,
        expiresIn,
        expiresAt,
      };
    } else {
      let isInvalidGrant = false;
      try {
        const errorData = JSON.parse(responseText);
        if (
          errorData?.error === 'invalid_grant' ||
          (typeof errorData?.error_description === 'string' && /invalid_grant|revoked/i.test(errorData.error_description))
        ) {
          isInvalidGrant = true;
        }
      } catch {
        if (/invalid_grant/i.test(responseText)) {
          isInvalidGrant = true;
        }
      }

      console.error(
        `[${new Date().toISOString()}] [Spotify Token Refresh Failed] Status: ${response.status}, isInvalidGrant: ${isInvalidGrant}, Body:`,
        responseText
      );

      return {
        success: false,
        status: response.status,
        isInvalidGrant,
        errorText: responseText,
        retryable: !isInvalidGrant, // Only invalid_grant is non-retryable; 5xx/429 are retryable
      };
    }
  } catch (networkError: any) {
    console.error(`[${new Date().toISOString()}] [Spotify Token Refresh Network Exception]`, networkError);
    return {
      success: false,
      status: 503,
      isInvalidGrant: false,
      errorText: networkError?.message || 'Network error refreshing token',
      retryable: true,
    };
  }
}
