import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from './client';

export const MOVIES_PAGE_SIZE = 50;

export type MovieStatus = 'WATCHED' | 'WANT_TO_WATCH';
export type ListRole = 'owner' | 'member' | 'viewer';

export interface ListSummary {
  id: string;
  name: string;
  ownerId: string;
  role: ListRole;
  createdAt: string;
}

export interface ListMember {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: ListRole;
}

export interface Invite {
  id: string;
  listId: string;
  token: string;
  role: ListRole;
  createdBy: string;
  revokedAt: string | null;
  maxUses: number | null;
  useCount: number;
  createdAt: string;
}

export interface RatingEntry {
  userId: string;
  userName: string | null;
  avatarUrl: string | null;
  rating: number | null;
  ratedBy: string;
}

/** A movie as it appears inside one list — catalog metadata (shared,
 *  cached from TMDb) plus this list's status/date/comment (shared across
 *  members) plus every member's individual rating. */
export interface Movie {
  id: string;
  listMovieId: string;
  contentType: 'MOVIE' | 'TV';
  title: string;
  titleUa: string | null;
  originalTitle: string | null;
  tmdbId: number | null;
  posterUrl: string | null;
  genres: string[] | null;
  tmdbRating: number | null;
  releaseYear: number | null;
  status: MovieStatus;
  watchDate: string | null;
  comment: string | null;
  addedBy: string;
  ratings: RatingEntry[];
  avgRating: number | null;
}

export interface MoviesQueryParams {
  listId: string | null;
  search?: string;
  status?: MovieStatus;
  genres?: string[];
  sortBy?: 'rating' | 'watch_date' | 'created_at';
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

function errorMessage(err: unknown, fallback: string): Error {
  const maybeAxios = err as { response?: { data?: { error?: string } } };
  const message = maybeAxios?.response?.data?.error;
  return new Error(message || fallback);
}

// ---------------------------------------------------------------------
// lists
// ---------------------------------------------------------------------

export function useListsQuery() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: async (): Promise<ListSummary[]> => {
      const { data } = await apiClient.get<{ items: ListSummary[] }>('/lists');
      return data.items;
    },
  });
}

export function useCreateListMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.post<ListSummary>('/lists', { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useRenameListMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; name: string }) => {
      await apiClient.patch('/lists/item', { name: params.name }, { params: { id: params.id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useDeleteListMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete('/lists/item', { params: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useListMembersQuery(listId: string | null) {
  return useQuery({
    queryKey: ['lists', listId, 'members'],
    enabled: Boolean(listId),
    queryFn: async (): Promise<ListMember[]> => {
      const { data } = await apiClient.get<{ items: ListMember[] }>('/lists/members', {
        params: { listId },
      });
      return data.items;
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { listId: string; userId: string }) => {
      await apiClient.delete('/lists/members', { params });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lists', vars.listId, 'members'] });
    },
  });
}

export function useListInvitesQuery(listId: string | null) {
  return useQuery({
    queryKey: ['lists', listId, 'invites'],
    enabled: Boolean(listId),
    queryFn: async (): Promise<Invite[]> => {
      const { data } = await apiClient.get<{ items: Invite[] }>('/lists/invites', {
        params: { listId },
      });
      return data.items;
    },
  });
}

export function useCreateInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const { data } = await apiClient.post<Invite>('/lists/invites', { listId });
      return data;
    },
    onSuccess: (_data, listId) => {
      queryClient.invalidateQueries({ queryKey: ['lists', listId, 'invites'] });
    },
  });
}

export function useRevokeInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; listId: string }) => {
      await apiClient.delete('/lists/invites', { params });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lists', vars.listId, 'invites'] });
    },
  });
}

// ---------------------------------------------------------------------
// movies within a list
// ---------------------------------------------------------------------

async function fetchMoviesPage(
  params: MoviesQueryParams,
  page: number,
): Promise<MoviesPageResult> {
  const limit = MOVIES_PAGE_SIZE;
  const { data } = await apiClient.get<{ items: Movie[]; total: number }>('/lists/movies', {
    params: {
      listId: params.listId,
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
    queryKey: ['lists', params.listId, 'movies', params],
    enabled: Boolean(params.listId),
    queryFn: () => fetchMoviesPage(params, params.page ?? 1),
  });
}

export function useMoviesInfiniteQuery(params: Omit<MoviesQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['lists', params.listId, 'movies', 'infinite', params],
    enabled: Boolean(params.listId),
    queryFn: ({ pageParam }) => fetchMoviesPage(params, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

export type LibraryStats = { total: number; watched: number; planned: number };

export function useLibraryStatsQuery(listId: string | null) {
  return useQuery({
    queryKey: ['lists', listId, 'stats'],
    enabled: Boolean(listId),
    queryFn: async (): Promise<LibraryStats> => {
      const { data } = await apiClient.get<LibraryStats>('/lists/movies/stats', {
        params: { listId },
      });
      return data;
    },
  });
}

export function useGenresQuery(listId: string | null) {
  return useQuery({
    queryKey: ['lists', listId, 'genres'],
    enabled: Boolean(listId),
    queryFn: async (): Promise<string[]> => {
      const { data } = await apiClient.get<{ genres: string[] }>('/lists/movies/genres', {
        params: { listId },
      });
      return data.genres;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface AddMoviePayload {
  listId: string;
  movieId?: string;
  tmdbId?: number;
  contentType?: 'MOVIE' | 'TV';
  title?: string;
  status: MovieStatus;
  watchDate?: string | null;
  comment?: string | null;
  rating?: number | null;
}

export function useCreateMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddMoviePayload) => {
      try {
        await apiClient.post('/lists/movies', payload);
      } catch (err) {
        throw errorMessage(err, 'Failed to save the movie.');
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lists', vars.listId] });
    },
  });
}

export function useUpdateMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      listId: string;
      payload: { status?: string; watchDate?: string | null; comment?: string | null; rating?: number | null };
    }) => {
      try {
        await apiClient.patch('/lists/movies/item', params.payload, {
          params: { id: params.id },
        });
      } catch (err) {
        throw errorMessage(err, 'Failed to update the movie.');
      }
      return null;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lists', vars.listId] });
    },
  });
}

export function useSetRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      listMovieId: string;
      userId: string;
      rating: number | null;
      listId: string;
    }) => {
      try {
        await apiClient.patch('/lists/movies/rating', {
          listMovieId: params.listMovieId,
          userId: params.userId,
          rating: params.rating,
        });
      } catch (err) {
        throw errorMessage(err, 'Failed to save the rating.');
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lists', vars.listId] });
    },
  });
}

export function useDeleteMovieMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; listId: string }) => {
      try {
        await apiClient.delete('/lists/movies/item', { params: { id: params.id } });
      } catch (err) {
        throw errorMessage(err, 'Failed to delete the movie.');
      }
      return null;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lists', vars.listId] });
    },
  });
}
