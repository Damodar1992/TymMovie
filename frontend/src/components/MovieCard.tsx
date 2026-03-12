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

  const handleDelete = () => {
    if (
      window.confirm('Are you sure you want to delete this movie from the list?')
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
        <h2 className="movie-title">{movie.title}</h2>
        {movie.originalTitle && movie.originalTitle !== movie.title && (
          <p className="movie-original-title">{movie.originalTitle}</p>
        )}
        <div className="movie-meta">
          {movie.imdbRating !== null && (
            <span className="badge">IMDb {formatRating(movie.imdbRating)}</span>
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
        <dl className="movie-details">
          <div>
            <dt>Status</dt>
            <dd>{movie.status === 'WATCHED' ? 'Watched' : 'Want to Watch'}</dd>
          </div>
          <div>
            <dt>Watch Date</dt>
            <dd>{movie.watchDate ?? '—'}</dd>
          </div>
          <div>
            <dt>Inna&apos;s Rating</dt>
            <dd>{formatRating(movie.innaRating)}</dd>
          </div>
          <div>
            <dt>Bogdan&apos;s Rating</dt>
            <dd>{formatRating(movie.bogdanRating)}</dd>
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

