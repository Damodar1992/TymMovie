import { useState, useEffect } from 'react';
import { useMoviesQuery } from '../api/movies';
import type { Movie, MovieStatus, MoviesQueryParams } from '../api/movies';
import { MovieGrid } from './MovieGrid';
import { MovieTable } from './MovieTable';
import { MovieFormModal } from './MovieFormModal';
import { FiltersBar } from './FiltersBar';
import { SortControl } from './SortControl';
import { SearchInput } from './SearchInput';
import { EmptyState } from './EmptyState';

const PAGE_SIZE = 50;
const VIEW_STORAGE_KEY = 'tym-movies-view';
const TITLE_LANG_STORAGE_KEY = 'tym-movies-title-lang';

type ViewMode = 'cards' | 'table';
type TitleLang = 'en' | 'ua';

function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === 'cards' || stored === 'table') return stored;
  } catch {
    /* ignore */
  }
  return 'cards';
}

function getStoredTitleLang(): TitleLang {
  try {
    const stored = localStorage.getItem(TITLE_LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'ua') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function MoviesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MovieStatus | undefined>();
  const [genres, setGenres] = useState<string[]>([]);
  const [contentType, setContentType] = useState<'MOVIE' | 'TV' | undefined>();
  const [sortBy, setSortBy] =
    useState<MoviesQueryParams['sortBy']>('created_at');
  const [sortOrder, setSortOrder] =
    useState<MoviesQueryParams['sortOrder']>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [titleLang, setTitleLang] = useState<TitleLang>(getStoredTitleLang);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, status, contentType, genres, sortBy, sortOrder]);

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
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

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
        <div className="filter-toggle-group">
          <span className="filter-label">View</span>
          <div className="toggle-group" role="group" aria-label="View mode">
            <button
              type="button"
              className={viewMode === 'cards' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
              onClick={() => {
                setViewMode('cards');
                try {
                  localStorage.setItem(VIEW_STORAGE_KEY, 'cards');
                } catch {
                  /* ignore */
                }
              }}
              aria-pressed={viewMode === 'cards'}
            >
              Cards
            </button>
            <button
              type="button"
              className={viewMode === 'table' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
              onClick={() => {
                setViewMode('table');
                try {
                  localStorage.setItem(VIEW_STORAGE_KEY, 'table');
                } catch {
                  /* ignore */
                }
              }}
              aria-pressed={viewMode === 'table'}
            >
              Table
            </button>
          </div>
        </div>
        <div className="filter-toggle-group">
          <span className="filter-label">Title</span>
          <div className="toggle-group" role="group" aria-label="Title language">
            <button
              type="button"
              className={`search-lang-btn ${titleLang === 'en' ? 'search-lang-btn-active' : ''}`}
              onClick={() => {
                setTitleLang('en');
                try {
                  localStorage.setItem(TITLE_LANG_STORAGE_KEY, 'en');
                } catch {
                  /* ignore */
                }
              }}
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
              onClick={() => {
                setTitleLang('ua');
                try {
                  localStorage.setItem(TITLE_LANG_STORAGE_KEY, 'ua');
                } catch {
                  /* ignore */
                }
              }}
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
                setEditingMovieId(movie.id);
                setEditingMovie(movie);
                setIsFormOpen(true);
              }}
            />
          )}
          {total > PAGE_SIZE && (
            <section className="pagination-row" aria-label="Pagination">
              <span className="pagination-info">
                {from}–{to} of {total}
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className="pagination-pages" aria-live="polite">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </section>
          )}
        </>
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

