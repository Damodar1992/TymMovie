import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from './client';

export const MOVIES_PAGE_SIZE = 50;

export type MovieStatus = 'WATCHED' | 'WANT_TO_WATCH';

export interface Movie {
  id: string;
  contentType: 'MOVIE' | 'TV';
  title: string;
  titleUa: string | null;
  originalTitle: string | null;
  tmdbId: number | null;
  posterUrl: string | null;
  genres: string[] | null;
  tmdbRating: number | null;
  releaseYear: number | null;
  innaRating: number | null;
  bogdanRating: number | null;
  userAvgRating: number | null;
  comment: string | null;
  status: MovieStatus;
  watchDate: string | null;
}

export interface MoviesQueryParams {
  search?: string;
  status?: MovieStatus;
  genres?: string[];
  sortBy?: 'user_avg_rating' | 'watch_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  contentType?: 'MOVIE' | 'TV';
  page?: number;
}

export type MoviesPageResult = {
  items: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function fetchMoviesPage(
  params: MoviesQueryParams,
  page: number,
): Promise<MoviesPageResult> {
  const limit = MOVIES_PAGE_SIZE;
  const { data } = await apiClient.get<{ items: Movie[]; total: number }>('/movies', {
    params: {
      search: params.search,
      status: params.status,
      contentType: params.contentType,
      genres: params.genres?.length ? params.genres.join(',') : undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      page,
    },
  });
  const total = data.total;
  const totalPages = Math.ceil(total / limit) || 1;
  return { items: data.items, total, page, limit, totalPages };
}

export function useMoviesQuery(params: MoviesQueryParams) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: () => fetchMoviesPage(params, params.page ?? 1),
  });
}

export function useMoviesInfiniteQuery(params: Omit<MoviesQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['movies', 'infinite', params],
    queryFn: ({ pageParam }) => fetchMoviesPage(params, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

/** Hardcoded household size — there is no users table in the schema. */
export const LIBRARY_MEMBER_COUNT = 3;

export type LibraryStats = {
  total: number;
  watched: number;
  planned: number;
  members: number;
};

export function useLibraryStatsQuery() {
  return useQuery({
    queryKey: ['movies', 'library-stats'],
    queryFn: async (): Promise<LibraryStats> => {
      const { data } = await apiClient.get<{ total: number; watched: number; planned: number }>(
        '/movies/stats',
      );
      return { ...data, members: LIBRARY_MEMBER_COUNT };
    },
  });
}

/** Distinct genres across the whole catalog (server-side), not just the
 *  currently-loaded page — see api/movies/genres.ts. */
export function useGenresQuery() {
  return useQuery({
    queryKey: ['movies', 'genres'],
    queryFn: async (): Promise<string[]> => {
      const { data } = await apiClient.get<{ genres: string[] }>('/movies/genres');
      return data.genres;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function errorMessage(err: unknown, fallback: string): Error {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  const message = maybeAxios?.response?.data?.error;
  return new Error(message || fallback);
}

export function useCreateMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      contentType: 'MOVIE' | 'TV';
      title: string;
      originalTitle: string | null;
      titleUa?: string | null;
      tmdbId: number | null;
      posterUrl: string | null;
      genres: string[] | null;
      tmdbRating: number | null;
      releaseYear: number | null;
      status: MovieStatus;
      watchDate: string | null;
      innaRating: number | null;
      bogdanRating: number | null;
      comment?: string | null;
    }) => {
      try {
        await apiClient.post('/movies', payload);
      } catch (err) {
        throw errorMessage(err, 'Failed to save the movie.');
      }
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
      try {
        await apiClient.patch(`/movies/${params.id}`, params.payload);
      } catch (err) {
        throw errorMessage(err, 'Failed to update the movie.');
      }
      return null;
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
      try {
        await apiClient.delete(`/movies/${id}`);
      } catch (err) {
        throw errorMessage(err, 'Failed to delete the movie.');
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}
