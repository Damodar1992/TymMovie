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
    useState<MoviesQueryParams['sortBy']>('user_avg_rating');
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
        .filter((g): g is string => typeof g === 'string' && g.trim().length),
    ),
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'fdb080',
      },
      body: JSON.stringify({
        sessionId: 'fdb080',
        runId: 'ui-movies-page',
        hypothesisId: 'UI1',
        location: 'MoviesPage.tsx:after-query',
        message: 'MoviesPage render state',
        data: {
          isLoading,
          isError,
          itemsLength: items.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
  }, [isLoading, isError, items.length]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Shared Movie &amp; TV Tracker</h1>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setEditingMovieId(null);
            setEditingMovie(null);
            setIsFormOpen(true);
          }}
        >
          Add Title
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

