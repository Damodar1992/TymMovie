import { useCallback, useMemo, useState } from 'react';
import { useMoviesInfiniteQuery } from '../api/movies';
import type { Movie } from '../api/movies';
import { MovieGrid } from './MovieGrid';
import { MovieTable } from './MovieTable';
import { MovieFormModal } from './MovieFormModal';
import { FiltersBar } from './FiltersBar';
import { SortControl } from './SortControl';
import { SearchInput } from './SearchInput';
import { EmptyState } from './EmptyState';
import { MovieDetailsDrawer } from './MovieDetailsDrawer';
import { useAuth } from '../auth/AuthContext';
import { useMoviesFilters } from '../state/MoviesFiltersContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export function MoviesPage() {
  const { isReadOnly, logout } = useAuth();
  const {
    search,
    setSearch,
    status,
    setStatus,
    contentType,
    setContentType,
    genres,
    setGenres,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    titleLang,
    setTitleLang,
  } = useMoviesFilters();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

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
    enabled: Boolean(hasNextPage) && items.length > 0,
  });

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
      <header className="page-header desktop-topbar">
        <div className="desktop-brand">
          <img
            src="/tymmovies-mark.svg"
            alt=""
            className="app-logo-mark"
            width={34}
            height={34}
          />
          <div className="desktop-brand-copy">
            <div className="desktop-brand-name" aria-label="TymMovies">
              Tym<span>Movies</span>
            </div>
            <span>Shared watchlist</span>
          </div>
        </div>
        <div className="desktop-search-wrap">
          <SearchInput value={search} onChange={setSearch} />
          <kbd>⌘K</kbd>
        </div>
        <div className="header-actions desktop-header-actions">
          <div className="desktop-members" aria-label="Three members">
            <span>I</span><span>B</span><span>Y</span>
          </div>
          <button
            className="chip"
            type="button"
            onClick={logout}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="desktop-catalog-toolbar">
        <div className="desktop-toolbar-heading">
          <div>
            <h1>Movies</h1>
            <p>{total} titles · {items.filter((movie) => movie.status === 'WATCHED').length} watched · 3 members</p>
          </div>
          {!isReadOnly && (
            <button
              className="desktop-add-movie"
              type="button"
              onClick={() => {
                setEditingMovieId(null);
                setEditingMovie(null);
                setIsFormOpen(true);
              }}
            >
              + Add movie
            </button>
          )}
        </div>
        <div className="desktop-toolbar-controls controls-row-compact">
          <div className="filter-toggle-group">
          <span className="filter-label">Title</span>
          <div className="segmented-toggle" role="group" aria-label="Title language">
            <button
              type="button"
              className="segmented-toggle-option"
              onClick={() => setTitleLang('en')}
              aria-pressed={titleLang === 'en'}
              aria-label="Show title in English"
            >
              EN
            </button>
            <button
              type="button"
              className="segmented-toggle-option"
              onClick={() => setTitleLang('ua')}
              aria-pressed={titleLang === 'ua'}
              aria-label="Show title in Ukrainian"
            >
              UA
            </button>
          </div>
        </div>
          <div className="filter-toggle-group">
          <span className="filter-label">View</span>
          <div className="toggle-group" role="group" aria-label="View mode">
            <button
              type="button"
              className={viewMode === 'cards' ? 'toggle-chip toggle-chip-active view-mode-option' : 'toggle-chip view-mode-option'}
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              aria-label="Cards view"
            >
              <img
                src="/grid.svg"
                alt=""
                width={18}
                height={18}
                style={{ display: 'block' }}
              />
            </button>
            <button
              type="button"
              className={viewMode === 'table' ? 'toggle-chip toggle-chip-active view-mode-option' : 'toggle-chip view-mode-option'}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              aria-label="Table view"
            >
              <img
                src="/list.svg"
                alt=""
                width={18}
                height={18}
                style={{ display: 'block' }}
              />
            </button>
          </div>
        </div>
          <SortControl
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />
        </div>
        <div className="desktop-status-row">
          <FiltersBar
            status={status}
            onStatusChange={setStatus}
            contentType={contentType}
            onContentTypeChange={setContentType}
            availableGenres={availableGenres}
            selectedGenres={genres}
            onGenresChange={setGenres}
          />
        </div>
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
        <>
          {viewMode === 'cards' ? (
            <MovieGrid
              movies={items}
              titleLang={titleLang}
              onEdit={(movie) => {
                if (isReadOnly) return;
                setEditingMovieId(movie.id);
                setEditingMovie(movie);
                setIsFormOpen(true);
              }}
              onSelect={setSelectedMovie}
            />
          ) : (
            <MovieTable
              movies={items}
              titleLang={titleLang}
              onEdit={(movie) => {
                if (isReadOnly) return;
                setEditingMovieId(movie.id);
                setEditingMovie(movie);
                setIsFormOpen(true);
              }}
            />
          )}

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

      {!isReadOnly && isFormOpen && (
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
      {selectedMovie && (
        <MovieDetailsDrawer
          movie={selectedMovie}
          titleLang={titleLang}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}
