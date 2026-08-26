import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { describeError } from '../_lib/types.js';
import { requireSession } from '../_lib/auth.js';
import { getMovieDetails, getTvDetails } from '../_lib/tmdb.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireSession(req, res)) return;

  const type = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  const idRaw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = idRaw ? Number.parseInt(idRaw, 10) : NaN;

  if ((type !== 'MOVIE' && type !== 'TV') || !Number.isFinite(id)) {
    res.status(400).json({ error: 'type must be MOVIE or TV, and id must be numeric.' });
    return;
  }

  try {
    const details = type === 'MOVIE' ? await getMovieDetails(id) : await getTvDetails(id);
    res.status(200).json(details);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: describeError(err, 'TMDb request failed') });
  }
}
