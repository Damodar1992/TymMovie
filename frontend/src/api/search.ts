import { apiClient } from './client';

/** Thin client for /api/search — catalog-first, TMDb only as a fallback
 *  (see the server-side handler and the project's db-multi-user-
 *  architecture doc, §6). The TMDb API key never reaches the browser. */
export type SearchContentType = 'MOVIE' | 'TV';

export interface SearchResult {
  movieId: string | null;
  inCatalog: boolean;
  tmdbId: number | null;
  contentType: SearchContentType;
  title: string;
  originalTitle: string | null;
  year: number | null;
  posterUrl: string | null;
  tmdbRating: number | null;
  genres: string[] | null;
  trailerKey: string | null;
}

export async function search(
  query: string,
  language: string = 'uk-UA',
  contentType?: SearchContentType,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<{ results: SearchResult[] }>('/search', {
    params: { q: trimmed, language, contentType },
  });
  return data.results;
}
