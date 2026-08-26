import type { ApiRequest, ApiResponse } from '../_lib/types';
import { readJsonBody, describeError } from '../_lib/types';
import { requireAdmin, requireSession } from '../_lib/auth';
import { db, computeUserAvgRating } from '../_lib/db';

interface UpdateMovieBody {
  status?: string;
  watchDate?: string | null;
  innaRating?: number | null;
  bogdanRating?: number | null;
  comment?: string | null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    res.status(400).json({ error: 'Missing movie id.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      if (!requireSession(req, res)) return;
      const movie = await db.getById(id);
      if (!movie) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(200).json(movie);
      return;
    }

    if (req.method === 'PATCH') {
      if (!requireAdmin(req, res)) return;
      const body = readJsonBody<UpdateMovieBody>(req);
      const innaRating = body.innaRating ?? null;
      const bogdanRating = body.bogdanRating ?? null;
      const userAvgRating = computeUserAvgRating(innaRating, bogdanRating);
      const updated = await db.update(id, {
        status: body.status,
        watchDate: body.watchDate,
        innaRating,
        bogdanRating,
        userAvgRating,
        comment: body.comment,
      });
      if (!updated) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(200).json(updated);
      return;
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      await db.delete(id);
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
