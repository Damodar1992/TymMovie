import type { ApiRequest, ApiResponse } from '../../_lib/types.js';
import { describeError } from '../../_lib/types.js';
import { invitesDb, listsDb, usersDb } from '../../_lib/db.js';

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Public, unauthenticated: GET /api/invites/preview?token=... — only
 *  ever returns the list's display name and the owner's display name, on
 *  purpose. No email, no member list, nothing else — see the project's
 *  db-multi-user-architecture doc, §4.2/§11. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const token = firstQueryValue(req.query.token);
  if (!token) {
    res.status(400).json({ error: 'Missing token.' });
    return;
  }
  try {
    const invite = await invitesDb.getInviteByToken(token);
    if (!invite || invite.revokedAt || (invite.maxUses != null && invite.useCount >= invite.maxUses)) {
      res.status(200).json({ valid: false });
      return;
    }
    const list = await listsDb.getListById(invite.listId);
    if (!list) {
      res.status(200).json({ valid: false });
      return;
    }
    const owner = await usersDb.getById(list.ownerId);
    res.status(200).json({
      valid: true,
      listName: list.name,
      ownerName: owner?.name ?? 'someone',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
