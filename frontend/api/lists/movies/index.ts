import type { ApiRequest, ApiResponse } from '../../_lib/types.js';
import { readJsonBody, describeError } from '../../_lib/types.js';
import { requireUser } from '../../_lib/auth.js';
import { listsDb, catalogDb, listMoviesDb, ratingsDb } from '../../_lib/db.js';
import { getMovieDetails, getTvDetails } from '../../_lib/tmdb.js';

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

async function handleGet(req: ApiRequest, res: ApiResponse, userId: string) {
  const listId = firstQueryValue(req.query.listId);
  if (!listId) {
    res.status(400).json({ error: 'Missing listId.' });
    return;
  }
  const membership = await listsDb.getMembership(listId, userId);
  if (!membership) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const search = firstQueryValue(req.query.search);
  const status = firstQueryValue(req.query.status);
  const contentType = firstQueryValue(req.query.contentType) as 'MOVIE' | 'TV' | undefined;
  const sortBy = firstQueryValue(req.query.sortBy);
  const sortOrder = firstQueryValue(req.query.sortOrder);
  const pageRaw = firstQueryValue(req.query.page);
  const genresRaw = firstQueryValue(req.query.genres);
  const genres = genresRaw ? genresRaw.split(',').filter(Boolean) : undefined;
  const page = pageRaw ? Number.parseInt(pageRaw, 10) || 1 : 1;

  const result = await listMoviesDb.list(listId, {
    search,
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
    page,
  });
  res.status(200).json(result);
}

interface AddMovieBody {
  listId: string;
  movieId?: string;
  tmdbId?: number;
  contentType?: 'MOVIE' | 'TV';
  title?: string;
  status: string;
  watchDate?: string | null;
  comment?: string | null;
  rating?: number | null;
}

async function handlePost(req: ApiRequest, res: ApiResponse, userId: string) {
  const body = readJsonBody<AddMovieBody>(req);
  if (!body.listId) {
    res.status(400).json({ error: 'Missing listId.' });
    return;
  }
  const membership = await listsDb.getMembership(body.listId, userId);
  if (!membership) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (!body.status) {
    res.status(400).json({ error: 'status is required.' });
    return;
  }

  // Resolve (or cache) the catalog entry — see db-multi-user-architecture
  // doc §6: movieId reuses a result the client already saw was in the
  // catalog; tmdbId hits TMDb at most once ever per title; title-only is
  // the rare fully-manual entry.
  let movie;
  if (body.movieId) {
    movie = await catalogDb.getById(body.movieId);
    if (!movie) {
      res.status(400).json({ error: 'Unknown movieId.' });
      return;
    }
  } else if (body.tmdbId != null && body.contentType) {
    movie = await catalogDb.findByTmdbId(body.tmdbId, body.contentType);
    if (!movie) {
      const details =
        body.contentType === 'MOVIE'
          ? await getMovieDetails(body.tmdbId)
          : await getTvDetails(body.tmdbId);
      movie = await catalogDb.upsertFromTmdb(details);
    }
  } else if (body.title && body.contentType) {
    movie = await catalogDb.createManual({ contentType: body.contentType, title: body.title });
  } else {
    res.status(400).json({
      error: 'Provide movieId, or tmdbId + contentType, or title + contentType.',
    });
    return;
  }

  const { id: listMovieId } = await listMoviesDb.create({
    listId: body.listId,
    movieId: movie.id,
    status: body.status,
    watchDate: body.watchDate ?? null,
    comment: body.comment ?? null,
    addedBy: userId,
  });

  if (body.rating !== undefined) {
    await ratingsDb.setRating({ listMovieId, userId, rating: body.rating, ratedBy: userId });
  }

  const created = await listMoviesDb.getById(listMovieId);
  res.status(201).json(created);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    if (req.method === 'GET') {
      await handleGet(req, res, user.id);
    } else if (req.method === 'POST') {
      await handlePost(req, res, user.id);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: describeError(err, 'Internal error') });
  }
}
