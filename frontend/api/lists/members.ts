import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { describeError } from '../_lib/types.js';
import { requireUser } from '../_lib/auth.js';
import { listsDb } from '../_lib/db.js';

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const listId = firstQueryValue(req.query.listId);
  if (!listId) {
    res.status(400).json({ error: 'Missing listId.' });
    return;
  }
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const membership = await listsDb.getMembership(listId, user.id);
    if (!membership) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (req.method === 'GET') {
      const items = await listsDb.listMembers(listId);
      res.status(200).json({ items });
      return;
    }

    if (req.method === 'DELETE') {
      const targetUserId = firstQueryValue(req.query.userId);
      if (!targetUserId) {
        res.status(400).json({ error: 'Missing userId.' });
        return;
      }
      const list = await listsDb.getListById(listId);
      if (!list) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const isSelf = targetUserId === user.id;
      const isOwner = membership.role === 'owner';
      if (!isSelf && !isOwner) {
        res.status(403).json({ error: 'Only the list owner can remove other members.' });
        return;
      }
      if (targetUserId === list.ownerId) {
        res.status(400).json({ error: "The owner can't be removed — delete the list instead." });
        return;
      }
      await listsDb.removeMember(listId, targetUserId);
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
