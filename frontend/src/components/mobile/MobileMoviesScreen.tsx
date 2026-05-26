import { useState } from 'react';
import { useMoviesQuery } from '../../api/movies';
import type { Movie } from '../../api/movies';
import { useAuth } from '../../auth/AuthContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import { MovieCard } from '../MovieCard';
import { MobileMovieForm } from './movie-form/MobileMovieForm';
import { SearchInput } from '../SearchInput';
import { EmptyState } from '../EmptyState';

const PAGE_SIZE = 50;

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
    page,
    setPage,
  } = useMoviesFilters();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const { data, isLoading, isError } = useMoviesQuery({
    search: search || undefined,
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
    page,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;
  const hasMore = currentPage < totalPages;

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

          <div className="mobile-pagination">
            <span className="pagination-info">
              {items.length} of {total}
            </span>
            {hasMore && total > PAGE_SIZE ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Load next page
              </button>
            ) : null}
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
