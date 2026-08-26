import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { describeError } from '../_lib/types.js';
import { requireSession } from '../_lib/auth.js';
import { db } from '../_lib/db.js';

/** Distinct genres across the whole catalog — fixes the filter only ever
 *  reflecting whatever page of movies happened to be loaded client-side. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireSession(req, res)) return;
  try {
    const genres = await db.listGenres();
    res.status(200).json({ genres });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
