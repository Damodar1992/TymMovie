import { useState } from 'react';
import {
  useDeleteMovieMutation,
  useUpdateMovieMutation,
  useSetRatingMutation,
  useListMembersQuery,
  type Movie,
} from '../api/lists';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './Avatar';
import { starFillFractions } from '../lib/ratingStars';
import { youtubeTrailerUrl } from '../lib/trailer';

export function MovieDetailsDrawer({
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
  const updateMutation = useUpdateMovieMutation();
  const deleteMutation = useDeleteMovieMutation();
  const setRatingMutation = useSetRatingMutation();
  const date = watchDate ? watchDate.slice(5).split('-').reverse().join('.') : null;
  const isWatched = status === 'WATCHED';
  const canRateFor = (targetUserId: string) => targetUserId === user?.id || listRole === 'owner';

  const visibleRatings = [
    { key: 'tmdb', label: 'TMDb', value: movie.tmdbRating, tone: 'tmdb' as const },
    ...members
      .map((m) => ({
        key: m.userId,
        label: m.name ?? m.email,
        value: ratings[m.userId] !== undefined ? Number(ratings[m.userId]) : null,
        tone: 'member' as const,
        userId: m.userId,
        avatarUrl: m.avatarUrl,
        name: m.name,
        email: m.email,
      }))
      .filter((r) => r.value != null && Number.isFinite(r.value)),
  ];

  const applyRatings = async () => {
    for (const [uid, raw] of Object.entries(ratings)) {
      if (!canRateFor(uid)) continue;
      const rating = raw === '' ? null : Number.parseFloat(raw);
      await setRatingMutation.mutateAsync({ listMovieId: movie.listMovieId, userId: uid, rating, listId });
    }
  };

  const markAsWatched = () => {
    setStatus('WATCHED');
  };

  const markAsPlanned = async () => {
    setStatus('WANT_TO_WATCH');
    setWatchDate('');
    if (movie.status === 'WATCHED') {
      await updateMutation.mutateAsync({
        id: movie.listMovieId,
        listId,
        payload: { status: 'WANT_TO_WATCH', watchDate: null, comment: comment.trim() || null },
      });
    }
  };

  const save = async () => {
    await updateMutation.mutateAsync({
      id: movie.listMovieId,
      listId,
      payload: { status: 'WATCHED', watchDate: watchDate || null, comment: comment.trim() || null },
    });
    await applyRatings();
    onClose();
  };

  const remove = () => {
    if (window.confirm(`Delete ${title}?`)) {
      deleteMutation.mutate({ id: movie.listMovieId, listId }, { onSuccess: onClose });
    }
  };

  return (
    <div className="movie-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className={`movie-drawer${isWatched ? ' is-editing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="movie-drawer-top">
          <span>Movie</span>
          <button type="button" onClick={onClose} aria-label="Close details">×</button>
        </div>
        <div className="movie-drawer-hero">
          <div className="movie-drawer-hero-poster">
            {movie.posterUrl ? <img src={movie.posterUrl} alt="" /> : title}
          </div>
          <section>
            <h2>{title}</h2>
            <p>
              {movie.releaseYear ?? '—'}
              {movie.avgRating != null ? ` · Tym ${movie.avgRating.toFixed(1)}` : ''}
              {date ? ` · ◍ ${date}` : ''}
            </p>
            <p>{movie.genres?.join(' · ')}</p>
            <div className="movie-drawer-hero-meta">
              <b className={isWatched ? 'is-watched' : 'is-planned'}>
                {isWatched ? `Watched${date ? ` · ${date}` : ''}` : 'Planned'}
              </b>
              {movie.trailerKey ? (
                <a
                  className="movie-drawer-trailer"
                  href={youtubeTrailerUrl(movie.trailerKey)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Watch trailer"
                >
                  <span className="movie-drawer-action-icon" aria-hidden>
                    ▶
                  </span>
                  Trailer
                </a>
              ) : null}
            </div>
          </section>
        </div>

        {visibleRatings.length > 0 && (
          <>
            <h3>Ratings</h3>
            <div className="movie-drawer-ratings">
              {visibleRatings.map((r) => {
                const score = r.value as number;
                return (
                  <div key={r.key}>
                    {r.tone === 'member' ? (
                      <Avatar userId={r.key} name={r.name} email={r.email} avatarUrl={r.avatarUrl} />
                    ) : (
                      <img src="/tmdb-badge.svg" alt="TMDb" className="tmdb" />
                    )}
                    <strong>{r.label}</strong>
                    <i className="drawer-rating-stars" aria-hidden>
                      {starFillFractions(score).map((fill, index) => (
                        <span key={index} className="drawer-rating-star" style={{ ['--star-fill' as string]: `${fill * 100}%` }}>
                          <span className="drawer-rating-star-base">{'★'}</span>
                          <span className="drawer-rating-star-fill">{'★'}</span>
                        </span>
                      ))}
                    </i>
                    <b>{score.toFixed(1)}</b>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="movie-drawer-actions">
          {isWatched ? (
            <button
              type="button"
              onClick={() => void markAsPlanned()}
              disabled={updateMutation.isPending}
              aria-label="Mark as planned"
            >
              Planned
            </button>
          ) : (
            <>
              <button type="button" onClick={markAsWatched} aria-label="Mark as watched">
                Watched
              </button>
              <button
                type="button"
                className="movie-drawer-delete"
                onClick={remove}
                disabled={deleteMutation.isPending}
                aria-label="Delete entry"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {isWatched && (
          <div className="drawer-edit-fields">
            <section>
              <div>
                <span>Watch date</span>
              </div>
              <input type="date" value={watchDate} onChange={(event) => setWatchDate(event.target.value)} />
            </section>
            <section>
              <div>
                <span>Ratings</span>
              </div>
              <div className="drawer-rating-inputs">
                {members.map((m) => (
                  <label key={m.userId}>
                    {m.name ?? m.email}
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
                    />
                  </label>
                ))}
              </div>
            </section>
            <section>
              <div>
                <span>Note</span>
              </div>
              <textarea
                placeholder="Add a personal note about this title"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </section>
            <div className="drawer-edit-actions">
              <button type="button" onClick={remove} disabled={deleteMutation.isPending}>Delete entry</button>
              <button type="button" onClick={() => void save()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
