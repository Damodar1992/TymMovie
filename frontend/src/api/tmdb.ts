import { apiClient } from './client';

/**
 * Thin client for our own /api/tmdb/* proxy. The TMDb API key never reaches
 * the browser — it lives server-side in api/_lib/tmdb.ts.
 */

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

export async function searchMulti(
  query: string,
  language: string = 'uk-UA',
): Promise<TmdbSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<{ results: TmdbSearchResult[] }>('/tmdb/search', {
    params: { q: trimmed, language },
  });
  return data.results;
}

export async function getMovieDetails(id: number): Promise<TmdbDetails> {
  const { data } = await apiClient.get<TmdbDetails>('/tmdb/details', {
    params: { type: 'MOVIE', id },
  });
  return data;
}

export async function getTvDetails(id: number): Promise<TmdbDetails> {
  const { data } = await apiClient.get<TmdbDetails>('/tmdb/details', {
    params: { type: 'TV', id },
  });
  return data;
}

/** TMDb's image CDN base is a stable public constant — no API key or
 *  network round-trip needed to build a poster URL from a poster_path. */
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

export function buildPosterUrl(
  posterPath: string | null,
  size: 'w92' | 'w342' | 'w500' = 'w342',
): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}${size}${posterPath}`;
}
