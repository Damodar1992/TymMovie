/**
 * Minimal Google OAuth (Authorization Code) helper — no SDK, just fetch,
 * consistent with the rest of this project's server-side code. Verifies
 * the id_token via Google's tokeninfo endpoint (see README/db-multi-user
 * architecture notes for the tradeoffs vs. local JWKS verification).
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

function getClientId(): string {
  const v = process.env.GOOGLE_CLIENT_ID;
  if (!v) throw new Error('GOOGLE_CLIENT_ID is not set on the server.');
  return v;
}

function getClientSecret(): string {
  const v = process.env.GOOGLE_CLIENT_SECRET;
  if (!v) throw new Error('GOOGLE_CLIENT_SECRET is not set on the server.');
  return v;
}

function getRedirectUri(): string {
  const v = process.env.GOOGLE_REDIRECT_URI;
  if (!v) throw new Error('GOOGLE_REDIRECT_URI is not set on the server.');
  return v;
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

/** Exchanges an authorization `code` for a verified Google profile. Throws
 *  on any failure — callers should catch and redirect back to the login
 *  screen with an error rather than surfacing raw errors to the user. */
export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }).toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Failed to exchange Google authorization code (${tokenRes.status})`);
  }
  const tokenData = (await tokenRes.json()) as { id_token?: string };
  if (!tokenData.id_token) {
    throw new Error('Google token response is missing id_token.');
  }

  const infoRes = await fetch(
    `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(tokenData.id_token)}`,
  );
  if (!infoRes.ok) {
    throw new Error(`Failed to verify Google id_token (${infoRes.status})`);
  }
  const info = (await infoRes.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
  };

  if (info.aud !== getClientId()) {
    throw new Error('Google id_token audience mismatch.');
  }
  if (!info.sub || !info.email) {
    throw new Error('Google id_token is missing sub/email.');
  }
  const emailVerified = info.email_verified === true || info.email_verified === 'true';
  if (!emailVerified) {
    throw new Error('Google account email is not verified.');
  }

  return {
    sub: info.sub,
    email: info.email,
    name: info.name ?? null,
    picture: info.picture ?? null,
  };
}
