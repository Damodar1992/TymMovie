import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export type MovieStatus = 'WATCHED' | 'WANT_TO_WATCH';

export interface Movie {
  id: string;
  title: string;
  originalTitle: string | null;
  imdbId: string | null;
  posterUrl: string | null;
  genres: string[] | null;
  imdbRating: number | null;
  innaRating: number | null;
  bogdanRating: number | null;
  userAvgRating: number | null;
  status: MovieStatus;
  watchDate: string | null;
}

export interface MoviesQueryParams {
  search?: string;
  status?: MovieStatus;
  genres?: string[];
  sortBy?: 'watch_date' | 'status' | 'user_avg_rating';
  sortOrder?: 'asc' | 'desc';
}

export interface EnrichedMetadata {
  title: string | null;
  originalTitle: string | null;
  imdbId: string | null;
  posterUrl: string | null;
  genres: string[] | null;
  imdbRating: number | null;
  year: number | null;
  source: string;
}

function snakeToCamelMovie(r: Record<string, unknown>): Record<string, unknown> {
  return {
    id: r.id,
    title: r.title,
    originalTitle: r.original_title ?? r.originalTitle ?? null,
    imdbId: r.imdb_id ?? r.imdbId ?? null,
    posterUrl: r.poster_url ?? r.posterUrl ?? null,
    genres: r.genres ?? null,
    imdbRating: r.imdb_rating != null ? Number(r.imdb_rating) : (r.imdbRating != null ? Number(r.imdbRating) : null),
    innaRating: r.inna_rating != null ? Number(r.inna_rating) : (r.innaRating != null ? Number(r.innaRating) : null),
    bogdanRating: r.bogdan_rating != null ? Number(r.bogdan_rating) : (r.bogdanRating != null ? Number(r.bogdanRating) : null),
    userAvgRating: r.user_avg_rating != null ? Number(r.user_avg_rating) : (r.userAvgRating != null ? Number(r.userAvgRating) : null),
    status: r.status,
    watchDate: r.watch_date ?? r.watchDate ?? null,
  };
}

export function useMoviesQuery(params: MoviesQueryParams) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'list-request',
          hypothesisId: 'H1',
          location: 'movies.ts:useMoviesQuery:before-get',
          message: 'Fetching movies list',
          data: { params, baseURL: (apiClient as { defaults?: { baseURL?: string } }).defaults?.baseURL },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
      let response;
      try {
        response = await apiClient.get('/movies', { params });
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
          body: JSON.stringify({
            sessionId: 'fdb080',
            runId: 'list-error',
            hypothesisId: 'H2',
            location: 'movies.ts:useMoviesQuery:get-catch',
            message: 'List request failed',
            data: { message: (err as Error).message, name: (err as Error).name },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion agent log
        throw err;
      }
      if (!response.status || response.status < 200 || response.status >= 300) {
        const msg = (response.data as { message?: string })?.message || `Request failed (${response.status})`;
        throw new Error(msg);
      }
      const raw = response.data as { items?: Movie[]; total?: number } | Movie[] | Record<string, unknown>;
      // Normalize: API may return { items, total }, a real array, or an array-like object (numeric keys "0","1",...)
      let items: Movie[];
      let total: number;
      if (Array.isArray(raw)) {
        items = raw;
        total = raw.length;
      } else if (raw != null && typeof raw === 'object' && 'items' in raw && Array.isArray((raw as { items: unknown }).items)) {
        items = (raw as { items: Movie[] }).items;
        total = (raw as { total?: number }).total ?? items.length;
      } else if (raw != null && typeof raw === 'object' && '0' in raw) {
        items = Object.values(raw) as Movie[];
        total = items.length;
      } else {
        items = [];
        total = (raw as { total?: number })?.total ?? 0;
      }
      // If items have snake_case keys (e.g. title_normalized), map to camelCase
      if (items.length > 0 && items[0] != null && !('titleNormalized' in items[0]) && 'title_normalized' in (items[0] as Record<string, unknown>)) {
        items = items.map((m) => snakeToCamelMovie(m as Record<string, unknown>)) as Movie[];
      }
      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'list-response',
          hypothesisId: 'H2',
          location: 'movies.ts:useMoviesQuery:after-get',
          message: 'List response received',
          data: {
            status: response.status,
            hasItems: Array.isArray((raw as { items?: unknown })?.items),
            rawIsArray: Array.isArray(raw),
            itemsLength: items.length,
            total,
            keys: raw && !Array.isArray(raw) ? Object.keys(raw).slice(0, 20) : [],
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
      return { items, total };
    },
  });
}

export function useCreateMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      // #region agent log
      fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
        body: JSON.stringify({
          sessionId: 'fdb080',
          runId: 'create-request',
          hypothesisId: 'H1',
          location: 'movies.ts:useCreateMovieMutation:before-post',
          message: 'Create movie request',
          data: { payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload as object) : [] },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
      let response;
      try {
        response = await apiClient.post('/movies', payload);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
          body: JSON.stringify({
            sessionId: 'fdb080',
            runId: 'create-error',
            hypothesisId: 'H2',
            location: 'movies.ts:useCreateMovieMutation:post-catch',
            message: 'Create request failed',
            data: { message: (err as Error).message, name: (err as Error).name, hasResponse: !!(err as { response?: unknown }).response, status: (err as { response?: { status?: number } }).response?.status },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion agent log
        throw err;
      }
      if (response.status < 200 || response.status >= 300) {
        // #region agent log
        fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fdb080' },
          body: JSON.stringify({
            sessionId: 'fdb080',
            runId: 'create-bad-status',
            hypothesisId: 'H2',
            location: 'movies.ts:useCreateMovieMutation:non-2xx',
            message: 'Create API returned error status',
            data: { status: response.status, message: (response.data as { message?: string })?.message },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion agent log
        const msg = (response.data as { message?: string })?.message || `Request failed (${response.status})`;
        throw new Error(msg);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export function useUpdateMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; payload: unknown }) => {
      const response = await apiClient.put(`/movies/${params.id}`, params.payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export function useDeleteMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/movies/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export async function enrichMovieByTitle(title: string): Promise<EnrichedMetadata | null> {
  const response = await apiClient.get('/movies/enrich', { params: { title } });
  return response.data;
}

