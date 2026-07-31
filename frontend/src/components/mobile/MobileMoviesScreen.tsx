import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMoviesInfiniteQuery, type Movie } from '../../api/movies';
import { useAuth } from '../../auth/AuthContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { MovieCard } from '../MovieCard';
import { MobileMovieForm } from './movie-form/MobileMovieForm';
import { SearchInput } from '../SearchInput';
import { EmptyState } from '../EmptyState';

export function MobileMoviesScreen() {
  const { isReadOnly } = useAuth();
  const {
    search,
    setSearch,
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
    titleLang,
  } = useMoviesFilters();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null);

  useEffect(() => {
    setScrollRoot(document.querySelector('.mobile-content'));
  }, []);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMoviesInfiniteQuery({
    search: search || undefined,
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: Boolean(hasNextPage) && items.length > 0 && scrollRoot != null,
    root: scrollRoot,
  });

  return (
    <div className="mobile-screen mobile-screen-movies">
      <div className="mobile-search-row">
        <SearchInput value={search} onChange={setSearch} />
      </div>

      {isError ? (
        <div className="error-banner">Failed to load movies. Please try again.</div>
      ) : null}

      {isLoading ? (
        <EmptyState title="Loading…" description="Please wait." />
      ) : items.length === 0 ? (
        <EmptyState
          title="No titles found"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          <div className="mobile-movie-list">
            {items.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                titleLang={titleLang}
                onEdit={(m) => {
                  if (isReadOnly) return;
                  setEditingMovieId(m.id);
                  setEditingMovie(m);
                  setIsFormOpen(true);
                }}
              />
            ))}
          </div>

          <div
            ref={sentinelRef}
            className="infinite-scroll-sentinel"
            aria-hidden
          />

          <div className="infinite-scroll-status" aria-live="polite">
            {isFetchingNextPage
              ? 'Loading more…'
              : `${items.length} of ${total}`}
          </div>
        </>
      )}

      {!isReadOnly ? (
        <MobileMovieForm
          key={editingMovieId ?? 'new-edit'}
          open={isFormOpen}
          movieId={editingMovieId}
          initialMovie={editingMovie}
          onClose={() => {
            setIsFormOpen(false);
            setEditingMovieId(null);
            setEditingMovie(null);
          }}
        />
      ) : null}
    </div>
  );
}
