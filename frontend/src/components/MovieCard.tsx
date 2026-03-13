import type { Movie } from '../api/movies';
import { useDeleteMovieMutation } from '../api/movies';

interface MovieCardProps {
  movie: Movie;
  onEdit: (movie: Movie) => void;
}

export function MovieCard({ movie, onEdit }: MovieCardProps) {
  const deleteMutation = useDeleteMovieMutation();

  const formatRating = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    const num =
      typeof value === 'number' ? value : Number.parseFloat(String(value));
    if (Number.isNaN(num)) return '—';
    return num.toFixed(1);
  };

  const renderStars = (value: unknown) => {
    if (value === null || value === undefined) return '—';
    const num =
      typeof value === 'number' ? value : Number.parseFloat(String(value));
    if (Number.isNaN(num)) return '—';
    const clamped = Math.max(0, Math.min(10, num));
    const stars = Math.round(clamped / 2); // 0–5
    const empty = 5 - stars;
    return (
      <span className="stars" title={`${clamped.toFixed(1)}/10`}>
        {'★'.repeat(stars)}
        {'☆'.repeat(empty)}
      </span>
    );
  };

  const handleDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this title from the list?',
      )
    ) {
      deleteMutation.mutate(movie.id);
    }
  };

  return (
    <article className="movie-card">
      <div className="poster-wrapper">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />
        ) : (
          <div className="poster-fallback">No poster</div>
        )}
      </div>
      <div className="movie-content">
        <div className="movie-main-info">
          <h2 className="movie-title">{movie.title}</h2>
          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <p className="movie-original-title">{movie.originalTitle}</p>
          )}
          <div className="movie-meta">
            <span className="badge">
              {movie.contentType === 'MOVIE' ? 'Movie' : 'TV Series'}
            </span>
            {movie.releaseYear != null && (
              <span className="badge">Year {movie.releaseYear}</span>
            )}
            {movie.tmdbRating !== null && (
              <span className="badge">
                TMDb {formatRating(movie.tmdbRating)}
              </span>
            )}
            {movie.userAvgRating !== null && (
              <span className="badge accent">
                Avg {formatRating(movie.userAvgRating)}
              </span>
            )}
          </div>
          <div className="genres">
            {movie.genres?.map((g) => (
              <span key={g} className="genre-tag">
                {g}
              </span>
            ))}
          </div>
        </div>
        <dl className="movie-details">
          <div className="movie-status-row">
            <span
              className={
                movie.status === 'WATCHED'
                  ? 'status-tag status-tag-watched'
                  : 'status-tag status-tag-planned'
              }
            >
              <span className="status-tag-value">
                {movie.status === 'WATCHED'
                  ? `Watched${movie.watchDate ? ` · ${movie.watchDate}` : ''}`
                  : 'Planned'}
              </span>
            </span>
          </div>
          {movie.innaRating != null || movie.bogdanRating != null ? (
            <div className="movie-ratings-row">
              <div className="movie-ratings-title">Ratings</div>
              <div className="movie-ratings-values">
                {movie.innaRating != null && (
                  <span className="rating-item">
                    <span className="rating-label">Inna</span>
                    <span className="rating-stars">{renderStars(movie.innaRating)}</span>
                  </span>
                )}
                {movie.bogdanRating != null && (
                  <span className="rating-item">
                    <span className="rating-label">Bohdan</span>
                    <span className="rating-stars">{renderStars(movie.bogdanRating)}</span>
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </dl>
        <div className="card-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onEdit(movie)}
          >
            <span aria-hidden="true" className="secondary-button-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 11.5L4.5 9L10.5 3L13 5.5L7 11.5L4.5 11.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="secondary-button-label">Edit</span>
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <span aria-hidden="true" className="danger-button-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="5"
                  y="4"
                  width="6"
                  height="9"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M4 4H12"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M6 4L6.4 2.8C6.55 2.35 6.96 2 7.44 2H8.56C9.04 2 9.45 2.35 9.6 2.8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="danger-button-label">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}

