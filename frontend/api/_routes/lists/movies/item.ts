import type { ApiRequest, ApiResponse } from '../../../_lib/types.js';
import { readJsonBody, describeError } from '../../../_lib/types.js';
import { requireUser } from '../../../_lib/auth.js';
import { listsDb, listMoviesDb, ratingsDb } from '../../../_lib/db.js';

interface UpdateListMovieBody {
  status?: string;
  watchDate?: string | null;
  comment?: string | null;
  /** Convenience: sets the CALLER's own rating in the same request. To
   *  set someone else's rating (owner-only), use lists/movies/rating.ts. */
  rating?: number | null;
}

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const id = firstQueryValue(req.query.id);
  if (!id) {
    res.status(400).json({ error: 'Missing id.' });
    return;
  }
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const listId = await listMoviesDb.getListIdForListMovie(id);
    if (!listId) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const membership = await listsDb.getMembership(listId, user.id);
    if (!membership) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (req.method === 'GET') {
      const item = await listMoviesDb.getById(id);
      res.status(200).json(item);
      return;
    }

    if (req.method === 'PATCH') {
      const body = readJsonBody<UpdateListMovieBody>(req);
      await listMoviesDb.update(id, {
        status: body.status,
        watchDate: body.watchDate,
        comment: body.comment,
      });
      if (body.rating !== undefined) {
        await ratingsDb.setRating({
          listMovieId: id,
          userId: user.id,
          rating: body.rating,
          ratedBy: user.id,
        });
      }
      const item = await listMoviesDb.getById(id);
      res.status(200).json(item);
      return;
    }

    if (req.method === 'DELETE') {
      await listMoviesDb.delete(id);
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
