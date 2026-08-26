import type { ApiRequest, ApiResponse } from '../_lib/types';
import { describeError } from '../_lib/types';
import { requireSession } from '../_lib/auth';
import { db } from '../_lib/db';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireSession(req, res)) return;
  try {
    const stats = await db.libraryStats();
    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
