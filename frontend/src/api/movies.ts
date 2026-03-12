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

export function useMoviesQuery(params: MoviesQueryParams) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      const response = await apiClient.get('/movies', { params });
      return response.data as { items: Movie[]; total: number };
    },
  });
}

export function useCreateMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const response = await apiClient.post('/movies', payload);
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

