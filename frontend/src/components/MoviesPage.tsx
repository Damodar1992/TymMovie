import { useState } from 'react';
import { useMoviesQuery } from '../api/movies';
import type { Movie, MovieStatus, MoviesQueryParams } from '../api/movies';
import { MovieGrid } from './MovieGrid';
import { MovieFormModal } from './MovieFormModal';
import { FiltersBar } from './FiltersBar';
import { SortControl } from './SortControl';
import { SearchInput } from './SearchInput';
import { EmptyState } from './EmptyState';

export function MoviesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MovieStatus | undefined>();
  const [genres, setGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] =
    useState<MoviesQueryParams['sortBy']>('user_avg_rating');
  const [sortOrder, setSortOrder] =
    useState<MoviesQueryParams['sortOrder']>('desc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const { data, isLoading, isError } = useMoviesQuery({
    search: search || undefined,
    status,
    genres,
    sortBy,
    sortOrder,
  });

  const items = data?.items ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <h1>Shared Movie Tracker</h1>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setEditingMovieId(null);
            setEditingMovie(null);
            setIsFormOpen(true);
          }}
        >
          Add Movie
        </button>
      </header>

      <section className="controls-row">
        <SearchInput value={search} onChange={setSearch} />
      </section>

      <section className="controls-row">
        <FiltersBar
          status={status}
          onStatusChange={setStatus}
          selectedGenres={genres}
          onGenresChange={setGenres}
        />
        <SortControl
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
      </section>

      {isError && (
        <div className="error-banner">
          Failed to load movies. Please try again.
        </div>
      )}

      {isLoading ? (
        <EmptyState title="Loading movies..." description="Please wait." />
      ) : items.length === 0 ? (
        <EmptyState
          title="No movies found"
          description="Try adding a movie or adjusting your filters."
        />
      ) : (
        <MovieGrid
          movies={items}
          onEdit={(movie) => {
            setEditingMovieId(movie.id);
            setEditingMovie(movie);
            setIsFormOpen(true);
          }}
        />
      )}

      {isFormOpen && (
        <MovieFormModal
          movieId={editingMovieId}
          initialMovie={editingMovie}
          onClose={() => {
            setIsFormOpen(false);
            setEditingMovieId(null);
            setEditingMovie(null);
          }}
        />
      )}
    </div>
  );
}

