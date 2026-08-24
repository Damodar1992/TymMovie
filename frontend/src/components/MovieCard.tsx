import type { Movie } from '../api/movies';

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

function RatingChip({ label, value, tone }: { label: string; value: number | null; tone: string }) {
  if (value == null) return null;
  return (
    <span className="movie-rating-chip">
      <span className={`movie-rating-avatar movie-rating-avatar-${tone}`}>{label}</span>
      <strong>{value.toFixed(1)}</strong>
    </span>
  );
}

export function MovieCard({ movie, titleLang, onEdit, onSelect }: MovieCardProps) {
  const title = displayTitle(movie, titleLang);
  const dateLabel = watchDateLabel(movie.watchDate);
  const statusClass = movie.status === 'WATCHED' ? 'is-watched' : 'is-planned';

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
        {movie.userAvgRating != null ? <span className="movie-score-badge">{movie.userAvgRating.toFixed(1)}</span> : null}
      </div>

      <div className="movie-card-body">
        <div className="movie-card-title-row">
          <h2 className="movie-card-title">{title}</h2>
          <span className={`movie-status-dot ${statusClass}`} aria-label={movie.status === 'WATCHED' ? 'Watched' : 'Planned'} />
        </div>
        <p className="movie-card-meta">
          {movie.releaseYear ?? '—'}
          {movie.userAvgRating != null ? ` · Tym ${movie.userAvgRating.toFixed(1)}` : ''}
          {dateLabel ? ` · ◍ ${dateLabel}` : ''}
        </p>
        {movie.genres?.length ? <p className="movie-card-genres">{movie.genres.join(' · ')}</p> : null}
        <div className="movie-card-bottom-row">
          <div className="movie-rating-chips" aria-label="Ratings">
            <RatingChip label="T" value={movie.tmdbRating} tone="tmdb" />
            <RatingChip label="I" value={movie.innaRating} tone="inna" />
            <RatingChip label="B" value={movie.bogdanRating} tone="bohdan" />
          </div>
          <span className={`movie-status-pill ${statusClass}`}>
            {movie.status === 'WATCHED' ? `Watched${dateLabel ? ` · ${dateLabel}` : ''}` : 'Planned'}
          </span>
        </div>
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
