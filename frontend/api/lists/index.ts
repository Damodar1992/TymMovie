import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { readJsonBody, describeError } from '../_lib/types.js';
import { requireUser } from '../_lib/auth.js';
import { listsDb } from '../_lib/db.js';

interface CreateListBody {
  name: string;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const items = await listsDb.listsForUser(user.id);
      res.status(200).json({ items });
      return;
    }

    if (req.method === 'POST') {
      const body = readJsonBody<CreateListBody>(req);
      if (!body.name || !body.name.trim()) {
        res.status(400).json({ error: 'name is required.' });
        return;
      }
      const list = await listsDb.createList({ ownerId: user.id, name: body.name.trim() });
      res.status(201).json(list);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
