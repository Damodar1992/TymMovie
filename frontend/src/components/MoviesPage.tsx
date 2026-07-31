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
      <header className="page-header">
        <img
          src="/tymmovies-horizontal-logo.svg"
          alt="TymMovies"
          className="app-logo"
        />
        <div className="header-actions">
          {!isReadOnly && (
            <button
              className="icon-button"
              type="button"
              onClick={() => {
                setEditingMovieId(null);
                setEditingMovie(null);
                setIsFormOpen(true);
              }}
              aria-label="Add movie"
            >
              <span>Add</span>
              <img
                src="/add_movie_icon.svg"
                alt=""
                width={28}
                height={28}
                style={{ display: 'block' }}
              />
            </button>
          )}
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

      <section className="controls-row controls-row-compact">
        <div className="filter-toggle-group">
          <span className="filter-label">Title</span>
          <div className="toggle-group" role="group" aria-label="Title language">
            <button
              type="button"
              className={`search-lang-btn ${titleLang === 'en' ? 'search-lang-btn-active' : ''}`}
              onClick={() => setTitleLang('en')}
              aria-pressed={titleLang === 'en'}
              aria-label="Show title in English"
              title="English"
            >
              <span className="search-lang-flag" aria-hidden>
                <svg viewBox="0 0 60 30" width="28" height="14" xmlns="http://www.w3.org/2000/svg">
                  <rect width="60" height="30" fill="#012169" />
                  <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
                  <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4" />
                  <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
                  <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className={`search-lang-btn ${titleLang === 'ua' ? 'search-lang-btn-active' : ''}`}
              onClick={() => setTitleLang('ua')}
              aria-pressed={titleLang === 'ua'}
              aria-label="Show title in Ukrainian"
              title="Ukrainian"
            >
              <span className="search-lang-flag" aria-hidden>
                <svg viewBox="0 0 24 16" width="28" height="19" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="8" fill="#0057B7" />
                  <rect y="8" width="24" height="8" fill="#FFD700" />
                </svg>
              </span>
            </button>
          </div>
        </div>
        <div className="filter-toggle-group">
          <span className="filter-label">View</span>
          <div className="toggle-group" role="group" aria-label="View mode">
            <button
              type="button"
              className={viewMode === 'cards' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              aria-label="Cards view"
              style={{ width: 54, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              className={viewMode === 'table' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              aria-label="Table view"
              style={{ width: 51, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
    </div>
  );
}
