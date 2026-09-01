import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { setSessionCookie, verifyOAuthState } from '../_lib/auth.js';
import { exchangeCodeForProfile } from '../_lib/google.js';
import { usersDb, listsDb, invitesDb } from '../_lib/db.js';

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** GET /api/auth/google/callback?code=...&state=... — completes the OAuth
 *  round trip: verifies `state`, exchanges `code` for a verified Google
 *  profile, upserts the `users` row, auto-creates a personal list for a
 *  genuinely first-time user, sets the session cookie, and — if `state`
 *  was carrying an invite token — joins that list too, all before a
 *  single redirect back into the app. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const redirectWithError = (code: string) => {
    res.setHeader('Location', `/?authError=${encodeURIComponent(code)}`);
    res.status(302).end();
  };

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const oauthError = firstQueryValue(req.query.error);
  if (oauthError) {
    redirectWithError(oauthError);
    return;
  }

  const code = firstQueryValue(req.query.code);
  const stateRaw = firstQueryValue(req.query.state);
  if (!code) {
    redirectWithError('missing_code');
    return;
  }

  const state = verifyOAuthState(stateRaw);
  if (!state) {
    redirectWithError('invalid_state');
    return;
  }

  try {
    const profile = await exchangeCodeForProfile(code);
    const { user, isNewUser } = await usersDb.upsertFromGoogle({
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });

    if (isNewUser) {
      await listsDb.createList({ ownerId: user.id, name: 'My list' });
    }

    setSessionCookie(res, user.id);

    if (state.inviteToken) {
      // Best-effort: an invalid/exhausted/revoked link doesn't block the
      // login that just happened, it just doesn't also join a list.
      await invitesDb.acceptInvite(state.inviteToken, user.id).catch(() => null);
    }

    res.setHeader('Location', '/');
    res.status(302).end();
  } catch (err) {
    console.error(err);
    redirectWithError('google_failed');
  }
}
