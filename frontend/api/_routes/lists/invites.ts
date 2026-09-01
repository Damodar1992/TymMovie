import { randomBytes } from 'node:crypto';
import type { ApiRequest, ApiResponse } from '../../_lib/types.js';
import { readJsonBody, describeError } from '../../_lib/types.js';
import { requireUser } from '../../_lib/auth.js';
import { listsDb, invitesDb, type ListRole } from '../../_lib/db.js';

/** Owner-only management of a list's invite links. GET/POST take
 *  `?listId=`, DELETE (revoke) takes `?id=&listId=`. */
interface CreateInviteBody {
  listId: string;
  role?: ListRole;
}

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const listId = firstQueryValue(req.query.listId);
      if (!listId) {
        res.status(400).json({ error: 'Missing listId.' });
        return;
      }
      const membership = await listsDb.getMembership(listId, user.id);
      if (!membership) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the list owner can view invite links.' });
        return;
      }
      const items = await invitesDb.listInvites(listId);
      res.status(200).json({ items });
      return;
    }

    if (req.method === 'POST') {
      const body = readJsonBody<CreateInviteBody>(req);
      if (!body.listId) {
        res.status(400).json({ error: 'Missing listId.' });
        return;
      }
      const membership = await listsDb.getMembership(body.listId, user.id);
      if (!membership) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the list owner can create invite links.' });
        return;
      }
      const token = randomBytes(24).toString('base64url');
      const invite = await invitesDb.createInvite({
        listId: body.listId,
        token,
        role: body.role ?? 'member',
        createdBy: user.id,
      });
      res.status(201).json(invite);
      return;
    }

    if (req.method === 'DELETE') {
      const id = firstQueryValue(req.query.id);
      const listId = firstQueryValue(req.query.listId);
      if (!id || !listId) {
        res.status(400).json({ error: 'Missing id or listId.' });
        return;
      }
      const membership = await listsDb.getMembership(listId, user.id);
      if (!membership || membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the list owner can revoke invite links.' });
        return;
      }
      await invitesDb.revokeInvite(id, listId);
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
