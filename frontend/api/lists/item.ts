import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { readJsonBody, describeError } from '../_lib/types.js';
import { requireUser } from '../_lib/auth.js';
import { listsDb } from '../_lib/db.js';

/** Static file + `?id=` instead of a dynamic `[id].ts` route — see
 *  movies/item.ts (kept from the previous single-list version) for why:
 *  Vercel's SPA catch-all rewrite doesn't reliably mount `[id].ts` files. */
interface UpdateListBody {
  name?: string;
}

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const id = firstQueryValue(req.query.id);
  if (!id) {
    res.status(400).json({ error: 'Missing list id.' });
    return;
  }
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const membership = await listsDb.getMembership(id, user.id);
    if (!membership) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (req.method === 'GET') {
      const list = await listsDb.getListById(id);
      if (!list) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(200).json({ ...list, role: membership.role });
      return;
    }

    if (req.method === 'PATCH') {
      if (membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the list owner can rename this list.' });
        return;
      }
      const body = readJsonBody<UpdateListBody>(req);
      if (body.name !== undefined) {
        if (!body.name.trim()) {
          res.status(400).json({ error: 'name cannot be empty.' });
          return;
        }
        await listsDb.renameList(id, body.name.trim());
      }
      const list = await listsDb.getListById(id);
      res.status(200).json({ ...list, role: membership.role });
      return;
    }

    if (req.method === 'DELETE') {
      if (membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the list owner can delete this list.' });
        return;
      }
      await listsDb.deleteList(id);
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
