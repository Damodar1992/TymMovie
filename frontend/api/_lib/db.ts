import { neon } from '@neondatabase/serverless';
import type { TmdbDetails } from './tmdb.js';
import { buildPosterUrl } from './tmdb.js';

/**
 * Server-side data layer. Runs only inside Vercel serverless functions —
 * DATABASE_URL is a plain (non-VITE_) env var, so it never reaches the
 * browser bundle. Schema changes live in /migrations as numbered SQL files
 * (see scripts/migrate.mjs); this module assumes the schema is current.
 *
 * Model (see the project's db-multi-user-architecture doc for the full
 * rationale): `movies` is a global, shared TMDb metadata cache. A `list`
 * has an owner and members (`list_members`); movies are added to a list
 * (`list_movies` — status/watch date/comment, shared across the list's
 * members) and each member has their own rating (`list_movie_ratings`).
 */
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

// ---------------------------------------------------------------------
// users
// ---------------------------------------------------------------------

export type UserRow = {
  id: string;
  google_sub: string | null;
  email: string;
  name: string | null;
  avatar_url: string | null;
};

export type UserDto = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

function rowToUser(r: UserRow): UserDto {
  return { id: r.id, email: r.email, name: r.name, avatarUrl: r.avatar_url };
}

const USER_COLS = 'id, google_sub, email, name, avatar_url';

export const usersDb = {
  async getById(id: string): Promise<UserDto | null> {
    const sql = getSql();
    const rows = await sql(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [id]);
    const row = rows[0] as UserRow | undefined;
    return row ? rowToUser(row) : null;
  },

  /**
   * Upserts a user from a verified Google profile. Matches on `google_sub`
   * first; if not found, falls back to matching on `email` — this is what
   * lets a pre-seeded placeholder (created by the migration backfill
   * script, or by accepting an invite... no, invites don't pre-seed users
   * — see docs) "activate" on first real login without creating a
   * duplicate row. Returns `isNewUser: true` only when neither match hit,
   * i.e. this really is the first time this person has ever touched the
   * app — that's the signal used to auto-create their personal list.
   */
  async upsertFromGoogle(profile: {
    sub: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  }): Promise<{ user: UserDto; isNewUser: boolean }> {
    const sql = getSql();
    const bySub = await sql(`SELECT ${USER_COLS} FROM users WHERE google_sub = $1`, [
      profile.sub,
    ]);
    if (bySub.length > 0) {
      const row = bySub[0] as UserRow;
      await sql(
        `UPDATE users SET name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $1`,
        [row.id, profile.name, profile.avatarUrl],
      );
      return { user: rowToUser({ ...row, name: profile.name ?? row.name, avatar_url: profile.avatarUrl ?? row.avatar_url }), isNewUser: false };
    }

    const byEmail = await sql(`SELECT ${USER_COLS} FROM users WHERE email = $1`, [
      profile.email,
    ]);
    if (byEmail.length > 0) {
      const row = byEmail[0] as UserRow;
      await sql(
        `UPDATE users SET google_sub = $2, name = COALESCE($3, name), avatar_url = COALESCE($4, avatar_url), updated_at = NOW() WHERE id = $1`,
        [row.id, profile.sub, profile.name, profile.avatarUrl],
      );
      return {
        user: rowToUser({
          ...row,
          google_sub: profile.sub,
          name: profile.name ?? row.name,
          avatar_url: profile.avatarUrl ?? row.avatar_url,
        }),
        isNewUser: false,
      };
    }

    const id = crypto.randomUUID();
    await sql(
      `INSERT INTO users (id, google_sub, email, name, avatar_url) VALUES ($1, $2, $3, $4, $5)`,
      [id, profile.sub, profile.email, profile.name, profile.avatarUrl],
    );
    return {
      user: { id, email: profile.email, name: profile.name, avatarUrl: profile.avatarUrl },
      isNewUser: true,
    };
  },
};

// ---------------------------------------------------------------------
// lists / list_members
// ---------------------------------------------------------------------

export type ListRole = 'owner' | 'member' | 'viewer';

export type ListDto = {
  id: string;
  name: string;
  ownerId: string;
  role: ListRole;
  createdAt: Date;
};

export type ListMemberDto = {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: ListRole;
};

export const listsDb = {
  /** Every list a user can see — owned or a member of, owner first. */
  async listsForUser(userId: string): Promise<ListDto[]> {
    const sql = getSql();
    const rows = await sql(
      `SELECT l.id, l.name, l.owner_id, l.created_at, lm.role
       FROM lists l
       JOIN list_members lm ON lm.list_id = l.id
       WHERE lm.user_id = $1
       ORDER BY (lm.role = 'owner') DESC, l.created_at ASC`,
      [userId],
    );
    return (rows as { id: string; name: string; owner_id: string; created_at: Date; role: ListRole }[]).map(
      (r) => ({ id: r.id, name: r.name, ownerId: r.owner_id, role: r.role, createdAt: r.created_at }),
    );
  },

  async createList(params: { ownerId: string; name: string }): Promise<ListDto> {
    const sql = getSql();
    const id = crypto.randomUUID();
    await sql(`INSERT INTO lists (id, owner_id, name) VALUES ($1, $2, $3)`, [
      id,
      params.ownerId,
      params.name,
    ]);
    await sql(
      `INSERT INTO list_members (id, list_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
      [crypto.randomUUID(), id, params.ownerId],
    );
    return { id, name: params.name, ownerId: params.ownerId, role: 'owner', createdAt: new Date() };
  },

  async getListById(id: string): Promise<{ id: string; name: string; ownerId: string } | null> {
    const sql = getSql();
    const rows = await sql(`SELECT id, name, owner_id FROM lists WHERE id = $1`, [id]);
    const row = rows[0] as { id: string; name: string; owner_id: string } | undefined;
    return row ? { id: row.id, name: row.name, ownerId: row.owner_id } : null;
  },

  async getMembership(listId: string, userId: string): Promise<{ role: ListRole } | null> {
    const sql = getSql();
    const rows = await sql(
      `SELECT role FROM list_members WHERE list_id = $1 AND user_id = $2`,
      [listId, userId],
    );
    const row = rows[0] as { role: ListRole } | undefined;
    return row ? { role: row.role } : null;
  },

  async renameList(id: string, name: string): Promise<void> {
    const sql = getSql();
    await sql(`UPDATE lists SET name = $2, updated_at = NOW() WHERE id = $1`, [id, name]);
  },

  async listMembers(listId: string): Promise<ListMemberDto[]> {
    const sql = getSql();
    const rows = await sql(
      `SELECT u.id AS user_id, u.email, u.name, u.avatar_url, lm.role
       FROM list_members lm
       JOIN users u ON u.id = lm.user_id
       WHERE lm.list_id = $1
       ORDER BY (lm.role = 'owner') DESC, u.name NULLS LAST, u.email`,
      [listId],
    );
    return (rows as { user_id: string; email: string; name: string | null; avatar_url: string | null; role: ListRole }[]).map(
      (r) => ({ userId: r.user_id, email: r.email, name: r.name, avatarUrl: r.avatar_url, role: r.role }),
    );
  },

  async removeMember(listId: string, userId: string): Promise<void> {
    const sql = getSql();
    await sql(`DELETE FROM list_members WHERE list_id = $1 AND user_id = $2`, [listId, userId]);
  },

  async deleteList(id: string): Promise<void> {
    const sql = getSql();
    await sql(`DELETE FROM lists WHERE id = $1`, [id]);
  },
};

// ---------------------------------------------------------------------
// list_invites
// ---------------------------------------------------------------------

export type InviteDto = {
  id: string;
  listId: string;
  token: string;
  role: ListRole;
  createdBy: string;
  revokedAt: Date | null;
  maxUses: number | null;
  useCount: number;
  createdAt: Date;
};

export const invitesDb = {
  async createInvite(params: {
    listId: string;
    token: string;
    role: ListRole;
    createdBy: string;
    maxUses?: number | null;
  }): Promise<InviteDto> {
    const sql = getSql();
    const id = crypto.randomUUID();
    await sql(
      `INSERT INTO list_invites (id, list_id, token, role, created_by, max_uses)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, params.listId, params.token, params.role, params.createdBy, params.maxUses ?? null],
    );
    return {
      id,
      listId: params.listId,
      token: params.token,
      role: params.role,
      createdBy: params.createdBy,
      revokedAt: null,
      maxUses: params.maxUses ?? null,
      useCount: 0,
      createdAt: new Date(),
    };
  },

  async listInvites(listId: string): Promise<InviteDto[]> {
    const sql = getSql();
    const rows = await sql(
      `SELECT id, list_id, token, role, created_by, revoked_at, max_uses, use_count, created_at
       FROM list_invites WHERE list_id = $1 ORDER BY created_at DESC`,
      [listId],
    );
    return (
      rows as {
        id: string;
        list_id: string;
        token: string;
        role: ListRole;
        created_by: string;
        revoked_at: Date | null;
        max_uses: number | null;
        use_count: number;
        created_at: Date;
      }[]
    ).map((r) => ({
      id: r.id,
      listId: r.list_id,
      token: r.token,
      role: r.role,
      createdBy: r.created_by,
      revokedAt: r.revoked_at,
      maxUses: r.max_uses,
      useCount: r.use_count,
      createdAt: r.created_at,
    }));
  },

  async getInviteByToken(token: string): Promise<InviteDto | null> {
    const sql = getSql();
    const rows = await sql(
      `SELECT id, list_id, token, role, created_by, revoked_at, max_uses, use_count, created_at
       FROM list_invites WHERE token = $1`,
      [token],
    );
    const row = rows[0] as
      | {
          id: string;
          list_id: string;
          token: string;
          role: ListRole;
          created_by: string;
          revoked_at: Date | null;
          max_uses: number | null;
          use_count: number;
          created_at: Date;
        }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      listId: row.list_id,
      token: row.token,
      role: row.role,
      createdBy: row.created_by,
      revokedAt: row.revoked_at,
      maxUses: row.max_uses,
      useCount: row.use_count,
      createdAt: row.created_at,
    };
  },

  async revokeInvite(id: string, listId: string): Promise<void> {
    const sql = getSql();
    await sql(`UPDATE list_invites SET revoked_at = NOW() WHERE id = $1 AND list_id = $2`, [id, listId]);
  },

  async getInviteById(id: string): Promise<InviteDto | null> {
    const sql = getSql();
    const rows = await sql(
      `SELECT id, list_id, token, role, created_by, revoked_at, max_uses, use_count, created_at
       FROM list_invites WHERE id = $1`,
      [id],
    );
    const row = rows[0] as
      | {
          id: string;
          list_id: string;
          token: string;
          role: ListRole;
          created_by: string;
          revoked_at: Date | null;
          max_uses: number | null;
          use_count: number;
          created_at: Date;
        }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      listId: row.list_id,
      token: row.token,
      role: row.role,
      createdBy: row.created_by,
      revokedAt: row.revoked_at,
      maxUses: row.max_uses,
      useCount: row.use_count,
      createdAt: row.created_at,
    };
  },

  /** Validates the token (not revoked, use limit not exceeded), adds the
   *  user as a list member (idempotent — already-a-member is not an
   *  error), and bumps the use counter. */
  async acceptInvite(
    token: string,
    userId: string,
  ): Promise<{ listId: string } | { error: 'invalid' | 'exhausted' }> {
    const invite = await invitesDb.getInviteByToken(token);
    if (!invite || invite.revokedAt) return { error: 'invalid' };
    if (invite.maxUses != null && invite.useCount >= invite.maxUses) {
      return { error: 'exhausted' };
    }
    const sql = getSql();
    await sql(
      `INSERT INTO list_members (id, list_id, user_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (list_id, user_id) DO NOTHING`,
      [crypto.randomUUID(), invite.listId, userId, invite.role],
    );
    await sql(`UPDATE list_invites SET use_count = use_count + 1 WHERE id = $1`, [invite.id]);
    return { listId: invite.listId };
  },
};

// ---------------------------------------------------------------------
// movies (global catalog / TMDb cache)
// ---------------------------------------------------------------------

const MOVIE_COLS =
  'id, content_type, title, title_normalized, original_title, title_ua, tmdb_id, poster_url, genres, tmdb_rating, release_year, trailer_key';

export type MovieRow = {
  id: string;
  content_type: string;
  title: string;
  title_normalized: string;
  original_title: string | null;
  title_ua: string | null;
  tmdb_id: number | null;
  poster_url: string | null;
  genres: string[] | null;
  tmdb_rating: string | null;
  release_year: number | null;
  trailer_key: string | null;
};

export type MovieDto = {
  id: string;
  contentType: 'MOVIE' | 'TV';
  title: string;
  titleNormalized: string;
  originalTitle: string | null;
  titleUa: string | null;
  tmdbId: number | null;
  posterUrl: string | null;
  genres: string[] | null;
  tmdbRating: number | null;
  releaseYear: number | null;
  trailerKey: string | null;
};

function rowToMovie(r: MovieRow): MovieDto {
  return {
    id: r.id,
    contentType: r.content_type as 'MOVIE' | 'TV',
    title: r.title,
    titleNormalized: r.title_normalized,
    originalTitle: r.original_title,
    titleUa: r.title_ua,
    tmdbId: r.tmdb_id,
    posterUrl: r.poster_url,
    genres: r.genres,
    tmdbRating: r.tmdb_rating != null ? Number(r.tmdb_rating) : null,
    releaseYear: r.release_year,
    trailerKey: r.trailer_key,
  };
}

export const catalogDb = {
  async getById(id: string): Promise<MovieDto | null> {
    const sql = getSql();
    const rows = await sql(`SELECT ${MOVIE_COLS} FROM movies WHERE id = $1`, [id]);
    const row = rows[0] as MovieRow | undefined;
    return row ? rowToMovie(row) : null;
  },

  async findByTmdbId(tmdbId: number, contentType: 'MOVIE' | 'TV'): Promise<MovieDto | null> {
    const sql = getSql();
    const rows = await sql(
      `SELECT ${MOVIE_COLS} FROM movies WHERE tmdb_id = $1 AND content_type = $2`,
      [tmdbId, contentType],
    );
    const row = rows[0] as MovieRow | undefined;
    return row ? rowToMovie(row) : null;
  },

  /** Free local search over the catalog — no TMDb call. Used as the first
   *  step of /api/search so repeat queries never touch TMDb. */
  async search(query: string, contentType?: 'MOVIE' | 'TV', limit = 20): Promise<MovieDto[]> {
    const sql = getSql();
    const like = `%${normalizeTitle(query)}%`;
    const conditions = [
      `(title_normalized LIKE $1 OR LOWER(COALESCE(title_ua, '')) LIKE $1 OR LOWER(COALESCE(original_title, '')) LIKE $1)`,
    ];
    const values: unknown[] = [like];
    if (contentType) {
      conditions.push(`content_type = $2`);
      values.push(contentType);
    }
    values.push(limit);
    const rows = await sql(
      `SELECT ${MOVIE_COLS} FROM movies WHERE ${conditions.join(' AND ')} ORDER BY title LIMIT $${values.length}`,
      values,
    );
    return (rows as MovieRow[]).map(rowToMovie);
  },

  /** Caches a fresh TMDb lookup into the catalog (or refreshes an
   *  already-cached row's rating/poster) — this is the only place TMDb
   *  metadata is ever written to the DB, and it only ever runs once per
   *  title for the lifetime of the app (see findByTmdbId call sites). */
  async upsertFromTmdb(details: TmdbDetails): Promise<MovieDto> {
    const sql = getSql();
    const title = details.title || details.originalTitle || 'Untitled';
    const rows = await sql(
      `INSERT INTO movies (id, content_type, title, title_normalized, original_title, tmdb_id, poster_url, genres, tmdb_rating, release_year, trailer_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (tmdb_id, content_type) DO UPDATE SET
         tmdb_rating = EXCLUDED.tmdb_rating,
         poster_url = EXCLUDED.poster_url,
         genres = EXCLUDED.genres,
         trailer_key = EXCLUDED.trailer_key,
         updated_at = NOW()
       RETURNING ${MOVIE_COLS}`,
      [
        crypto.randomUUID(),
        details.contentType,
        title,
        normalizeTitle(title),
        details.originalTitle,
        details.tmdbId,
        buildPosterUrl(details.posterPath, 'w342'),
        details.genres ? JSON.stringify(details.genres) : null,
        details.tmdbRating,
        details.releaseYear,
        details.trailerKey,
      ],
    );
    return rowToMovie(rows[0] as MovieRow);
  },

  async createManual(data: {
    contentType: 'MOVIE' | 'TV';
    title: string;
  }): Promise<MovieDto> {
    const sql = getSql();
    const id = crypto.randomUUID();
    const titleNormalized = normalizeTitle(data.title);
    await sql(
      `INSERT INTO movies (id, content_type, title, title_normalized) VALUES ($1, $2, $3, $4)`,
      [id, data.contentType, data.title, titleNormalized],
    );
    return {
      id,
      contentType: data.contentType,
      title: data.title,
      titleNormalized,
      originalTitle: null,
      titleUa: null,
      tmdbId: null,
      posterUrl: null,
      genres: null,
      tmdbRating: null,
      releaseYear: null,
      trailerKey: null,
    };
  },

  async listGenresForList(listId: string): Promise<string[]> {
    const sql = getSql();
    const rows = await sql(
      `SELECT DISTINCT jsonb_array_elements_text(m.genres) AS genre
       FROM list_movies lm
       JOIN movies m ON m.id = lm.movie_id
       WHERE lm.list_id = $1 AND m.genres IS NOT NULL
       ORDER BY genre`,
      [listId],
    );
    return (rows as { genre: string }[]).map((r) => r.genre);
  },
};

// ---------------------------------------------------------------------
// list_movies + list_movie_ratings
// ---------------------------------------------------------------------

export type ListMovieDto = MovieDto & {
  listMovieId: string;
  status: string;
  watchDate: string | null;
  comment: string | null;
  addedBy: string;
  ratings: { userId: string; userName: string | null; avatarUrl: string | null; rating: number | null; ratedBy: string }[];
  avgRating: number | null;
};

type ListMovieRow = MovieRow & {
  list_movie_id: string;
  status: string;
  watch_date: string | Date | null;
  comment_text: string | null;
  added_by: string;
};

function dateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rowToListMovie(r: ListMovieRow): Omit<ListMovieDto, 'ratings' | 'avgRating'> {
  const watchDateValue = r.watch_date instanceof Date ? dateToYYYYMMDD(r.watch_date) : r.watch_date;
  return {
    ...rowToMovie(r),
    listMovieId: r.list_movie_id,
    status: r.status,
    watchDate: watchDateValue,
    comment: r.comment_text,
    addedBy: r.added_by,
  };
}

const LIST_MOVIE_SELECT = `
  lm.id AS list_movie_id, lm.status, lm.watch_date, lm.comment_text, lm.added_by,
  m.id, m.content_type, m.title, m.title_normalized, m.original_title, m.title_ua,
  m.tmdb_id, m.poster_url, m.genres, m.tmdb_rating, m.release_year, m.trailer_key,
  (SELECT AVG(r.rating) FROM list_movie_ratings r WHERE r.list_movie_id = lm.id) AS avg_rating
`;

export const listMoviesDb = {
  async list(
    listId: string,
    params: {
      search?: string;
      status?: string;
      contentType?: 'MOVIE' | 'TV';
      genres?: string[];
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const sql = getSql();
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 50);
    const offset = (page - 1) * limit;
    const sortBy =
      params.sortBy === 'watch_date'
        ? 'lm.watch_date'
        : params.sortBy === 'rating'
          ? 'avg_rating'
          : 'lm.created_at';
    const order = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = ['lm.list_id = $1'];
    const values: unknown[] = [listId];
    let idx = 2;

    if (params.search?.trim()) {
      conditions.push(
        `(LOWER(m.title) LIKE $${idx} OR LOWER(COALESCE(m.original_title, '')) LIKE $${idx} OR LOWER(COALESCE(m.title_ua, '')) LIKE $${idx})`,
      );
      values.push(`%${params.search.trim().toLowerCase()}%`);
      idx++;
    }
    if (params.status) {
      conditions.push(`lm.status = $${idx}`);
      values.push(params.status);
      idx++;
    }
    if (params.contentType) {
      conditions.push(`m.content_type = $${idx}`);
      values.push(params.contentType);
      idx++;
    }
    if (params.genres?.length) {
      conditions.push(`m.genres ?| $${idx}::text[]`);
      values.push(params.genres);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await sql(
      `SELECT COUNT(*)::int AS c FROM list_movies lm JOIN movies m ON m.id = lm.movie_id ${whereClause}`,
      values,
    );
    const total = (countResult[0] as { c: number })?.c ?? 0;

    const nullableOrder =
      sortBy === 'lm.watch_date' || sortBy === 'avg_rating' ? 'NULLS LAST' : '';
    const orderClause = `ORDER BY ${sortBy} ${order} ${nullableOrder}`;
    const rows = await sql(
      `SELECT ${LIST_MOVIE_SELECT} FROM list_movies lm JOIN movies m ON m.id = lm.movie_id
       ${whereClause} ${orderClause} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    const items = (rows as ListMovieRow[]).map(rowToListMovie);
    const ratingsByMovie = await listMoviesDb.ratingsFor(items.map((i) => i.listMovieId));
    const withRatings: ListMovieDto[] = items.map((item) => {
      const ratings = ratingsByMovie.get(item.listMovieId) ?? [];
      const values = ratings.map((r) => r.rating).filter((v): v is number => v != null);
      const avgRating = values.length
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null;
      return { ...item, ratings, avgRating };
    });

    return { items: withRatings, total, page, limit };
  },

  async getById(id: string): Promise<ListMovieDto | null> {
    const sql = getSql();
    const rows = await sql(
      `SELECT ${LIST_MOVIE_SELECT} FROM list_movies lm JOIN movies m ON m.id = lm.movie_id WHERE lm.id = $1`,
      [id],
    );
    const row = rows[0] as ListMovieRow | undefined;
    if (!row) return null;
    const base = rowToListMovie(row);
    const ratingsByMovie = await listMoviesDb.ratingsFor([base.listMovieId]);
    const ratings = ratingsByMovie.get(base.listMovieId) ?? [];
    const values = ratings.map((r) => r.rating).filter((v): v is number => v != null);
    const avgRating = values.length
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null;
    return { ...base, ratings, avgRating };
  },

  /** Which `list_id` a `list_movies.id` belongs to — used by route
   *  handlers to check the caller is actually a member of that list
   *  before allowing reads/writes on it. */
  async getListIdForListMovie(id: string): Promise<string | null> {
    const sql = getSql();
    const rows = await sql(`SELECT list_id FROM list_movies WHERE id = $1`, [id]);
    const row = rows[0] as { list_id: string } | undefined;
    return row?.list_id ?? null;
  },

  async ratingsFor(
    listMovieIds: string[],
  ): Promise<Map<string, { userId: string; userName: string | null; avatarUrl: string | null; rating: number | null; ratedBy: string }[]>> {
    const map = new Map<
      string,
      { userId: string; userName: string | null; avatarUrl: string | null; rating: number | null; ratedBy: string }[]
    >();
    if (listMovieIds.length === 0) return map;
    const sql = getSql();
    const rows = await sql(
      `SELECT r.list_movie_id, r.user_id, r.rating, r.rated_by, u.name AS user_name, u.avatar_url AS avatar_url
       FROM list_movie_ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.list_movie_id = ANY($1::uuid[])`,
      [listMovieIds],
    );
    for (const r of rows as {
      list_movie_id: string;
      user_id: string;
      rating: string | null;
      rated_by: string;
      user_name: string | null;
      avatar_url: string | null;
    }[]) {
      const entry = {
        userId: r.user_id,
        userName: r.user_name,
        avatarUrl: r.avatar_url,
        rating: r.rating != null ? Number(r.rating) : null,
        ratedBy: r.rated_by,
      };
      const existing = map.get(r.list_movie_id);
      if (existing) existing.push(entry);
      else map.set(r.list_movie_id, [entry]);
    }
    return map;
  },

  async findByMovieId(listId: string, movieId: string): Promise<{ id: string } | null> {
    const sql = getSql();
    const rows = await sql(`SELECT id FROM list_movies WHERE list_id = $1 AND movie_id = $2`, [
      listId,
      movieId,
    ]);
    const row = rows[0] as { id: string } | undefined;
    return row ?? null;
  },

  async create(data: {
    listId: string;
    movieId: string;
    status: string;
    watchDate: string | null;
    comment: string | null;
    addedBy: string;
  }): Promise<{ id: string }> {
    const sql = getSql();
    const id = crypto.randomUUID();
    await sql(
      `INSERT INTO list_movies (id, list_id, movie_id, status, watch_date, comment_text, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (list_id, movie_id) DO UPDATE SET
         status = EXCLUDED.status,
         watch_date = EXCLUDED.watch_date,
         comment_text = EXCLUDED.comment_text,
         updated_at = NOW()
       RETURNING id`,
      [id, data.listId, data.movieId, data.status, data.watchDate, data.comment, data.addedBy],
    );
    const rows = await sql(`SELECT id FROM list_movies WHERE list_id = $1 AND movie_id = $2`, [
      data.listId,
      data.movieId,
    ]);
    return rows[0] as { id: string };
  },

  async update(
    id: string,
    data: Partial<{ status: string; watchDate: string | null; comment: string | null }>,
  ): Promise<void> {
    const sql = getSql();
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      updates.push(`${col} = $${i}`);
      values.push(val);
      i++;
    };
    if (data.status !== undefined) set('status', data.status);
    if (data.watchDate !== undefined) set('watch_date', data.watchDate);
    if (data.comment !== undefined) set('comment_text', data.comment);
    if (updates.length === 0) return;
    updates.push('updated_at = NOW()');
    values.push(id);
    await sql(`UPDATE list_movies SET ${updates.join(', ')} WHERE id = $${i}`, values);
  },

  async delete(id: string): Promise<void> {
    const sql = getSql();
    await sql(`DELETE FROM list_movies WHERE id = $1`, [id]);
  },

  async stats(listId: string) {
    const sql = getSql();
    const rows = await sql(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'WATCHED')::int AS watched,
         COUNT(*) FILTER (WHERE status = 'WANT_TO_WATCH')::int AS planned
       FROM list_movies WHERE list_id = $1`,
      [listId],
    );
    const row = rows[0] as { total: number; watched: number; planned: number } | undefined;
    return { total: row?.total ?? 0, watched: row?.watched ?? 0, planned: row?.planned ?? 0 };
  },
};

export const ratingsDb = {
  /** Caller (route handler) is responsible for the permission check —
   *  self, or the list's owner (see api/lists/movies/rating.ts). */
  async setRating(params: {
    listMovieId: string;
    userId: string;
    rating: number | null;
    ratedBy: string;
  }): Promise<void> {
    const sql = getSql();
    if (params.rating == null) {
      await sql(`DELETE FROM list_movie_ratings WHERE list_movie_id = $1 AND user_id = $2`, [
        params.listMovieId,
        params.userId,
      ]);
      return;
    }
    await sql(
      `INSERT INTO list_movie_ratings (id, list_movie_id, user_id, rating, rated_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (list_movie_id, user_id) DO UPDATE SET
         rating = EXCLUDED.rating, rated_by = EXCLUDED.rated_by, updated_at = NOW()`,
      [crypto.randomUUID(), params.listMovieId, params.userId, params.rating, params.ratedBy],
    );
  },
};
