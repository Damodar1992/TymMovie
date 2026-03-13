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
            <span className="status-tag">
              <span className="status-tag-label">Status:</span>
              <span className="status-tag-value">
                {movie.status === 'WATCHED' ? 'Watched' : 'Want to Watch'}
              </span>
            </span>
            <span className="status-tag">
              <span className="status-tag-label">Watch Date:</span>
              <span className="status-tag-value">
                {movie.watchDate ?? '—'}
              </span>
            </span>
          </div>
          <div className="movie-ratings-row">
            <div>
              <dt>Inna&apos;s Rating</dt>
              <dd>{renderStars(movie.innaRating)}</dd>
            </div>
            <div>
              <dt>Bogdan&apos;s Rating</dt>
              <dd>{renderStars(movie.bogdanRating)}</dd>
            </div>
          </div>
        </dl>
        <div className="card-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onEdit(movie)}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

