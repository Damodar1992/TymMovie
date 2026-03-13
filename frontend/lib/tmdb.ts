const TMDB_BASE = 'https://api.themoviedb.org/3';

export type TmdbContentType = 'MOVIE' | 'TV';

export interface TmdbSearchResult {
  tmdbId: number;
  contentType: TmdbContentType;
  title: string;
  year: number | null;
  posterPath: string | null;
  tmdbRating: number | null;
  genres: string[] | null;
}

export interface TmdbDetails {
  tmdbId: number;
  contentType: TmdbContentType;
  title: string;
  originalTitle: string | null;
  releaseYear: number | null;
  tmdbRating: number | null;
  genres: string[] | null;
  posterPath: string | null;
}

let imageBaseUrl: string | null = null;

function getApiKey(): string | null {
  const key = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  return key?.trim() || null;
}

async function authFetch(path: string): Promise<Response> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('TMDb API key is not configured');
  const url = `${TMDB_BASE}${path}`;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      accept: 'application/json',
    },
  });
}

export async function loadImageConfig(): Promise<string> {
  if (imageBaseUrl) return imageBaseUrl;
  const res = await authFetch('/configuration');
  if (!res.ok) throw new Error('Failed to load TMDb configuration');
  const data = (await res.json()) as {
    images?: { secure_base_url?: string; base_url?: string };
  };
  imageBaseUrl =
    data.images?.secure_base_url ??
    data.images?.base_url ??
    'https://image.tmdb.org/t/p/';
  return imageBaseUrl!;
}

export async function searchMulti(query: string): Promise<TmdbSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const params = new URLSearchParams({
    query: trimmed,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });
  const res = await authFetch(`/search/multi?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to search TMDb');
  const data = (await res.json()) as { results?: unknown[] };
  const results = Array.isArray(data.results) ? data.results : [];
  const mapped = results
    .map((raw) => raw as Record<string, unknown>)
    .filter(
      (r) => r.media_type === 'movie' || r.media_type === 'tv',
    )
    .map((r) => {
      const isMovie = r.media_type === 'movie';
      const id = Number(r.id);
      const title = (isMovie ? (r.title as string) : (r.name as string)) ?? '';
      const date =
        (isMovie ? (r.release_date as string) : (r.first_air_date as string)) ??
        '';
      const year =
        typeof date === 'string' && date.length >= 4
          ? Number(date.slice(0, 4))
          : null;
      const posterPath = (r.poster_path as string | undefined) ?? null;
      const voteAvg = r.vote_average as number | undefined;
      const rating =
        typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
      return {
        tmdbId: id,
        contentType: isMovie ? 'MOVIE' : 'TV',
        title,
        year,
        posterPath,
        tmdbRating: rating,
        genres: null,
      } as TmdbSearchResult;
    });
  // First, keep only entries where TMDb rating is present and > 0
  const rated = mapped.filter((r) => r.tmdbRating != null && r.tmdbRating > 0);

  // Then load details in parallel to populate genres and drop entries without genres
  const withGenres = await Promise.all(
    rated.map(async (r) => {
      try {
        const details =
          r.contentType === 'MOVIE'
            ? await getMovieDetails(r.tmdbId)
            : await getTvDetails(r.tmdbId);
        return { ...r, genres: details.genres };
      } catch {
        return { ...r, genres: null };
      }
    }),
  );

  return withGenres.filter(
    (r) => Array.isArray(r.genres) && r.genres.length > 0,
  );
}

export async function getMovieDetails(id: number): Promise<TmdbDetails> {
  const res = await authFetch(`/movie/${id}?language=en-US`);
  if (!res.ok) throw new Error('Failed to load movie details');
  const d = (await res.json()) as {
    id: number;
    title?: string;
    original_title?: string;
    release_date?: string;
    vote_average?: number;
    genres?: { name: string }[];
    poster_path?: string;
  };
  const releaseDate = d.release_date ?? '';
  const year =
    typeof releaseDate === 'string' && releaseDate.length >= 4
      ? Number(releaseDate.slice(0, 4))
      : null;
  const voteAvg = d.vote_average;
  const rating =
    typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
  const genres = Array.isArray(d.genres) ? d.genres.map((g) => g.name) : null;
  return {
    tmdbId: d.id,
    contentType: 'MOVIE',
    title: d.title ?? '',
    originalTitle: d.original_title ?? d.title ?? null,
    releaseYear: year,
    tmdbRating: rating,
    genres,
    posterPath: d.poster_path ?? null,
  };
}

export async function getTvDetails(id: number): Promise<TmdbDetails> {
  const res = await authFetch(`/tv/${id}?language=en-US`);
  if (!res.ok) throw new Error('Failed to load TV details');
  const d = (await res.json()) as {
    id: number;
    name?: string;
    original_name?: string;
    first_air_date?: string;
    vote_average?: number;
    genres?: { name: string }[];
    poster_path?: string;
  };
  const firstAirDate = d.first_air_date ?? '';
  const year =
    typeof firstAirDate === 'string' && firstAirDate.length >= 4
      ? Number(firstAirDate.slice(0, 4))
      : null;
  const voteAvg = d.vote_average;
  const rating =
    typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
  const genres = Array.isArray(d.genres) ? d.genres.map((g) => g.name) : null;
  return {
    tmdbId: d.id,
    contentType: 'TV',
    title: d.name ?? '',
    originalTitle: d.original_name ?? d.name ?? null,
    releaseYear: year,
    tmdbRating: rating,
    genres,
    posterPath: d.poster_path ?? null,
  };
}

export async function buildPosterUrl(
  posterPath: string | null,
  size: 'w342' | 'w500' = 'w342',
): Promise<string | null> {
  if (!posterPath) return null;
  const base = await loadImageConfig();
  return `${base}${size}${posterPath}`;
}
