import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './types.js';
import { getCookies } from './types.js';

const COOKIE_NAME = 'tm_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not set. Add a long random string to the server environment.',
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// --- session cookie: signed `<userId>.<expiry>.<hmac>`, no server-side ----
// session store, same approach as before — just carries a userId instead
// of a role now that admin/guest are gone.

export function createSessionToken(userId: string, ttlSeconds = SESSION_TTL_SECONDS): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function verifySessionToken(token: string | undefined): { userId: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;
  // Rejects leftover cookies from before this app had a `users` table
  // (the old cookie shape was `<role>.<expiry>.<hmac>`, e.g. "admin...") —
  // without this, such a cookie passes the HMAC check below but carries a
  // non-UUID "userId" that crashes the `WHERE id = $1` query downstream
  // instead of just being treated as an invalid/expired session.
  if (!userId || !UUID_RE.test(userId)) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
  let expected: string;
  try {
    expected = sign(`${userId}.${expiresAtRaw}`);
  } catch {
    return null;
  }
  if (!safeEqual(expected, signature)) return null;
  return { userId };
}

export function getSession(req: ApiRequest): { userId: string } | null {
  const cookies = getCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

// Browsers refuse to store a `Secure` cookie on a plain http:// origin,
// which is exactly what local dev serves. Vercel sets VERCEL=1 on every
// real deployment (dev/preview/production), all of which are HTTPS.
const IS_HTTPS_DEPLOYMENT = process.env.VERCEL === '1';

export function setSessionCookie(res: ApiResponse, userId: string): void {
  const token = createSessionToken(userId);
  const maxAge = SESSION_TTL_SECONDS;
  const secure = IS_HTTPS_DEPLOYMENT ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAge}`,
  );
}

export function clearSessionCookie(res: ApiResponse): void {
  const secure = IS_HTTPS_DEPLOYMENT ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`,
  );
}

/** Requires a valid session. Sends 401 and returns null if absent. */
export function requireUser(req: ApiRequest, res: ApiResponse): { id: string } | null {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }
  return { id: session.userId };
}

// --- OAuth `state` param: signed, stateless CSRF token that can also -----
// carry an invite token through the Google redirect round-trip, so a
// brand-new visitor can log in and accept an invite in one step (see
// api/auth/google-callback.ts). No server-side storage needed — the HMAC
// signature is what proves it round-tripped through us.

export function createOAuthState(inviteToken?: string | null): string {
  const nonce = randomBytes(16).toString('base64url');
  const payload = `${nonce}.${inviteToken ?? ''}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string | undefined): { inviteToken: string | null } | null {
  if (!state) return null;
  const parts = state.split('.');
  if (parts.length !== 3) return null;
  const [nonce, inviteToken, signature] = parts;
  let expected: string;
  try {
    expected = sign(`${nonce}.${inviteToken}`);
  } catch {
    return null;
  }
  if (!safeEqual(expected, signature)) return null;
  return { inviteToken: inviteToken || null };
}
