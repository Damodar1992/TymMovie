import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, computeUserAvgRating, normalizeTitle } from '../../lib/db';
import {
  searchMulti,
  getMovieDetails,
  getTvDetails,
  type TmdbDetails,
} from '../../lib/tmdb';

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

export interface EnrichedMetadata {
  tmdb: TmdbDetails;
}

export function useMoviesQuery(params: MoviesQueryParams) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      try {
        const page = params.page ?? 1;
        const limit = 50;
        const result = await db.list({
          search: params.search,
          status: params.status,
          contentType: params.contentType,
          genres: params.genres,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          page,
          limit,
        });
        const items = result.items as Movie[];
        const total = result.total;
        const totalPages = Math.ceil(total / limit) || 1;
        return { items, total, page, limit, totalPages };
      } catch (err) {
        throw err;
      }
    },
  });
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
    }) => {
      try {
        const userAvgRating = computeUserAvgRating(
          payload.innaRating,
          payload.bogdanRating,
        );
        const titleNormalized = normalizeTitle(payload.title);
        const duplicate = await db.findDuplicate({
          tmdbId: payload.tmdbId,
          contentType: payload.contentType,
        });
        if (duplicate) {
          throw new Error(
            'An entry with the same TMDb id and type already exists.',
          );
        }
        await db.create({
          contentType: payload.contentType,
          title: payload.title,
          titleNormalized,
          status: payload.status,
          watchDate: payload.watchDate,
          innaRating: payload.innaRating,
          bogdanRating: payload.bogdanRating,
          userAvgRating,
          originalTitle: payload.originalTitle,
          titleUa: payload.titleUa ?? null,
          tmdbId: payload.tmdbId,
          posterUrl: payload.posterUrl,
          genres: payload.genres,
          tmdbRating: payload.tmdbRating,
          releaseYear: payload.releaseYear,
        });
      } catch (err) {
        throw err;
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
      const p = params.payload as {
        status: MovieStatus;
        watchDate: string | null;
        innaRating: number | null;
        bogdanRating: number | null;
      };
      const userAvgRating = computeUserAvgRating(p.innaRating, p.bogdanRating);
      await db.update(params.id, {
        status: p.status,
        watchDate: p.watchDate,
        innaRating: p.innaRating,
        bogdanRating: p.bogdanRating,
        userAvgRating,
      });
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
      await db.delete(id);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export async function enrichMovieByTitle(title: string): Promise<EnrichedMetadata | null> {
  const results = await searchMulti(title);
  if (results.length === 0) return null;
  const first = results[0];
  const details: TmdbDetails =
    first.contentType === 'MOVIE'
      ? await getMovieDetails(first.tmdbId)
      : await getTvDetails(first.tmdbId);
  return { tmdb: details };
}

