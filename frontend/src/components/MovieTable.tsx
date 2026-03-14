import type { Movie } from '../api/movies';
import { useDeleteMovieMutation } from '../api/movies';

type TitleLang = 'en' | 'ua';

interface MovieTableProps {
  movies: Movie[];
  titleLang: TitleLang;
  onEdit: (movie: Movie) => void;
}

export function MovieTable({ movies, titleLang, onEdit }: MovieTableProps) {
  const deleteMutation = useDeleteMovieMutation();

  const handleDelete = (movie: Movie) => {
    if (
      window.confirm(
        'Are you sure you want to delete this title from the list?',
      )
    ) {
      deleteMutation.mutate(movie.id);
    }
  };

  return (
    <div className="movie-table-wrapper">
      <table className="movie-table">
        <caption className="movie-table-caption">Movies list</caption>
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Year</th>
            <th scope="col">Status</th>
            <th scope="col">Tym</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => {
            const tymRating =
              movie.innaRating != null &&
              movie.bogdanRating != null &&
              movie.userAvgRating != null
                ? movie.userAvgRating
                : null;
            const displayTitle =
              titleLang === 'ua' && movie.titleUa?.trim()
                ? movie.titleUa
                : movie.title;
            return (
              <tr key={movie.id}>
                <td data-label="Title">
                  <span className="movie-table-title">{displayTitle}</span>
                  {movie.originalTitle &&
                    movie.originalTitle !== displayTitle && (
                      <span className="movie-table-original">
                        {' '}
                        ({movie.originalTitle})
                      </span>
                    )}
                </td>
                <td data-label="Year">{movie.releaseYear ?? '—'}</td>
                <td data-label="Status">
                  <span
                    className={
                      movie.status === 'WATCHED'
                        ? 'status-tag status-tag-watched'
                        : 'status-tag status-tag-planned'
                    }
                  >
                    {movie.status === 'WATCHED'
                      ? `Watched${movie.watchDate ? ` · ${movie.watchDate}` : ''}`
                      : 'Planned'}
                  </span>
                </td>
                <td data-label="Tym">{tymRating != null ? tymRating.toFixed(1) : '—'}</td>
                <td data-label="Actions" className="movie-table-cell-actions">
                  <div className="movie-table-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => onEdit(movie)}
                      aria-label={`Edit ${displayTitle}`}
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
                      onClick={() => handleDelete(movie)}
                      disabled={deleteMutation.isPending}
                      aria-label={`Delete ${displayTitle}`}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
