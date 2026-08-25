import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { useDeleteMovieMutation, useMoviesInfiniteQuery, useUpdateMovieMutation, type Movie } from '../../api/movies';
import { useAuth } from '../../auth/AuthContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { MovieCard } from '../MovieCard';
import { MobileMovieTile } from './MobileMovieTile';
import { MobileMovieForm } from './movie-form/MobileMovieForm';
import { SearchInput } from '../SearchInput';
import { EmptyState } from '../EmptyState';

type MobileLayout = 'list' | 'grid';
const MOBILE_LAYOUT_KEY = 'tym-movies-mobile-layout';

function readMobileLayout(): MobileLayout {
  try {
    const value = localStorage.getItem(MOBILE_LAYOUT_KEY);
    if (value === 'list' || value === 'grid') return value;
  } catch {
    /* ignore */
  }
  return 'list';
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return null;
  const parts = value.slice(0, 10).split('-');
  if (parts.length < 3) return value;
  return `${parts[2]}.${parts[1]}`;
}

function formatScore(value: number | null | undefined) {
  return value != null && !Number.isNaN(value) ? value.toFixed(1) : '—';
}

export function MobileMoviesScreen() {
  const { isReadOnly } = useAuth();
  const {
    search,
    setSearch,
    status,
    setStatus,
    contentType,
    genres,
    sortBy,
    sortOrder,
    titleLang,
  } = useMoviesFilters();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null);
  const [layout, setLayoutState] = useState<MobileLayout>(readMobileLayout);

  const setLayout = (next: MobileLayout) => {
    setLayoutState(next);
    try {
      localStorage.setItem(MOBILE_LAYOUT_KEY, next);
    } catch {
      /* ignore */
    }
  };

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

      <div className="mobile-movies-toolbar">
        <div className="mobile-status-chips" role="group" aria-label="Filter by status">
          <button type="button" className={!status ? 'active' : ''} onClick={() => setStatus(undefined)}>All</button>
          <button type="button" className={status === 'WANT_TO_WATCH' ? 'active' : ''} onClick={() => setStatus('WANT_TO_WATCH')}>Planned</button>
          <button type="button" className={status === 'WATCHED' ? 'active' : ''} onClick={() => setStatus('WATCHED')}>Watched</button>
        </div>

        <div className="mobile-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={layout === 'grid' ? 'active' : ''}
            onClick={() => setLayout('grid')}
            aria-pressed={layout === 'grid'}
            aria-label="Grid view"
          >
            <img src="/grid.svg" alt="" width={16} height={16} />
          </button>
          <button
            type="button"
            className={layout === 'list' ? 'active' : ''}
            onClick={() => setLayout('list')}
            aria-pressed={layout === 'list'}
            aria-label="List view"
          >
            <img src="/list.svg" alt="" width={16} height={16} />
          </button>
        </div>
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
          {layout === 'grid' ? (
            <div className="mobile-movie-grid">
              {items.map((movie) => (
                <MobileMovieTile
                  key={movie.id}
                  movie={movie}
                  titleLang={titleLang}
                  onSelect={setSelectedMovie}
                />
              ))}
            </div>
          ) : (
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
                  onSelect={setSelectedMovie}
                />
              ))}
            </div>
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
      {selectedMovie ? (
        <MobileMovieDetailSheet
          movie={selectedMovie}
          titleLang={titleLang}
          onClose={() => setSelectedMovie(null)}
        />
      ) : null}
    </div>
  );
}

function MobileMovieDetailSheet({ movie, titleLang, onClose }: { movie: Movie; titleLang: 'en' | 'ua'; onClose: () => void }) {
  const { isReadOnly } = useAuth();
  const title = titleLang === 'ua' && movie.titleUa?.trim() ? movie.titleUa : movie.title;
  const [status, setStatus] = useState(movie.status);
  const [watchDate, setWatchDate] = useState(movie.watchDate ?? '');
  const [innaRating, setInnaRating] = useState(movie.innaRating?.toString() ?? '');
  const [bogdanRating, setBogdanRating] = useState(movie.bogdanRating?.toString() ?? '');
  const [comment, setComment] = useState(movie.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const updateMutation = useUpdateMovieMutation();
  const deleteMutation = useDeleteMovieMutation();
  const dragControls = useDragControls();
  const isWatched = status === 'WATCHED';
  const shortDate = formatShortDate(watchDate || movie.watchDate);
  const genres = movie.genres?.filter(Boolean) ?? [];
  const scoreCards = [
    { label: 'TMDB', value: movie.tmdbRating },
    { label: 'INNA', value: movie.innaRating },
    { label: 'BOHDAN', value: movie.bogdanRating },
  ] as const;
  const ratingsSummary =
    innaRating || bogdanRating
      ? `Inna ${innaRating || '—'} · Bohdan ${bogdanRating || '—'}`
      : '— · —';
  const canEdit = !isReadOnly;

  const markAsWatched = () => {
    if (!canEdit) return;
    setError(null);
    setStatus('WATCHED');
  };

  const markAsPlanned = async () => {
    if (!canEdit) return;
    setError(null);
    setStatus('WANT_TO_WATCH');
    if (movie.status === 'WATCHED') {
      try {
        await updateMutation.mutateAsync({
          id: movie.id,
          payload: {
            status: 'WANT_TO_WATCH',
            watchDate: null,
            innaRating: innaRating ? Number(innaRating) : null,
            bogdanRating: bogdanRating ? Number(bogdanRating) : null,
            comment: comment.trim() || null,
          },
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
      }
    }
  };

  const save = async () => {
    if (!canEdit) {
      setError('Read-only mode: sign in as admin to save.');
      return;
    }
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: movie.id,
        payload: {
          status: 'WATCHED',
          watchDate: watchDate || null,
          innaRating: innaRating ? Number(innaRating) : null,
          bogdanRating: bogdanRating ? Number(bogdanRating) : null,
          comment: comment.trim() || null,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const remove = () => {
    if (!canEdit) return;
    if (!window.confirm(`Delete ${title}?`)) return;
    setError(null);
    deleteMutation.mutate(movie.id, {
      onSuccess: onClose,
      onError: (err) => setError(err instanceof Error ? err.message : 'Failed to delete'),
    });
  };

  const posterUrl = movie.posterUrl?.trim() || null;

  return createPortal(
    <div className="mobile-detail-backdrop" role="presentation" onClick={onClose}>
      <motion.section
        className={`mobile-detail-sheet${isWatched && canEdit ? ' is-editing' : ''}${posterUrl ? ' has-cover' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.y > 72 || info.velocity.y > 500) onClose();
        }}
      >
        <motion.header
          className="mobile-detail-cover"
          onPointerDown={(event) => dragControls.start(event)}
        >
          {posterUrl ? (
            <img
              className="mobile-detail-cover-img"
              src={posterUrl}
              alt=""
              draggable={false}
            />
          ) : null}
          <div className="mobile-detail-cover-scrim" aria-hidden />
          <div className="mobile-detail-grab" />
          <button
            type="button"
            className="mobile-detail-close"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
          <div className="mobile-detail-cover-content">
            <h2>{title}</h2>
            <p className="mobile-detail-meta">
              <span>{movie.releaseYear ?? '—'}</span>
            </p>
            {genres.length > 0 ? (
              <div className="mobile-detail-genres">
                {genres.map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
            ) : null}
          </div>
        </motion.header>

        <div className="mobile-detail-scroll">
          <div className="mobile-detail-scores">
            {scoreCards.map((card) => (
              <div key={card.label} className="mobile-detail-score-card">
                <span>{card.label}</span>
                <strong>{formatScore(card.value)}</strong>
              </div>
            ))}
          </div>

          {canEdit ? (
            <button
              type="button"
              className={`mobile-detail-status-btn${isWatched ? ' is-watched' : ''}`}
              onClick={() => {
                if (isWatched) void markAsPlanned();
                else markAsWatched();
              }}
              disabled={updateMutation.isPending}
            >
              {isWatched ? 'Watched ✓' : 'Mark as watched'}
            </button>
          ) : (
            <div className={`mobile-detail-status-btn${isWatched ? ' is-watched' : ''}`}>
              {isWatched ? 'Watched ✓' : 'Planned'}
            </div>
          )}

          {isWatched && canEdit && (
            <div className="mobile-detail-edit">
              <section className="mobile-detail-card">
                <div className="mobile-detail-card-head">
                  <span>Watch date</span>
                  <b>{shortDate ?? '—'}</b>
                </div>
                <input
                  type="date"
                  value={watchDate}
                  onChange={(event) => setWatchDate(event.target.value)}
                />
              </section>

              <section className="mobile-detail-card">
                <div className="mobile-detail-card-head">
                  <span>Ratings</span>
                  <b>{ratingsSummary}</b>
                </div>
                <div className="mobile-detail-rating-grid">
                  <label>
                    <span>Inna</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step=".5"
                      value={innaRating}
                      onChange={(event) => setInnaRating(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Bohdan</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step=".5"
                      value={bogdanRating}
                      onChange={(event) => setBogdanRating(event.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="mobile-detail-card">
                <div className="mobile-detail-card-head">
                  <span>Note</span>
                  <b>{comment.trim() ? 'Added' : 'Empty'}</b>
                </div>
                <textarea
                  placeholder="Add a personal note about this title"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </section>
            </div>
          )}

          {error ? <p className="mobile-detail-error">{error}</p> : null}

          {canEdit && (
            <button
              type="button"
              className="mobile-detail-delete-link"
              onClick={remove}
              disabled={deleteMutation.isPending}
            >
              Delete entry
            </button>
          )}

          {isReadOnly ? (
            <p className="mobile-detail-readonly-hint">Sign in as admin to edit this title.</p>
          ) : null}
        </div>

        {isWatched && canEdit && (
          <div className="mobile-detail-footer">
            <button
              type="button"
              className="mobile-detail-save"
              onClick={() => void save()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </motion.section>
    </div>,
    document.body,
  );
}
