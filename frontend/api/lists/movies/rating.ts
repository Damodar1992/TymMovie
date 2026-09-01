import type { ApiRequest, ApiResponse } from '../../_lib/types.js';
import { readJsonBody, describeError } from '../../_lib/types.js';
import { requireUser } from '../../_lib/auth.js';
import { listsDb, listMoviesDb, ratingsDb } from '../../_lib/db.js';

interface SetRatingBody {
  listMovieId: string;
  userId: string;
  rating: number | null;
}

/** PATCH /api/lists/movies/rating — sets one member's rating on one
 *  list_movies row. Allowed when the caller IS that member, or when the
 *  caller owns the list (owner can rate on behalf of anyone in their
 *  group — see db-multi-user-architecture doc §3). */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const user = requireUser(req, res);
  if (!user) return;

  const body = readJsonBody<SetRatingBody>(req);
  if (!body.listMovieId || !body.userId) {
    res.status(400).json({ error: 'listMovieId and userId are required.' });
    return;
  }

  try {
    const listId = await listMoviesDb.getListIdForListMovie(body.listMovieId);
    if (!listId) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const membership = await listsDb.getMembership(listId, user.id);
    if (!membership) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const targetMembership = await listsDb.getMembership(listId, body.userId);
    if (!targetMembership) {
      res.status(400).json({ error: 'That user is not a member of this list.' });
      return;
    }

    const isSelf = body.userId === user.id;
    const isOwner = membership.role === 'owner';
    if (!isSelf && !isOwner) {
      res.status(403).json({ error: 'Only the list owner can set a rating for someone else.' });
      return;
    }

    await ratingsDb.setRating({
      listMovieId: body.listMovieId,
      userId: body.userId,
      rating: body.rating,
      ratedBy: user.id,
    });
    const item = await listMoviesDb.getById(body.listMovieId);
    res.status(200).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
