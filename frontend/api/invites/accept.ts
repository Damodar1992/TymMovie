import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { readJsonBody, describeError } from '../_lib/types.js';
import { requireUser } from '../_lib/auth.js';
import { invitesDb } from '../_lib/db.js';

interface AcceptInviteBody {
  token: string;
}

/** POST /api/invites/accept — requires a session. Used both for the
 *  "already logged in, click accept" path and as the last step of the
 *  Google OAuth callback for a brand-new visitor (see auth/google-callback.ts). */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const user = requireUser(req, res);
  if (!user) return;

  const body = readJsonBody<AcceptInviteBody>(req);
  if (!body.token) {
    res.status(400).json({ error: 'Missing token.' });
    return;
  }

  try {
    const result = await invitesDb.acceptInvite(body.token, user.id);
    if ('error' in result) {
      const status = result.error === 'exhausted' ? 410 : 404;
      res.status(status).json({ error: result.error });
      return;
    }
    res.status(200).json({ listId: result.listId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
