import type { ApiRequest, ApiResponse } from '../../../_lib/types.js';
import { describeError } from '../../../_lib/types.js';
import { requireUser } from '../../../_lib/auth.js';
import { listsDb, listMoviesDb } from '../../../_lib/db.js';

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
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
    const stats = await listMoviesDb.stats(listId);
    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
