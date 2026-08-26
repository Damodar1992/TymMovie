import type { ApiRequest, ApiResponse } from '../_lib/types';
import { describeError } from '../_lib/types';
import { requireSession } from '../_lib/auth';
import { searchMulti } from '../_lib/tmdb';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireSession(req, res)) return;

  const q = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const language = (Array.isArray(req.query.language) ? req.query.language[0] : req.query.language) || 'uk-UA';
  if (!q || !q.trim()) {
    res.status(200).json({ results: [] });
    return;
  }

  try {
    const results = await searchMulti(q, language);
    res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: describeError(err, 'TMDb request failed') });
  }
}
