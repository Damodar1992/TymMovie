import { useEffect, useState } from 'react';
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
  const [contentType, setContentType] = useState<'MOVIE' | 'TV' | undefined>();
  const [sortBy, setSortBy] =
    useState<MoviesQueryParams['sortBy']>('watch_date');
  const [sortOrder, setSortOrder] =
    useState<MoviesQueryParams['sortOrder']>('desc');
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
  });

  const items = data?.items ?? [];

  const availableGenres = Array.from(
    new Set(
      items
        .flatMap((m) => m.genres ?? [])
        .filter((g): g is string => {
          if (typeof g !== 'string') return false;
          return g.trim().length > 0;
        }),
    ),
  ).sort((a, b) => a.localeCompare(b));


  return (
    <div className="page">
      <header className="page-header">
        <img
          src="/logo 2.png"
          alt="TymMovies"
          className="app-logo"
        />
        <button
          className="icon-button"
          type="button"
          onClick={() => {
            setEditingMovieId(null);
            setEditingMovie(null);
            setIsFormOpen(true);
          }}
        >
          <span>Add</span>
          <span aria-hidden="true">
            <img
              src="/add_movie_icon.svg"
              alt=""
              style={{ width: 28, height: 28, display: 'block' }}
            />
          </span>
        </button>
      </header>

      <section className="controls-row">
        <SearchInput value={search} onChange={setSearch} />
      </section>

      <section className="controls-row">
        <FiltersBar
          status={status}
          onStatusChange={setStatus}
          contentType={contentType}
          onContentTypeChange={setContentType}
          availableGenres={availableGenres}
          selectedGenres={genres}
          onGenresChange={setGenres}
        />
      </section>

      <section className="controls-row">
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
          title="No titles found"
          description="Try adding a title or adjusting your filters."
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

