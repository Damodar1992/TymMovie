import { db, normalizeTitle, computeUserAvgRating } from '../../lib/db';

const STATUS = ['WATCHED', 'WANT_TO_WATCH'] as const;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string) {
  return jsonResponse({ message, statusCode: 400 }, 400);
}

function getIdFromRequest(request: Request): string | null {
  const path = new URL(request.url).pathname;
  const match = /^\/api\/movies\/([^/]+)$/.exec(path);
  return match ? match[1] : null;
}

export default async function handler(request: Request): Promise<Response> {
  const id = getIdFromRequest(request);
  if (!id) return jsonResponse({ message: 'Not found' }, 404);

  if (request.method === 'GET') {
    try {
      const movie = await db.getById(id);
      if (!movie) return jsonResponse({ message: 'Movie not found.' }, 404);
      return jsonResponse(movie);
    } catch (err) {
      console.error(err);
      return jsonResponse({ message: 'Failed to get movie' }, 500);
    }
  }

  if (request.method === 'PUT') {
    try {
      const existing = await db.getById(id);
      if (!existing) return jsonResponse({ message: 'Movie not found.' }, 404);

      const body = (await request.json()) as Record<string, unknown>;

      let title = existing.title;
      let titleNormalized = existing.titleNormalized;
      if (typeof body.title === 'string' && body.title.trim()) {
        title = body.title.trim();
        titleNormalized = normalizeTitle(title);
      }

      let status = existing.status;
      if (body.status && STATUS.includes(body.status as (typeof STATUS)[number])) {
        status = body.status as string;
      }

      let watchDate = body.watchDate !== undefined ? (body.watchDate as string | null) : existing.watchDate;
      if (status === 'WANT_TO_WATCH') watchDate = null;
      if (status === 'WATCHED' && !watchDate) return badRequest('Watch date is required for watched movies.');

      const innaRating = body.innaRating !== undefined ? Number(body.innaRating) : existing.innaRating;
      const bogdanRating = body.bogdanRating !== undefined ? Number(body.bogdanRating) : existing.bogdanRating;
      if (innaRating != null && (innaRating < 0 || innaRating > 10)) return badRequest('innaRating must be 0–10');
      if (bogdanRating != null && (bogdanRating < 0 || bogdanRating > 10)) return badRequest('bogdanRating must be 0–10');

      const userAvgRating = computeUserAvgRating(
        Number.isFinite(innaRating) ? innaRating : null,
        Number.isFinite(bogdanRating) ? bogdanRating : null,
      );

      const movie = await db.update(id, {
        title,
        titleNormalized,
        status,
        watchDate,
        innaRating: Number.isFinite(innaRating) ? innaRating : null,
        bogdanRating: Number.isFinite(bogdanRating) ? bogdanRating : null,
        userAvgRating,
        originalTitle: body.originalTitle !== undefined ? (body.originalTitle as string | null) : undefined,
        imdbId: body.imdbId !== undefined ? (body.imdbId as string | null) : undefined,
        posterUrl: body.posterUrl !== undefined ? (body.posterUrl as string | null) : undefined,
        genres: body.genres !== undefined ? (Array.isArray(body.genres) ? (body.genres as string[]) : null) : undefined,
        imdbRating: body.imdbRating !== undefined ? (typeof body.imdbRating === 'number' ? body.imdbRating : null) : undefined,
        sourceProvider: body.sourceProvider !== undefined ? (body.sourceProvider as string | null) : undefined,
        sourcePayload: body.sourcePayload !== undefined ? body.sourcePayload : undefined,
      });
      return jsonResponse(movie);
    } catch (err) {
      console.error(err);
      return jsonResponse({ message: 'Failed to update movie' }, 500);
    }
  }

  if (request.method === 'DELETE') {
    try {
      const existing = await db.getById(id);
      if (!existing) return jsonResponse({ message: 'Movie not found.' }, 404);
      await db.delete(id);
      return new Response(null, { status: 204 });
    } catch (err) {
      console.error(err);
      return jsonResponse({ message: 'Failed to delete movie' }, 500);
    }
  }

  return jsonResponse({ message: 'Method not allowed' }, 405);
}
