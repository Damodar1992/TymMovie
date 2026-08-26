import type { ApiRequest, ApiResponse } from '../_lib/types';
import { readJsonBody } from '../_lib/types';
import { requireAdmin, requireSession } from '../_lib/auth';
import { db, normalizeTitle, computeUserAvgRating } from '../_lib/db';

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

async function handleGet(req: ApiRequest, res: ApiResponse) {
  if (!requireSession(req, res)) return;

  const search = firstQueryValue(req.query.search);
  const status = firstQueryValue(req.query.status);
  const contentType = firstQueryValue(req.query.contentType) as 'MOVIE' | 'TV' | undefined;
  const sortBy = firstQueryValue(req.query.sortBy);
  const sortOrder = firstQueryValue(req.query.sortOrder);
  const pageRaw = firstQueryValue(req.query.page);
  const genresRaw = firstQueryValue(req.query.genres);
  const genres = genresRaw ? genresRaw.split(',').filter(Boolean) : undefined;
  const page = pageRaw ? Number.parseInt(pageRaw, 10) || 1 : 1;

  const result = await db.list({ search, status, contentType, genres, sortBy, sortOrder, page });
  res.status(200).json(result);
}

interface CreateMovieBody {
  contentType: 'MOVIE' | 'TV';
  title: string;
  originalTitle?: string | null;
  titleUa?: string | null;
  tmdbId?: number | null;
  posterUrl?: string | null;
  genres?: string[] | null;
  tmdbRating?: number | null;
  releaseYear?: number | null;
  status: string;
  watchDate?: string | null;
  innaRating?: number | null;
  bogdanRating?: number | null;
  comment?: string | null;
}

async function handlePost(req: ApiRequest, res: ApiResponse) {
  if (!requireAdmin(req, res)) return;

  const body = readJsonBody<CreateMovieBody>(req);
  if (!body.title || !body.contentType || !body.status) {
    res.status(400).json({ error: 'title, contentType and status are required.' });
    return;
  }

  const titleNormalized = normalizeTitle(body.title);
  const duplicate = await db.findDuplicate({
    tmdbId: body.tmdbId ?? null,
    contentType: body.contentType,
  });
  if (duplicate) {
    res.status(409).json({ error: 'An entry with the same TMDb id and type already exists.' });
    return;
  }

  const innaRating = body.innaRating ?? null;
  const bogdanRating = body.bogdanRating ?? null;
  const userAvgRating = computeUserAvgRating(innaRating, bogdanRating);

  const created = await db.create({
    contentType: body.contentType,
    title: body.title,
    titleNormalized,
    status: body.status,
    watchDate: body.watchDate ?? null,
    innaRating,
    bogdanRating,
    userAvgRating,
    originalTitle: body.originalTitle ?? null,
    titleUa: body.titleUa ?? null,
    tmdbId: body.tmdbId ?? null,
    posterUrl: body.posterUrl ?? null,
    genres: body.genres ?? null,
    tmdbRating: body.tmdbRating ?? null,
    releaseYear: body.releaseYear ?? null,
    comment: body.comment ?? null,
  });
  res.status(201).json(created);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === 'GET') {
      await handleGet(req, res);
    } else if (req.method === 'POST') {
      await handlePost(req, res);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
