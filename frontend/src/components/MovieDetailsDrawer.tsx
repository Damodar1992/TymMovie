import { useState } from 'react';
import { useDeleteMovieMutation, useUpdateMovieMutation, type Movie } from '../api/movies';

export function MovieDetailsDrawer({ movie, titleLang, onClose }: { movie: Movie; titleLang: 'en' | 'ua'; onClose: () => void }) {
  const title = titleLang === 'ua' && movie.titleUa?.trim() ? movie.titleUa : movie.title;
  const [status, setStatus] = useState(movie.status);
  const [watchDate, setWatchDate] = useState(movie.watchDate ?? '');
  const [innaRating, setInnaRating] = useState(movie.innaRating?.toString() ?? '');
  const [bogdanRating, setBogdanRating] = useState(movie.bogdanRating?.toString() ?? '');
  const [comment, setComment] = useState(movie.comment ?? '');
  const updateMutation = useUpdateMovieMutation();
  const deleteMutation = useDeleteMovieMutation();
  const date = movie.watchDate ? movie.watchDate.slice(5).split('-').reverse().join('.') : null;
  const ratings = [['T', 'TMDb', movie.tmdbRating, 'tmdb'], ['I', 'Inna', movie.innaRating, 'inna'], ['B', 'Bohdan', movie.bogdanRating, 'bohdan']] as const;
  const isWatched = status === 'WATCHED';

  const markAsWatched = () => {
    setStatus('WATCHED');
  };

  const markAsPlanned = async () => {
    setStatus('WANT_TO_WATCH');
    if (movie.status === 'WATCHED') {
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
    }
  };

  const save = async () => {
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
  };

  const remove = () => {
    if (window.confirm(`Delete ${title}?`)) deleteMutation.mutate(movie.id, { onSuccess: onClose });
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
          <div>{movie.posterUrl ? <img src={movie.posterUrl} alt="" /> : title}</div>
          <section>
            <h2>{title}</h2>
            <p>
              {movie.releaseYear ?? '—'}
              {movie.userAvgRating != null ? ` · Tym ${movie.userAvgRating.toFixed(1)}` : ''}
              {date ? ` · ◍ ${date}` : ''}
            </p>
            <p>{movie.genres?.join(' · ')}</p>
            <b className={isWatched ? 'is-watched' : 'is-planned'}>
              {isWatched ? `Watched${date ? ` · ${date}` : ''}` : 'Planned'}
            </b>
          </section>
        </div>

        {!isWatched && (
          <>
            <h3>Ratings</h3>
            <div className="movie-drawer-ratings">
              {ratings
                .filter(([, , value]) => value != null)
                .map(([initial, label, value, tone]) => (
                  <div key={label}>
                    <span className={tone}>{initial}</span>
                    <strong>{label}</strong>
                    <i>★★★★★</i>
                    <b>{value?.toFixed(1)}</b>
                  </div>
                ))}
            </div>
          </>
        )}

        <div className="movie-drawer-actions">
          {isWatched ? (
            <button
              type="button"
              onClick={() => void markAsPlanned()}
              disabled={updateMutation.isPending}
            >
              Mark as planned
            </button>
          ) : (
            <>
              <button type="button" onClick={markAsWatched}>
                Mark as watched
              </button>
              <button type="button" className="movie-drawer-delete" onClick={remove} disabled={deleteMutation.isPending}>
                Delete entry
              </button>
            </>
          )}
        </div>

        {isWatched && (
          <div className="drawer-edit-fields">
            <section>
              <div>
                <span>Watch date</span>
                <b>{watchDate ? watchDate.slice(5).split('-').reverse().join('.') : '—'}</b>
              </div>
              <input type="date" value={watchDate} onChange={(event) => setWatchDate(event.target.value)} />
            </section>
            <section>
              <div>
                <span>Ratings</span>
                <b>{innaRating || '—'} · {bogdanRating || '—'}</b>
              </div>
              <div className="drawer-rating-inputs">
                <label>
                  Inna
                  <input type="number" min="0" max="10" step=".5" value={innaRating} onChange={(event) => setInnaRating(event.target.value)} />
                </label>
                <label>
                  Bohdan
                  <input type="number" min="0" max="10" step=".5" value={bogdanRating} onChange={(event) => setBogdanRating(event.target.value)} />
                </label>
              </div>
            </section>
            <section>
              <div>
                <span>Note</span>
                <b>{comment.trim() ? 'Added' : 'Empty'}</b>
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
