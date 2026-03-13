import { useState, type FormEvent } from 'react';
import { useCreateMovieMutation, useUpdateMovieMutation } from '../api/movies';
import {
  searchMulti,
  getMovieDetails,
  getTvDetails,
  buildPosterUrl,
  type TmdbSearchResult,
} from '../../lib/tmdb';
import type { Movie, MovieStatus } from '../api/movies';

interface MovieFormModalProps {
  movieId: string | null;
  initialMovie: Movie | null;
  onClose: () => void;
}

interface FormState {
  title: string;
  status: MovieStatus;
  watchDate: string;
  innaRating: string;
  bogdanRating: string;
}

function formStateFromMovie(m: Movie | null): FormState {
  if (!m) {
    return {
      title: '',
      status: 'WANT_TO_WATCH',
      watchDate: '',
      innaRating: '',
      bogdanRating: '',
    };
  }
  return {
    title: m.title ?? '',
    status: m.status,
    watchDate: m.watchDate ?? '',
    innaRating:
      m.innaRating !== null && m.innaRating !== undefined
        ? String(m.innaRating)
        : '',
    bogdanRating:
      m.bogdanRating !== null && m.bogdanRating !== undefined
        ? String(m.bogdanRating)
        : '',
  };
}

export function MovieFormModal({ movieId, initialMovie, onClose }: MovieFormModalProps) {
  const isEditing = Boolean(movieId);
  const [form, setForm] = useState<FormState>(() =>
    formStateFromMovie(initialMovie),
  );
  const [metadataPreview, setMetadataPreview] = useState<{
    contentType: 'MOVIE' | 'TV';
    tmdbId: number;
    title: string;
    originalTitle: string | null;
    releaseYear: number | null;
    posterUrl: string | null;
    genres: string[] | null;
    tmdbRating: number | null;
  } | null>(() =>
    initialMovie
      ? {
          contentType: initialMovie.contentType,
          tmdbId: initialMovie.tmdbId ?? 0,
          title: initialMovie.title,
          originalTitle: initialMovie.originalTitle,
          releaseYear: initialMovie.releaseYear,
          posterUrl: initialMovie.posterUrl ?? null,
          genres: initialMovie.genres ?? null,
          tmdbRating:
            initialMovie.tmdbRating != null
              ? Number(initialMovie.tmdbRating)
              : null,
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tmdbTypeFilter, setTmdbTypeFilter] = useState<'' | 'MOVIE' | 'TV'>(
    '',
  );

  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const innaRating =
      form.innaRating === '' ? null : Number.parseFloat(form.innaRating);
    const bogdanRating =
      form.bogdanRating === '' ? null : Number.parseFloat(form.bogdanRating);

    try {
      if (isEditing && movieId) {
        await updateMutation.mutateAsync({
          id: movieId,
          payload: {
            status: form.status,
            watchDate:
              form.status === 'WATCHED' ? form.watchDate || null : null,
            innaRating,
            bogdanRating,
          },
        });
      } else {
        if (!metadataPreview) {
          setError('Please fetch metadata from TMDb before saving.');
          return;
        }
        await createMutation.mutateAsync({
          contentType: metadataPreview.contentType,
          title: metadataPreview.title || form.title,
          originalTitle: metadataPreview.originalTitle,
          tmdbId: metadataPreview.tmdbId,
          posterUrl: metadataPreview.posterUrl,
          genres: metadataPreview.genres,
          tmdbRating: metadataPreview.tmdbRating,
          releaseYear: metadataPreview.releaseYear,
          status: form.status,
          watchDate:
            form.status === 'WATCHED' ? form.watchDate || null : null,
          innaRating,
          bogdanRating,
        });
      }
      onClose();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(
          'Failed to save the movie. Please check the form and try again.',
        );
      }
    }
  };

  const handleSearchTmdb = async () => {
    if (!form.title.trim()) return;
    try {
      setError(null);
      setIsSearching(true);
      const results = await searchMulti(form.title.trim());
      setTmdbResults(results);
      setTmdbTypeFilter('');
      if (results.length === 0) {
        setError('No metadata found for this title.');
      }
    } catch {
      setError('Failed to load metadata from external API.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTmdb = async (result: TmdbSearchResult) => {
    try {
      setError(null);
      const details =
        result.contentType === 'MOVIE'
          ? await getMovieDetails(result.tmdbId)
          : await getTvDetails(result.tmdbId);
      const posterUrl = await buildPosterUrl(details.posterPath, 'w342');
      setMetadataPreview({
        contentType: details.contentType,
        tmdbId: details.tmdbId,
        title: details.title,
        originalTitle: details.originalTitle,
        releaseYear: details.releaseYear,
        posterUrl,
        genres: details.genres,
        tmdbRating: details.tmdbRating,
      });
      setForm((prev) => ({
        ...prev,
        title: details.title || prev.title,
      }));
    } catch {
      setError('Failed to load metadata from external API.');
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header className="modal-header">
          <h2>{isEditing ? 'Edit Entry' : 'Add Title'}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          <label>
            <span>Title</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </label>

          <button
            type="button"
            className="secondary-button"
            onClick={handleSearchTmdb}
            disabled={!form.title.trim() || isSearching}
          >
            {isSearching ? 'Searching…' : 'Search in TMDb'}
          </button>

          {tmdbResults.length > 0 && (
            <div className="tmdb-results">
              <p>Select a match from TMDb:</p>
              <div className="tmdb-results-filter">
                <label>
                  <span>Filter by type</span>
                  <select
                    value={tmdbTypeFilter}
                    onChange={(e) =>
                      setTmdbTypeFilter(
                        e.target.value as '' | 'MOVIE' | 'TV',
                      )
                    }
                  >
                    <option value="">All</option>
                    <option value="MOVIE">Movies</option>
                    <option value="TV">TV Series</option>
                  </select>
                </label>
              </div>
              <ul className="tmdb-results-list">
                {tmdbResults
                  .filter((r) =>
                    tmdbTypeFilter ? r.contentType === tmdbTypeFilter : true,
                  )
                  .map((r) => (
                    <li key={`${r.contentType}-${r.tmdbId}`}>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => handleSelectTmdb(r)}
                      >
                        {r.title}
                        {r.year ? ` (${r.year})` : ''} —{' '}
                        {r.contentType === 'MOVIE' ? 'Movie' : 'TV Series'}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {metadataPreview && (
            <div className="metadata-preview">
              <div>
                <strong>Type:</strong>{' '}
                {metadataPreview.contentType === 'MOVIE'
                  ? 'Movie'
                  : 'TV Series'}
              </div>
              <div>
                <strong>Release year:</strong>{' '}
                {metadataPreview.releaseYear ?? '—'}
              </div>
              <div>
                <strong>TMDb Rating:</strong>{' '}
                {metadataPreview.tmdbRating ?? '—'}
              </div>
              <div>
                <strong>Genres:</strong>{' '}
                {metadataPreview.genres?.join(', ') ?? '—'}
              </div>
            </div>
          )}

          <label>
            <span>Status</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as MovieStatus,
                }))
              }
              required
            >
              <option value="WATCHED">Watched</option>
              <option value="WANT_TO_WATCH">Want to Watch</option>
            </select>
          </label>

          <label>
            <span>Watch Date</span>
            <input
              type="date"
              value={form.watchDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, watchDate: e.target.value }))
              }
              disabled={form.status === 'WANT_TO_WATCH'}
            />
          </label>

          <div className="ratings-row">
            <label>
              <span>Inna&apos;s Rating (0–10, step 0.5)</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={form.innaRating}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, innaRating: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Bogdan&apos;s Rating (0–10, step 0.5)</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={form.bogdanRating}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bogdanRating: e.target.value }))
                }
              />
            </label>
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Save Changes' : 'Save Entry'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

