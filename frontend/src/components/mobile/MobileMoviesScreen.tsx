import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import {
  useDeleteMovieMutation,
  useLibraryStatsQuery,
  useMoviesInfiniteQuery,
  useUpdateMovieMutation,
  useSetRatingMutation,
  useListMembersQuery,
  type Movie,
} from '../../api/lists';
import { useAuth } from '../../auth/AuthContext';
import { useActiveListSync } from '../../state/ActiveListContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { Avatar } from '../Avatar';
import { RatingStars } from '../RatingStars';
import { MovieCard } from '../MovieCard';
import { MobileMovieTile } from './MobileMovieTile';
import { MobileStatusFilter } from './MobileStatusFilter';
import { MobileMovieForm } from './movie-form/MobileMovieForm';
import { SearchInput } from '../SearchInput';
import { EmptyState } from '../EmptyState';
import { FormattedDatePicker } from '../FormattedDatePicker';
import { youtubeTrailerUrl } from '../../lib/trailer';

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

export function MobileMoviesScreen() {
  const { activeList } = useActiveListSync();
  const listId = activeList?.id ?? null;
  const canEdit = activeList ? activeList.role !== 'viewer' : false;
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
    setTitleLang,
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
    listId,
    search: search || undefined,
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
  });

  const { data: libraryStats } = useLibraryStatsQuery(listId);

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
    enabled: Boolean(hasNextPage) && items.length > 0 && scrollRoot != null,
    root: scrollRoot,
  });

  return (
    <div className="mobile-screen mobile-screen-movies">
      <div className="mobile-search-row">
        <SearchInput value={search} onChange={setSearch} />
      </div>

      <div className="mobile-movies-toolbar">
        <MobileStatusFilter value={status} onChange={setStatus} />

        <div className="mobile-toolbar-toggles">
          <div className="mobile-lang-toggle" role="group" aria-label="Title language">
            <button
              type="button"
              className={titleLang === 'en' ? 'active' : ''}
              onClick={() => setTitleLang('en')}
              aria-pressed={titleLang === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className={titleLang === 'ua' ? 'active' : ''}
              onClick={() => setTitleLang('ua')}
              aria-pressed={titleLang === 'ua'}
            >
              UA
            </button>
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
      </div>

      {isError ? (
        <div className="error-banner">Failed to load movies. Please try again.</div>
      ) : null}

      {isLoading ? (
        <EmptyState title="Loading…" description="Please wait." />
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
          description="Try adjusting your filters."
        />
      ) : (
        <>
          {layout === 'grid' ? (
            <div className="mobile-movie-grid">
              {items.map((movie) => (
                <MobileMovieTile
                  key={movie.listMovieId}
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
                  key={movie.listMovieId}
                  movie={movie}
                  titleLang={titleLang}
                  onEdit={(m) => {
                    if (!canEdit) return;
                    setEditingMovieId(m.listMovieId);
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

      {canEdit && listId && activeList ? (
        <MobileMovieForm
          key={editingMovieId ?? 'new-edit'}
          open={isFormOpen}
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
      ) : null}
      {selectedMovie && listId && activeList ? (
        <MobileMovieDetailSheet
          movie={selectedMovie}
          listId={listId}
          listRole={activeList.role}
          titleLang={titleLang}
          onClose={() => setSelectedMovie(null)}
        />
      ) : null}
    </div>
  );
}

function MobileMovieDetailSheet({
  movie,
  listId,
  listRole,
  titleLang,
  onClose,
}: {
  movie: Movie;
  listId: string;
  listRole: 'owner' | 'member' | 'viewer';
  titleLang: 'en' | 'ua';
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: members = [] } = useListMembersQuery(listId);
  const title = titleLang === 'ua' && movie.titleUa?.trim() ? movie.titleUa : movie.title;
  const [status, setStatus] = useState(movie.status);
  const [watchDate, setWatchDate] = useState(movie.watchDate ?? '');
  const [ratings, setRatings] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const r of movie.ratings) if (r.rating != null) out[r.userId] = String(r.rating);
    return out;
  });
  const [comment, setComment] = useState(movie.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const updateMutation = useUpdateMovieMutation();
  const deleteMutation = useDeleteMovieMutation();
  const setRatingMutation = useSetRatingMutation();
  const dragControls = useDragControls();
  const isWatched = status === 'WATCHED';
  const genres = movie.genres?.filter(Boolean) ?? [];
  const canEdit = listRole !== 'viewer';
  const canRateFor = (targetUserId: string) => targetUserId === user?.id || listRole === 'owner';

  const scoreCards = [
    { key: 'tmdb', label: 'TMDb', value: movie.tmdbRating, kind: 'tmdb' as const },
    ...members.map((m) => ({
      key: m.userId,
      label: m.name ?? m.email,
      value: ratings[m.userId] !== undefined ? Number(ratings[m.userId]) : null,
      kind: 'member' as const,
      userId: m.userId,
      name: m.name,
      email: m.email,
      avatarUrl: m.avatarUrl,
    })),
  ];

  const applyRatings = async () => {
    for (const [uid, raw] of Object.entries(ratings)) {
      if (!canRateFor(uid)) continue;
      const rating = raw === '' ? null : Number.parseFloat(raw);
      await setRatingMutation.mutateAsync({ listMovieId: movie.listMovieId, userId: uid, rating, listId });
    }
  };

  const markAsWatched = () => {
    if (!canEdit) return;
    setError(null);
    setStatus('WATCHED');
  };

  const markAsPlanned = async () => {
    if (!canEdit) return;
    setError(null);
    setStatus('WANT_TO_WATCH');
    setWatchDate('');
    if (movie.status === 'WATCHED') {
      try {
        await updateMutation.mutateAsync({
          id: movie.listMovieId,
          listId,
          payload: { status: 'WANT_TO_WATCH', watchDate: null, comment: comment.trim() || null },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
      }
    }
  };

  const save = async () => {
    if (!canEdit) {
      setError('You do not have edit access to this list.');
      return;
    }
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: movie.listMovieId,
        listId,
        payload: { status: 'WATCHED', watchDate: watchDate || null, comment: comment.trim() || null },
      });
      await applyRatings();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const remove = () => {
    if (!canEdit) return;
    if (!window.confirm(`Delete ${title}?`)) return;
    setError(null);
    deleteMutation.mutate(
      { id: movie.listMovieId, listId },
      {
        onSuccess: onClose,
        onError: (err) => setError(err instanceof Error ? err.message : 'Failed to delete'),
      },
    );
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
            {movie.trailerKey ? (
              <a
                className="mobile-detail-trailer-btn"
                href={youtubeTrailerUrl(movie.trailerKey)}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <Play size={14} strokeWidth={2.4} fill="currentColor" />
                Trailer
              </a>
            ) : null}
          </div>
        </motion.header>

        <div className="mobile-detail-scroll">
          <h3 className="mobile-detail-scores-title">Ratings</h3>
          <div className="mobile-detail-scores">
            {scoreCards.map((card) => (
              <div key={card.key} className="mobile-detail-score-card">
                {card.kind === 'tmdb' ? (
                  <img
                    src="/tmdb-badge.svg"
                    alt=""
                    className="mobile-detail-score-avatar mobile-detail-score-avatar-tmdb"
                  />
                ) : (
                  <Avatar
                    userId={card.userId}
                    name={card.name}
                    email={card.email}
                    avatarUrl={card.avatarUrl}
                    className="mobile-detail-score-avatar"
                  />
                )}
                <strong className="mobile-detail-score-label">{card.label}</strong>
                <div className="mobile-detail-score-rating">
                  <RatingStars score={card.value} />
                  <b>
                    {card.value != null && !Number.isNaN(card.value)
                      ? card.value.toFixed(1)
                      : '—'}
                  </b>
                </div>
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
                </div>
                <FormattedDatePicker value={watchDate} onChange={setWatchDate} />
              </section>

              <section className="mobile-detail-card">
                <div className="mobile-detail-card-head">
                  <span>Ratings</span>
                </div>
                <div className="mobile-detail-rating-grid">
                  {members.map((m) => (
                    <label key={m.userId}>
                      <span className="mobile-detail-rating-label">
                        <Avatar
                          userId={m.userId}
                          name={m.name}
                          email={m.email}
                          avatarUrl={m.avatarUrl}
                          className="movie-rating-avatar-dynamic"
                        />
                        <span className="mobile-detail-rating-name">{m.name ?? m.email}</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step=".5"
                        disabled={!canRateFor(m.userId)}
                        value={ratings[m.userId] ?? ''}
                        onChange={(event) =>
                          setRatings((prev) => ({ ...prev, [m.userId]: event.target.value }))
                        }
                        inputMode="decimal"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="mobile-detail-card">
                <div className="mobile-detail-card-head">
                  <span>Note</span>
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

          {!canEdit ? (
            <p className="mobile-detail-readonly-hint">You have read-only access to this list.</p>
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
