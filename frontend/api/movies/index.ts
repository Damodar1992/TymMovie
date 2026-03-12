import { db, normalizeTitle, computeUserAvgRating } from '../../lib/db';

const STATUS = ['WATCHED', 'WANT_TO_WATCH'] as const;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Source': 'tym-movie-api', // confirms response is from our serverless (Neon)
    },
  });
}

function badRequest(message: string) {
  return jsonResponse({ message, statusCode: 400 }, 400);
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    try {
      const search = url.searchParams.get('search') ?? undefined;
      const status = url.searchParams.get('status') ?? undefined;
      const genresAll = url.searchParams.getAll('genres');
      const genresParam = url.searchParams.get('genres');
      const genres =
        genresAll.length > 0
          ? genresAll.map((g) => g.trim()).filter(Boolean)
          : genresParam
            ? genresParam.split(',').map((g) => g.trim()).filter(Boolean)
            : undefined;
      const sortBy = (url.searchParams.get('sortBy') ?? 'user_avg_rating') as 'watch_date' | 'status' | 'user_avg_rating';
      const sortOrder = (url.searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));

      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'api-list-entry',
          hypothesisId: 'H2',
          location: 'api/movies/index.ts:GET:before-db-list',
          message: 'List handler called',
          data: { search, status, sortBy, sortOrder, page, limit },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      const result = await db.list({
        search,
        status: status && STATUS.includes(status as (typeof STATUS)[number]) ? status : undefined,
        genres,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'api-list-result',
          hypothesisId: 'H4',
          location: 'api/movies/index.ts:GET:after-db-list',
          message: 'db.list result',
          data: { itemsLength: result.items?.length ?? -1, total: result.total, page: result.page, limit: result.limit },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      return jsonResponse(result);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'api-list-error',
          hypothesisId: 'H4',
          location: 'api/movies/index.ts:GET:catch',
          message: 'List handler error',
          data: { name: (err as Error).name, message: (err as Error).message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
      console.error(err);
      return jsonResponse({ message: 'Failed to list movies' }, 500);
    }
  }

  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'api-create-entry',
          hypothesisId: 'H3',
          location: 'api/movies/index.ts:POST:entry',
          message: 'Create handler called',
          data: { bodyKeys: Object.keys(body ?? {}), title: body?.title, status: body?.status },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const status = body.status as string | undefined;

      if (!title) return badRequest('title is required');
      if (!status || !STATUS.includes(status as (typeof STATUS)[number])) {
        return badRequest('status must be WATCHED or WANT_TO_WATCH');
      }

      const watchDate = status === 'WANT_TO_WATCH' ? null : (body.watchDate as string | null) ?? null;
      if (status === 'WATCHED' && !watchDate) return badRequest('Watch date is required for watched movies.');
      if (status === 'WANT_TO_WATCH' && watchDate) return badRequest('Watch date must be empty for want to watch.');

      const innaRating = body.innaRating != null ? Number(body.innaRating) : null;
      const bogdanRating = body.bogdanRating != null ? Number(body.bogdanRating) : null;
      if (innaRating != null && (innaRating < 0 || innaRating > 10)) return badRequest('innaRating must be 0–10');
      if (bogdanRating != null && (bogdanRating < 0 || bogdanRating > 10)) return badRequest('bogdanRating must be 0–10');

      const userAvgRating = computeUserAvgRating(
        Number.isFinite(innaRating) ? innaRating : null,
        Number.isFinite(bogdanRating) ? bogdanRating : null,
      );
      const titleNormalized = normalizeTitle(title);
      const existing = await db.findByTitleNormalized(titleNormalized);

      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'api-create-before-db',
          hypothesisId: 'H5',
          location: 'api/movies/index.ts:POST:before-db-create',
          message: 'Validation passed, calling db.create',
          data: { title, status, titleNormalized },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      const movie = await db.create({
        title,
        titleNormalized,
        status,
        watchDate,
        innaRating: Number.isFinite(innaRating) ? innaRating : null,
        bogdanRating: Number.isFinite(bogdanRating) ? bogdanRating : null,
        userAvgRating,
        originalTitle: typeof body.originalTitle === 'string' ? body.originalTitle : null,
        imdbId: typeof body.imdbId === 'string' ? body.imdbId : null,
        posterUrl: typeof body.posterUrl === 'string' ? body.posterUrl : null,
        genres: Array.isArray(body.genres) ? (body.genres as string[]) : null,
        imdbRating: typeof body.imdbRating === 'number' ? body.imdbRating : null,
        sourceProvider: typeof body.sourceProvider === 'string' ? body.sourceProvider : null,
        sourcePayload: body.sourcePayload ?? null,
      });

      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'api-create-after-db',
          hypothesisId: 'H4',
          location: 'api/movies/index.ts:POST:after-db-create',
          message: 'db.create succeeded',
          data: { movieId: (movie as { id?: string })?.id },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      return jsonResponse({ movie, duplicateTitle: existing });
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'api-create-error',
          hypothesisId: 'H4',
          location: 'api/movies/index.ts:POST:catch',
          message: 'Create handler error',
          data: { name: (err as Error).name, message: (err as Error).message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
      console.error(err);
      return jsonResponse({ message: 'Failed to create movie' }, 500);
    }
  }

  return jsonResponse({ message: 'Method not allowed' }, 405);
}

export const GET = handler;
export const POST = handler;
export default handler;
