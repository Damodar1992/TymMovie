import type { Movie } from '../api/lists';
import { Avatar } from './Avatar';

type TitleLang = 'en' | 'ua';

interface MovieCardProps {
  movie: Movie;
  titleLang: TitleLang;
  onEdit: (movie: Movie) => void;
  onSelect?: (movie: Movie) => void;
}

function displayTitle(movie: Movie, titleLang: TitleLang) {
  return titleLang === 'ua' && movie.titleUa?.trim() ? movie.titleUa : movie.title;
}

function watchDateLabel(date: string | null) {
  if (!date) return null;
  const [, month, day] = date.split('-');
  return month && day ? `${day}.${month}` : date;
}

export function MovieCard({ movie, titleLang, onEdit, onSelect }: MovieCardProps) {
  const title = displayTitle(movie, titleLang);
  const dateLabel = watchDateLabel(movie.watchDate);
  const statusClass = movie.status === 'WATCHED' ? 'is-watched' : 'is-planned';
  const rated = movie.ratings.filter((r) => r.rating != null);

  return (
    <article className="movie-card movie-card-v2" onClick={() => onSelect?.(movie)}>
      <div className="movie-poster-art" aria-hidden={!movie.posterUrl}>
        {movie.posterUrl ? <img src={movie.posterUrl} alt={title} loading="lazy" /> : null}
        {!movie.posterUrl ? (
          <div className="movie-poster-fallback">
            <span>{title}</span>
            <small>poster</small>
          </div>
        ) : null}
        {movie.avgRating != null ? <span className="movie-score-badge">{movie.avgRating.toFixed(1)}</span> : null}
        <span className={`movie-status-dot ${statusClass}`} aria-label={movie.status === 'WATCHED' ? 'Watched' : 'Planned'} />
      </div>

      <div className="movie-card-body">
        <div className="movie-card-title-row">
          <h2 className="movie-card-title">{title}</h2>
          <span className={`movie-status-pill ${statusClass}`}>
            {movie.status === 'WATCHED' ? `Watched${dateLabel ? ` · ${dateLabel}` : ''}` : 'Planned'}
          </span>
        </div>
        <div className="movie-card-meta">
          <span>{movie.releaseYear ?? '—'}</span>
          <div className="movie-rating-chips movie-rating-chips-dynamic" aria-label="Ratings">
            {movie.tmdbRating != null ? (
              <span className="movie-rating-chip">
                <img src="/tmdb-badge.svg" alt="TMDb" className="movie-rating-avatar movie-rating-avatar-tmdb" />
                <strong>{movie.tmdbRating.toFixed(1)}</strong>
              </span>
            ) : null}
            {rated.map((r) => (
              <span className="movie-rating-chip" key={r.userId}>
                <Avatar
                  userId={r.userId}
                  name={r.userName}
                  avatarUrl={r.avatarUrl}
                  className="movie-rating-avatar-dynamic"
                  title={r.userName ?? undefined}
                />
                <strong>{r.rating!.toFixed(1)}</strong>
              </span>
            ))}
          </div>
        </div>
        {movie.genres?.length ? <p className="movie-card-genres">{movie.genres.join(' · ')}</p> : null}
        <button
          type="button"
          className="movie-card-edit"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(movie);
          }}
        >
          Edit
        </button>
      </div>
    </article>
  );
}
