import { useCallback, useMemo, useState } from 'react';
import { useGenresQuery, useLibraryStatsQuery, useMoviesInfiniteQuery } from '../api/lists';
import type { Movie } from '../api/lists';
import { MovieGrid } from './MovieGrid';
import { MovieFormModal } from './MovieFormModal';
import { FiltersBar } from './FiltersBar';
import { SortControl } from './SortControl';
import { SearchInput } from './SearchInput';
import { EmptyState } from './EmptyState';
import { MovieDetailsDrawer } from './MovieDetailsDrawer';
import { ListSwitcher } from './ListSwitcher';
import { ListSettingsPanel } from './ListSettingsPanel';
import { useAuth } from '../auth/AuthContext';
import { useMoviesFilters } from '../state/MoviesFiltersContext';
import { useActiveListSync } from '../state/ActiveListContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export function MoviesPage() {
  const { logout } = useAuth();
  const { activeList, isLoading: listsLoading } = useActiveListSync();
  const listId = activeList?.id ?? null;
  const canEdit = activeList ? activeList.role !== 'viewer' : false;
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
    titleLang,
    setTitleLang,
  } = useMoviesFilters();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMoviesInfiniteQuery({
    listId,
    search: search || undefined,
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
  });
  const { data: libraryStats } = useLibraryStatsQuery(listId);
  const { data: availableGenres = [] } = useGenresQuery(listId);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  const openAddMovie = useCallback(() => {
    setEditingMovieId(null);
    setEditingMovie(null);
    setIsFormOpen(true);
  }, []);

  const hasActiveFilters = Boolean(
    search.trim() || status || contentType || genres.length > 0,
  );
  const isCatalogEmpty =
    items.length === 0 &&
    !hasActiveFilters &&
    (libraryStats?.total ?? total) === 0;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: Boolean(hasNextPage) && items.length > 0,
  });

  return (
    <div className="page">
      <header className="page-header desktop-topbar">
        <div className="desktop-brand" aria-label="TymMovies">
          <img
            src="/tymmovies-mark.svg"
            alt=""
            className="app-logo-mark"
            width={36}
            height={36}
          />
          <div className="desktop-brand-copy">
            <div className="desktop-brand-name">
              Tym<span>Movies</span>
            </div>
            <p>Shared watchlist</p>
          </div>
        </div>
        <div className="desktop-search-wrap">
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <div className="header-actions desktop-header-actions">
          {activeList ? <ListSwitcher onOpenSettings={() => setSettingsOpen(true)} /> : null}
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
            <SortControl
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
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
        </div>
        <div className="desktop-status-tabs" role="tablist" aria-label="Status">
          <button
            type="button"
            role="tab"
            aria-selected={!status}
            className={!status ? 'is-active' : undefined}
            onClick={() => setStatus(undefined)}
          >
            All <span>{libraryStats?.total ?? 0}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={status === 'WANT_TO_WATCH'}
            className={status === 'WANT_TO_WATCH' ? 'is-active' : undefined}
            onClick={() => setStatus('WANT_TO_WATCH')}
          >
            Planned <span>{libraryStats?.planned ?? 0}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={status === 'WATCHED'}
            className={status === 'WATCHED' ? 'is-active' : undefined}
            onClick={() => setStatus('WATCHED')}
          >
            Watched <span>{libraryStats?.watched ?? 0}</span>
          </button>
          {canEdit && (
            <button
              className="desktop-add-movie"
              type="button"
              onClick={openAddMovie}
            >
              + Add movie
            </button>
          )}
        </div>
      </section>

      {isError && (
        <div className="error-banner">
          Failed to load movies. Please try again.
        </div>
      )}

      {listsLoading || isLoading ? (
        <EmptyState title="Loading movies..." description="Please wait." />
      ) : isCatalogEmpty ? (
        <EmptyState
          variant="catalog"
          eyebrow="Your list is empty"
          title="Start with your first title."
          description="Add a movie or series you want to watch — solo or together with people on this list."
          action={canEdit ? { label: 'Add movie', onClick: openAddMovie } : undefined}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No titles found"
          description="Try adding a title or adjusting your filters."
        />
      ) : (
        <>
          <MovieGrid
            movies={items}
            titleLang={titleLang}
            onEdit={(movie) => {
              if (!canEdit) return;
              setEditingMovieId(movie.listMovieId);
              setEditingMovie(movie);
              setIsFormOpen(true);
            }}
            onSelect={setSelectedMovie}
          />

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

      {canEdit && isFormOpen && listId && activeList && (
        <MovieFormModal
          listId={listId}
          listRole={activeList.role}
          movieId={editingMovieId}
          initialMovie={editingMovie}
          onClose={() => {
            setIsFormOpen(false);
            setEditingMovieId(null);
            setEditingMovie(null);
          }}
        />
      )}
      {selectedMovie && listId && activeList && (
        <MovieDetailsDrawer
          movie={selectedMovie}
          listId={listId}
          listRole={activeList.role}
          titleLang={titleLang}
          onClose={() => setSelectedMovie(null)}
        />
      )}
      {settingsOpen && activeList && (
        <ListSettingsPanel list={activeList} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
