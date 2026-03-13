import { neon } from '@neondatabase/serverless';

/** All DB operations (list, getById, create, update, delete, duplicate checks) go to Neon PostgreSQL via VITE_DATABASE_URL. */
function getSql() {
  const url = import.meta.env.VITE_DATABASE_URL as string | undefined;
  if (!url) throw new Error('VITE_DATABASE_URL is not set');
  return neon(url);
}

const MOVIE_COLS =
  'id, content_type, title, title_normalized, original_title, tmdb_id, poster_url, genres, tmdb_rating, release_year, inna_rating, bogdan_rating, user_avg_rating, status, watch_date, created_at, updated_at';

export type MovieRow = {
  id: string;
  content_type: string;
  title: string;
  title_normalized: string;
  original_title: string | null;
  tmdb_id: number | null;
  poster_url: string | null;
  genres: string[] | null;
  tmdb_rating: string | null;
  release_year: number | null;
  inna_rating: string | null;
  bogdan_rating: string | null;
  user_avg_rating: string | null;
  status: string;
  watch_date: string | Date | null;
  created_at: Date;
  updated_at: Date;
};

function dateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rowToMovie(r: MovieRow) {
  const watchDateValue =
    r.watch_date instanceof Date
      ? dateToYYYYMMDD(r.watch_date)
      : r.watch_date;
  return {
    id: r.id,
    contentType: r.content_type as 'MOVIE' | 'TV',
    title: r.title,
    titleNormalized: r.title_normalized,
    originalTitle: r.original_title,
    tmdbId: r.tmdb_id,
    posterUrl: r.poster_url,
    genres: r.genres,
    tmdbRating: r.tmdb_rating != null ? Number(r.tmdb_rating) : null,
    releaseYear: r.release_year,
    innaRating: r.inna_rating != null ? Number(r.inna_rating) : null,
    bogdanRating: r.bogdan_rating != null ? Number(r.bogdan_rating) : null,
    userAvgRating: r.user_avg_rating != null ? Number(r.user_avg_rating) : null,
    status: r.status,
    watchDate: watchDateValue,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const db = {
  async list(params: {
    search?: string;
    status?: string;
    contentType?: 'MOVIE' | 'TV';
    genres?: string[];
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const sql = getSql();
      const page = params.page ?? 1;
      const limit = Math.min(params.limit ?? 50, 100);
      const offset = (page - 1) * limit;
      const sortBy =
        params.sortBy === 'watch_date'
          ? 'watch_date'
          : params.sortBy === 'created_at'
            ? 'created_at'
            : 'user_avg_rating';
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
      if (params.contentType) {
        conditions.push(`content_type = $${idx}`);
        values.push(params.contentType);
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

      const nullableOrder =
        sortBy === 'user_avg_rating' || sortBy === 'watch_date'
          ? 'NULLS LAST'
          : '';
      const orderClause = `ORDER BY ${sortBy} ${order} ${nullableOrder}`;
      const rows = await sql(
        `SELECT ${MOVIE_COLS} FROM movies ${whereClause} ${orderClause} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset],
      );

      return {
        items: (rows as MovieRow[]).map(rowToMovie),
        total,
        page,
        limit,
      };
    } catch (err) {
      throw err;
    }
  },

  async getById(id: string) {
    const sql = getSql();
    const rows = await sql(`SELECT ${MOVIE_COLS} FROM movies WHERE id = $1`, [id]);
    const row = rows[0] as MovieRow | undefined;
    return row ? rowToMovie(row) : null;
  },

  async create(data: {
    contentType: 'MOVIE' | 'TV';
    title: string;
    titleNormalized: string;
    status: string;
    watchDate: string | null;
    innaRating: number | null;
    bogdanRating: number | null;
    userAvgRating: number | null;
    originalTitle?: string | null;
    tmdbId?: number | null;
    posterUrl?: string | null;
    genres?: string[] | null;
    tmdbRating?: number | null;
    releaseYear?: number | null;
  }) {
    const sql = getSql();
    const id = crypto.randomUUID();
    await sql(
      `INSERT INTO movies (id, content_type, title, title_normalized, original_title, tmdb_id, poster_url, genres, tmdb_rating, release_year, inna_rating, bogdan_rating, user_avg_rating, status, watch_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        data.contentType,
        data.title,
        data.titleNormalized,
        data.originalTitle ?? null,
        data.tmdbId ?? null,
        data.posterUrl ?? null,
        data.genres ? JSON.stringify(data.genres) : null,
        data.tmdbRating ?? null,
        data.releaseYear ?? null,
        data.innaRating ?? null,
        data.bogdanRating ?? null,
        data.userAvgRating ?? null,
        data.status,
        data.watchDate,
      ],
    );
    return db.getById(id) as Promise<ReturnType<typeof rowToMovie>>;
  },

  async update(
    id: string,
    data: Partial<{
      contentType: 'MOVIE' | 'TV';
      title: string;
      titleNormalized: string;
      status: string;
      watchDate: string | null;
      innaRating: number | null;
      bogdanRating: number | null;
      userAvgRating: number | null;
      originalTitle: string | null;
      tmdbId: number | null;
      posterUrl: string | null;
      genres: string[] | null;
      tmdbRating: number | null;
      releaseYear: number | null;
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
    if (data.contentType !== undefined) set('content_type', data.contentType);
    if (data.title !== undefined) set('title', data.title);
    if (data.titleNormalized !== undefined) set('title_normalized', data.titleNormalized);
    if (data.status !== undefined) set('status', data.status);
    if (data.watchDate !== undefined) set('watch_date', data.watchDate);
    if (data.innaRating !== undefined) set('inna_rating', data.innaRating);
    if (data.bogdanRating !== undefined) set('bogdan_rating', data.bogdanRating);
    if (data.userAvgRating !== undefined) set('user_avg_rating', data.userAvgRating);
    if (data.originalTitle !== undefined) set('original_title', data.originalTitle);
    if (data.tmdbId !== undefined) set('tmdb_id', data.tmdbId);
    if (data.posterUrl !== undefined) set('poster_url', data.posterUrl);
    if (data.genres !== undefined) set('genres', data.genres ? JSON.stringify(data.genres) : null);
    if (data.tmdbRating !== undefined) set('tmdb_rating', data.tmdbRating);
    if (data.releaseYear !== undefined) set('release_year', data.releaseYear);
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

  async findDuplicate(params: { tmdbId?: number | null; contentType?: 'MOVIE' | 'TV' }) {
    const sql = getSql();
    if (params.tmdbId == null || !params.contentType) return false;
    const rows = await sql(
      'SELECT id FROM movies WHERE tmdb_id = $1 AND content_type = $2 LIMIT 1',
      [params.tmdbId, params.contentType],
    );
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
