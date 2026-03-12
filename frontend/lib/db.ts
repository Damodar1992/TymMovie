import { neon } from '@neondatabase/serverless';

/** Все операции с БД (list, getById, create, update, delete) идут через Neon PostgreSQL (DATABASE_URL). */
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

const MOVIE_COLS =
  'id, title, title_normalized, original_title, imdb_id, poster_url, genres, imdb_rating, inna_rating, bogdan_rating, user_avg_rating, status, watch_date, source_provider, source_payload, created_at, updated_at';

export type MovieRow = {
  id: string;
  title: string;
  title_normalized: string;
  original_title: string | null;
  imdb_id: string | null;
  poster_url: string | null;
  genres: string[] | null;
  imdb_rating: string | null;
  inna_rating: string | null;
  bogdan_rating: string | null;
  user_avg_rating: string | null;
  status: string;
  watch_date: string | null;
  source_provider: string | null;
  source_payload: unknown;
  created_at: Date;
  updated_at: Date;
};

function rowToMovie(r: MovieRow) {
  return {
    id: r.id,
    title: r.title,
    titleNormalized: r.title_normalized,
    originalTitle: r.original_title,
    imdbId: r.imdb_id,
    posterUrl: r.poster_url,
    genres: r.genres,
    imdbRating: r.imdb_rating != null ? Number(r.imdb_rating) : null,
    innaRating: r.inna_rating != null ? Number(r.inna_rating) : null,
    bogdanRating: r.bogdan_rating != null ? Number(r.bogdan_rating) : null,
    userAvgRating: r.user_avg_rating != null ? Number(r.user_avg_rating) : null,
    status: r.status,
    watchDate: r.watch_date,
    sourceProvider: r.source_provider,
    sourcePayload: r.source_payload,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const db = {
  async list(params: {
    search?: string;
    status?: string;
    genres?: string[];
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const sql = getSql();
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 100);
    const offset = (page - 1) * limit;
    const sortBy = params.sortBy === 'watch_date' ? 'watch_date' : params.sortBy === 'status' ? 'status' : 'user_avg_rating';
    const order = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (params.search?.trim()) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(original_title) LIKE $${idx})`);
      values.push(`%${params.search.trim().toLowerCase()}%`);
      idx++;
    }
    if (params.status) {
      conditions.push(`status = $${idx}`);
      values.push(params.status);
      idx++;
    }
    if (params.genres?.length) {
      conditions.push(`genres ?| $${idx}`);
      values.push(params.genres);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await sql(
      `SELECT COUNT(*)::int AS c FROM movies ${whereClause}`,
      values,
    );
    const total = (countResult[0] as { c: number })?.c ?? 0;

    const nullableOrder = sortBy === 'user_avg_rating' || sortBy === 'watch_date' ? 'NULLS LAST' : '';
    const orderClause = `ORDER BY ${sortBy} ${order} ${nullableOrder}`;
    const rows = await sql(
      `SELECT ${MOVIE_COLS} FROM movies ${whereClause} ${orderClause} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    // #region agent log
    try {
      await fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'db-list-result',
          hypothesisId: 'H4',
          location: 'lib/db.ts:list:after-query',
          message: 'DB list query result',
          data: { total, rowsLength: Array.isArray(rows) ? rows.length : -1, rawFirstKey: rows?.[0] ? Object.keys(rows[0] as object)[0] : null },
          timestamp: Date.now(),
        }),
      });
    } catch (_) {}
    // #endregion agent log

    return {
      items: (rows as MovieRow[]).map(rowToMovie),
      total,
      page,
      limit,
    };
  },

  async getById(id: string) {
    const sql = getSql();
    const rows = await sql(`SELECT ${MOVIE_COLS} FROM movies WHERE id = $1`, [id]);
    const row = rows[0] as MovieRow | undefined;
    return row ? rowToMovie(row) : null;
  },

  async create(data: {
    title: string;
    titleNormalized: string;
    status: string;
    watchDate: string | null;
    innaRating: number | null;
    bogdanRating: number | null;
    userAvgRating: number | null;
    originalTitle?: string | null;
    imdbId?: string | null;
    posterUrl?: string | null;
    genres?: string[] | null;
    imdbRating?: number | null;
    sourceProvider?: string | null;
    sourcePayload?: unknown;
  }) {
    // #region agent log
    try {
      await fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'db-create-start',
          hypothesisId: 'H3',
          location: 'lib/db.ts:create:entry',
          message: 'db.create called',
          data: { hasDatabaseUrl: !!process.env.DATABASE_URL, title: data.title },
          timestamp: Date.now(),
        }),
      });
    } catch (_) {}
    // #endregion agent log
    const sql = getSql();
    const id = crypto.randomUUID();
    try {
    await sql(
      `INSERT INTO movies (id, title, title_normalized, original_title, imdb_id, poster_url, genres, imdb_rating, inna_rating, bogdan_rating, user_avg_rating, status, watch_date, source_provider, source_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        data.title,
        data.titleNormalized,
        data.originalTitle ?? null,
        data.imdbId ?? null,
        data.posterUrl ?? null,
        data.genres ? JSON.stringify(data.genres) : null,
        data.imdbRating ?? null,
        data.innaRating ?? null,
        data.bogdanRating ?? null,
        data.userAvgRating ?? null,
        data.status,
        data.watchDate,
        data.sourceProvider ?? null,
        data.sourcePayload != null ? JSON.stringify(data.sourcePayload) : null,
      ],
    );
    } catch (e) {
      // #region agent log
      try {
        await fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
          body: JSON.stringify({
            sessionId: 'fdb080',
            runId: 'db-create-error',
            hypothesisId: 'H4',
            location: 'lib/db.ts:create:catch',
            message: 'INSERT failed',
            data: { name: (e as Error).name, message: (e as Error).message },
            timestamp: Date.now(),
          }),
        });
      } catch (_) {}
      // #endregion agent log
      throw e;
    }
    return db.getById(id) as Promise<ReturnType<typeof rowToMovie>>;
  },

  async update(
    id: string,
    data: Partial<{
      title: string;
      titleNormalized: string;
      status: string;
      watchDate: string | null;
      innaRating: number | null;
      bogdanRating: number | null;
      userAvgRating: number | null;
      originalTitle: string | null;
      imdbId: string | null;
      posterUrl: string | null;
      genres: string[] | null;
      imdbRating: number | null;
      sourceProvider: string | null;
      sourcePayload: unknown;
    }>,
  ) {
    const sql = getSql();
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      updates.push(`${col} = $${i}`);
      values.push(val);
      i++;
    };
    if (data.title !== undefined) set('title', data.title);
    if (data.titleNormalized !== undefined) set('title_normalized', data.titleNormalized);
    if (data.status !== undefined) set('status', data.status);
    if (data.watchDate !== undefined) set('watch_date', data.watchDate);
    if (data.innaRating !== undefined) set('inna_rating', data.innaRating);
    if (data.bogdanRating !== undefined) set('bogdan_rating', data.bogdanRating);
    if (data.userAvgRating !== undefined) set('user_avg_rating', data.userAvgRating);
    if (data.originalTitle !== undefined) set('original_title', data.originalTitle);
    if (data.imdbId !== undefined) set('imdb_id', data.imdbId);
    if (data.posterUrl !== undefined) set('poster_url', data.posterUrl);
    if (data.genres !== undefined) set('genres', data.genres ? JSON.stringify(data.genres) : null);
    if (data.imdbRating !== undefined) set('imdb_rating', data.imdbRating);
    if (data.sourceProvider !== undefined) set('source_provider', data.sourceProvider);
    if (data.sourcePayload !== undefined) set('source_payload', data.sourcePayload ? JSON.stringify(data.sourcePayload) : null);
    if (updates.length === 0) return db.getById(id);
    updates.push(`updated_at = NOW()`);
    values.push(id);
    await sql(`UPDATE movies SET ${updates.join(', ')} WHERE id = $${i}`, values);
    return db.getById(id);
  },

  async delete(id: string) {
    const sql = getSql();
    await sql('DELETE FROM movies WHERE id = $1', [id]);
  },

  async findByTitleNormalized(titleNormalized: string) {
    const sql = getSql();
    const rows = await sql('SELECT id FROM movies WHERE title_normalized = $1 LIMIT 1', [titleNormalized]);
    return rows.length > 0;
  },
};

export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function computeUserAvgRating(inna: number | null, bogdan: number | null): number | null {
  const ratings = [inna, bogdan].filter((r): r is number => r != null);
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}
