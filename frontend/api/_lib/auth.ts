import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './types';
import { getCookies } from './types';

export type SessionRole = 'admin' | 'guest';

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

/** Builds a signed, tamper-proof session token: `<role>.<expiry>.<hmac>`. */
export function createSessionToken(role: SessionRole, ttlSeconds = SESSION_TTL_SECONDS): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${role}.${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): { role: SessionRole } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [role, expiresAtRaw, signature] = parts;
  if (role !== 'admin' && role !== 'guest') return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
  const expected = sign(`${role}.${expiresAtRaw}`);
  if (!safeEqual(expected, signature)) return null;
  return { role };
}

export function getSession(req: ApiRequest): { role: SessionRole } | null {
  const cookies = getCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

export function setSessionCookie(res: ApiResponse, role: SessionRole): void {
  const token = createSessionToken(role);
  const maxAge = SESSION_TTL_SECONDS;
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
  );
}

export function clearSessionCookie(res: ApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}

/** Verifies the admin login/password using a constant-time comparison. */
export function checkAdminCredentials(login: string, password: string): boolean {
  const expectedLogin = process.env.ADMIN_LOGIN;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedLogin || !expectedPassword) {
    throw new Error('ADMIN_LOGIN / ADMIN_PASSWORD are not set on the server.');
  }
  return safeEqual(login, expectedLogin) && safeEqual(password, expectedPassword);
}

/** Requires any valid session (admin or guest). Sends 401 and returns null if absent. */
export function requireSession(req: ApiRequest, res: ApiResponse): { role: SessionRole } | null {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }
  return session;
}

/** Requires an admin session. Sends 401/403 and returns false if not satisfied. */
export function requireAdmin(req: ApiRequest, res: ApiResponse): boolean {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Not authenticated.' });
    return false;
  }
  if (session.role !== 'admin') {
    res.status(403).json({ error: 'Read-only mode: this action requires an admin session.' });
    return false;
  }
  return true;
}
