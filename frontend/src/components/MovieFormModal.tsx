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
import { useAuth } from '../auth/AuthContext';

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
  const { isReadOnly } = useAuth();
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
  const [searchLanguage, setSearchLanguage] = useState<'uk-UA' | 'en-US'>(
    'uk-UA',
  );
  /** Title from the search result when user selected it (in search language); used for title_ua when search was Ukrainian */
  const [selectedResultTitle, setSelectedResultTitle] = useState<string | null>(
    null,
  );

  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isReadOnly) return;

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
        const titleUaValue =
          searchLanguage === 'uk-UA'
            ? selectedResultTitle?.trim() ?? null
            : null;
        await createMutation.mutateAsync({
          contentType: metadataPreview.contentType,
          title: metadataPreview.title || form.title,
          originalTitle: metadataPreview.originalTitle,
          titleUa: titleUaValue,
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
      const results = await searchMulti(form.title.trim(), searchLanguage);
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
      setSelectedResultTitle(result.title);
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
          <div className="modal-body-top">
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
                readOnly={isEditing}
                aria-readonly={isEditing}
                className={isEditing ? 'input-readonly' : undefined}
              />
            </label>

            {!isEditing && (
              <div className="search-lang-row">
                <span className="search-lang-label">Search by:</span>
                <div className="search-lang-buttons">
                  <button
                    type="button"
                    className={`search-lang-btn ${searchLanguage === 'uk-UA' ? 'search-lang-btn-active' : ''}`}
                    onClick={() => setSearchLanguage('uk-UA')}
                    aria-pressed={searchLanguage === 'uk-UA'}
                    aria-label="Search by Ukrainian title"
                    title="Ukraine (Ukrainian)"
                  >
                    <span className="search-lang-flag" aria-hidden>
                      <svg viewBox="0 0 24 16" width="28" height="19" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="8" fill="#0057B7" />
                        <rect y="8" width="24" height="8" fill="#FFD700" />
                      </svg>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`search-lang-btn ${searchLanguage === 'en-US' ? 'search-lang-btn-active' : ''}`}
                    onClick={() => setSearchLanguage('en-US')}
                    aria-pressed={searchLanguage === 'en-US'}
                    aria-label="Search by British/English title"
                    title="Britain (English)"
                  >
                    <span className="search-lang-flag" aria-hidden>
                      <svg viewBox="0 0 60 30" width="28" height="14" xmlns="http://www.w3.org/2000/svg">
                        <rect width="60" height="30" fill="#012169" />
                        <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
                        <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4" />
                        <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
                        <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {!isEditing && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleSearchTmdb}
                disabled={!form.title.trim() || isSearching}
              >
                {isSearching ? 'Searching…' : 'Search in TMDb'}
              </button>
            )}
          </div>

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
                  .sort((a, b) => {
                    const ay = a.year ?? -Infinity;
                    const by = b.year ?? -Infinity;
                    return by - ay;
                  })
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

          <div className="form-field">
            <span className="form-field-label">Status</span>
            <div
              className="status-toggle"
              role="group"
              aria-label="Status"
            >
              <button
                type="button"
                className={`status-toggle-btn ${form.status === 'WATCHED' ? 'status-toggle-btn-active' : ''}`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, status: 'WATCHED' }))
                }
                aria-pressed={form.status === 'WATCHED'}
                aria-label="Watched"
              >
                Watched
              </button>
              <button
                type="button"
                className={`status-toggle-btn ${form.status === 'WANT_TO_WATCH' ? 'status-toggle-btn-active' : ''}`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, status: 'WANT_TO_WATCH' }))
                }
                aria-pressed={form.status === 'WANT_TO_WATCH'}
                aria-label="Want to Watch"
              >
                Want to Watch
              </button>
            </div>
          </div>

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
              <span>Inna Rating</span>
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
              <span>Bohdan Rating</span>
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
              disabled={isReadOnly || createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Save Changes' : 'Save Entry'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

