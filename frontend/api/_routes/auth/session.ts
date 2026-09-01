import type { ApiRequest, ApiResponse } from '../../_lib/types.js';
import { describeError } from '../../_lib/types.js';
import { getSession, clearSessionCookie } from '../../_lib/auth.js';
import { usersDb } from '../../_lib/db.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const session = getSession(req);
  if (!session) {
    res.status(200).json(null);
    return;
  }
  try {
    const user = await usersDb.getById(session.userId);
    if (!user) {
      clearSessionCookie(res);
      res.status(200).json(null);
      return;
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
