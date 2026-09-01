import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { describeError } from '../_lib/types.js';
import { createOAuthState } from '../_lib/auth.js';
import { buildGoogleAuthUrl } from '../_lib/google.js';

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** GET /api/auth/google/start[?invite=<token>] — redirects to Google's
 *  consent screen. When `invite` is present, it rides along in the signed
 *  `state` param so a brand-new visitor can log in and join a list in one
 *  round trip (see google-callback.ts). */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const invite = firstQueryValue(req.query.invite) ?? null;
    const state = createOAuthState(invite);
    const url = buildGoogleAuthUrl(state);
    res.setHeader('Location', url);
    res.status(302).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Failed to start Google sign-in') });
  }
}
