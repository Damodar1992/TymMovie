const TMDB_BASE = 'https://api.themoviedb.org/3';

/** Detail lookups are only needed to read genres for filtering; cap them so
 *  one search click can't fan out into dozens of TMDb requests. */
const MAX_DETAIL_LOOKUPS = 12;

export type TmdbContentType = 'MOVIE' | 'TV';

export interface TmdbSearchResult {
  tmdbId: number;
  contentType: TmdbContentType;
  title: string;
  year: number | null;
  posterPath: string | null;
  tmdbRating: number | null;
  genres: string[] | null;
  trailerKey: string | null;
}

export interface TmdbDetails {
  tmdbId: number;
  contentType: TmdbContentType;
  title: string;
  originalTitle: string | null;
  titleUa: string | null;
  releaseYear: number | null;
  tmdbRating: number | null;
  genres: string[] | null;
  posterPath: string | null;
  /** YouTube video id of the best available trailer, or null if TMDb has
   *  none for this title (common for older/obscure titles). See
   *  pickBestTrailerKey() below for the selection rule. */
  trailerKey: string | null;
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
}

/** Picks the single best trailer out of a TMDb `videos.results` array —
 *  see the project's trailer-link-feature doc for the rationale: only
 *  YouTube (we only ever link to YouTube), prefer type "Trailer" over
 *  "Teaser"/"Clip"/etc., prefer official uploads, and among ties prefer
 *  the most recently published. Returns null when nothing usable is
 *  found — the UI simply hides the trailer button in that case. */
export function pickBestTrailerKey(videos: TmdbVideo[] | undefined): string | null {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  const youtube = videos.filter((v) => v.site === 'YouTube' && v.key);
  if (youtube.length === 0) return null;

  const byRecency = (a: TmdbVideo, b: TmdbVideo) =>
    (b.published_at ?? '').localeCompare(a.published_at ?? '');

  const pickOfType = (type: string): TmdbVideo | null => {
    const ofType = youtube.filter((v) => v.type === type);
    if (ofType.length === 0) return null;
    const official = ofType.filter((v) => v.official);
    const pool = official.length > 0 ? official : ofType;
    return [...pool].sort(byRecency)[0] ?? null;
  };

  const best = pickOfType('Trailer') ?? pickOfType('Teaser');
  return best?.key ?? null;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

/** Builds a full poster URL from a TMDb poster_path — used server-side now
 *  that caching a title into the `movies` catalog happens on the backend
 *  (see api/_lib/db.ts upsertMovieFromTmdb), not just client-side. */
export function buildPosterUrl(
  posterPath: string | null,
  size: 'w92' | 'w342' | 'w500' = 'w342',
): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}${size}${posterPath}`;
}

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY is not set on the server');
  return key;
}

async function authFetch(path: string): Promise<Response> {
  const url = `${TMDB_BASE}${path}`;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      accept: 'application/json',
    },
  });
}

export async function searchMulti(
  query: string,
  language: string = 'uk-UA',
): Promise<TmdbSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const params = new URLSearchParams({
    query: trimmed,
    include_adult: 'false',
    language,
    page: '1',
  });
  const res = await authFetch(`/search/multi?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to search TMDb');
  const data = (await res.json()) as { results?: unknown[] };
  const results = Array.isArray(data.results) ? data.results : [];
  const mapped = results
    .map((raw) => raw as Record<string, unknown>)
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r) => {
      const isMovie = r.media_type === 'movie';
      const id = Number(r.id);
      const title = (isMovie ? (r.title as string) : (r.name as string)) ?? '';
      const date =
        (isMovie ? (r.release_date as string) : (r.first_air_date as string)) ?? '';
      const year =
        typeof date === 'string' && date.length >= 4 ? Number(date.slice(0, 4)) : null;
      const posterPath = (r.poster_path as string | undefined) ?? null;
      const voteAvg = r.vote_average as number | undefined;
      const rating = typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
      return {
        tmdbId: id,
        contentType: isMovie ? 'MOVIE' : 'TV',
        title,
        year,
        posterPath,
        tmdbRating: rating,
        genres: null,
        trailerKey: null,
      } as TmdbSearchResult;
    });

  // Keep only entries with a real TMDb rating, most relevant first, capped
  // before we spend a detail request on each one just to read its genres.
  const rated = mapped
    .filter((r) => r.tmdbRating != null && r.tmdbRating > 0)
    .slice(0, MAX_DETAIL_LOOKUPS);

  const withGenres = await Promise.all(
    rated.map(async (r) => {
      try {
        const details =
          r.contentType === 'MOVIE'
            ? await getMovieDetails(r.tmdbId)
            : await getTvDetails(r.tmdbId);
        return { ...r, genres: details.genres, trailerKey: details.trailerKey };
      } catch {
        return { ...r, genres: null };
      }
    }),
  );

  return withGenres.filter((r) => Array.isArray(r.genres) && r.genres.length > 0);
}

export async function getMovieDetails(id: number): Promise<TmdbDetails> {
  // append_to_response=videos folds the trailer lookup into this same
  // request — no extra TMDb call, and it only ever runs once per title
  // (see catalogDb.upsertFromTmdb call sites). include_video_language
  // widens the videos list beyond just en-US-tagged entries.
  const [enRes, ukRes] = await Promise.all([
    authFetch(
      `/movie/${id}?language=en-US&append_to_response=videos&include_video_language=en,uk,null`,
    ),
    authFetch(`/movie/${id}?language=uk-UA`),
  ]);
  if (!enRes.ok) throw new Error('Failed to load movie details');
  const d = (await enRes.json()) as {
    id: number;
    title?: string;
    original_title?: string;
    release_date?: string;
    vote_average?: number;
    genres?: { name: string }[];
    poster_path?: string;
    videos?: { results?: TmdbVideo[] };
  };
  let titleUa: string | null = null;
  if (ukRes.ok) {
    const uk = (await ukRes.json()) as { title?: string };
    titleUa = uk.title?.trim() || null;
  }
  const releaseDate = d.release_date ?? '';
  const year =
    typeof releaseDate === 'string' && releaseDate.length >= 4
      ? Number(releaseDate.slice(0, 4))
      : null;
  const voteAvg = d.vote_average;
  const rating = typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
  const genres = Array.isArray(d.genres) ? d.genres.map((g) => g.name) : null;
  return {
    tmdbId: d.id,
    contentType: 'MOVIE',
    title: d.title ?? '',
    originalTitle: d.original_title ?? d.title ?? null,
    titleUa,
    releaseYear: year,
    tmdbRating: rating,
    genres,
    posterPath: d.poster_path ?? null,
    trailerKey: pickBestTrailerKey(d.videos?.results),
  };
}

export async function getTvDetails(id: number): Promise<TmdbDetails> {
  const [enRes, ukRes] = await Promise.all([
    authFetch(
      `/tv/${id}?language=en-US&append_to_response=videos&include_video_language=en,uk,null`,
    ),
    authFetch(`/tv/${id}?language=uk-UA`),
  ]);
  if (!enRes.ok) throw new Error('Failed to load TV details');
  const d = (await enRes.json()) as {
    id: number;
    name?: string;
    original_name?: string;
    first_air_date?: string;
    vote_average?: number;
    genres?: { name: string }[];
    poster_path?: string;
    videos?: { results?: TmdbVideo[] };
  };
  let titleUa: string | null = null;
  if (ukRes.ok) {
    const uk = (await ukRes.json()) as { name?: string };
    titleUa = uk.name?.trim() || null;
  }
  const firstAirDate = d.first_air_date ?? '';
  const year =
    typeof firstAirDate === 'string' && firstAirDate.length >= 4
      ? Number(firstAirDate.slice(0, 4))
      : null;
  const voteAvg = d.vote_average;
  const rating = typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
  const genres = Array.isArray(d.genres) ? d.genres.map((g) => g.name) : null;
  return {
    tmdbId: d.id,
    contentType: 'TV',
    title: d.name ?? '',
    originalTitle: d.original_name ?? d.name ?? null,
    titleUa,
    releaseYear: year,
    tmdbRating: rating,
    genres,
    posterPath: d.poster_path ?? null,
    trailerKey: pickBestTrailerKey(d.videos?.results),
  };
}
