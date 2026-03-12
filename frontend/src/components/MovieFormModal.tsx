import { useEffect, useState, type FormEvent } from 'react';
import {
  enrichMovieByTitle,
  useCreateMovieMutation,
  useUpdateMovieMutation,
} from '../api/movies';
import type { Movie, MovieStatus } from '../api/movies';
import { apiClient } from '../api/client';

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
    posterUrl: string | null;
    genres: string[] | null;
    imdbRating: number | null;
  } | null>(() =>
    initialMovie
      ? {
          posterUrl: initialMovie.posterUrl ?? null,
          genres: initialMovie.genres ?? null,
          imdbRating:
            initialMovie.imdbRating != null
              ? Number(initialMovie.imdbRating)
              : null,
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation();

  useEffect(() => {
    if (movieId) {
      setForm(formStateFromMovie(initialMovie));
      setMetadataPreview(
        initialMovie
          ? {
              posterUrl: initialMovie.posterUrl ?? null,
              genres: initialMovie.genres ?? null,
              imdbRating:
                initialMovie.imdbRating != null
                  ? Number(initialMovie.imdbRating)
                  : null,
            }
          : null,
      );
      setError(null);
      apiClient
        .get<Movie>(`/movies/${movieId}`)
        .then((res) => {
          const movie = res.data;
          if (!movie) {
            setError('Movie not found.');
            return;
          }
          setForm(formStateFromMovie(movie));
          setMetadataPreview({
            posterUrl: movie.posterUrl ?? null,
            genres: movie.genres ?? null,
            imdbRating:
              movie.imdbRating != null ? Number(movie.imdbRating) : null,
          });
        })
        .catch(() => {
          setError('Failed to load movie for editing.');
        });
    }
  }, [movieId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const innaRating =
      form.innaRating === '' ? null : Number.parseFloat(form.innaRating);
    const bogdanRating =
      form.bogdanRating === '' ? null : Number.parseFloat(form.bogdanRating);

    const payload: any = {
      title: form.title,
      status: form.status,
      watchDate: form.status === 'WATCHED' ? form.watchDate || null : null,
      innaRating,
      bogdanRating,
    };

    if (metadataPreview) {
      payload.posterUrl = metadataPreview.posterUrl;
      payload.genres = metadataPreview.genres;
      payload.imdbRating = metadataPreview.imdbRating;
    }

    try {
      if (isEditing && movieId) {
        await updateMutation.mutateAsync({ id: movieId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError('Failed to save the movie. Please check the form and try again.');
    }
  };

  const handleEnrich = async () => {
    if (!form.title.trim()) return;
    try {
      const enriched = await enrichMovieByTitle(form.title.trim());
      // #region agent log
      fetch(
        'http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'fdb080',
          },
          body: JSON.stringify({
            sessionId: 'fdb080',
            runId: 'pre-fix',
            hypothesisId: 'E_UI_1',
            location: 'MovieFormModal.tsx:handleEnrich',
            message: 'Enrich result in UI',
            data: { title: form.title.trim(), enriched },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion agent log

      if (!enriched) {
        setError('No metadata found for this title.');
        return;
      }
      setMetadataPreview({
        posterUrl: enriched.posterUrl,
        genres: enriched.genres,
        imdbRating: enriched.imdbRating,
      });
    } catch {
      setError('Failed to load metadata from external API.');
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header className="modal-header">
          <h2>{isEditing ? 'Edit Movie' : 'Add Movie'}</h2>
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
            <span>Movie Title</span>
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
            onClick={handleEnrich}
            disabled={!form.title.trim()}
          >
            Refresh Metadata
          </button>

          {metadataPreview && (
            <div className="metadata-preview">
              <div>
                <strong>IMDb Rating:</strong>{' '}
                {metadataPreview.imdbRating ?? '—'}
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
              {isEditing ? 'Save Changes' : 'Save Movie'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

