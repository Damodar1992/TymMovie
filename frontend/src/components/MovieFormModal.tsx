import { useMemo, useState, type FormEvent } from 'react';
import { Check, Search, Loader2 } from 'lucide-react';
import { useCreateMovieMutation, useUpdateMovieMutation } from '../api/movies';
import {
  searchMulti,
  getMovieDetails,
  getTvDetails,
  buildPosterUrl,
  type TmdbSearchResult,
} from '../api/tmdb';
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

function thumbUrl(posterPath: string | null): string | null {
  return posterPath ? `https://image.tmdb.org/t/p/w92${posterPath}` : null;
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
  const [tmdbTypeFilter, setTmdbTypeFilter] = useState<'' | 'MOVIE' | 'TV'>('');
  const [searchLanguage, setSearchLanguage] = useState<'uk-UA' | 'en-US'>('uk-UA');
  const [selectedResultTitle, setSelectedResultTitle] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation();

  const selectedKey = metadataPreview
    ? `${metadataPreview.contentType}-${metadataPreview.tmdbId}`
    : null;

  const filteredResults = useMemo(
    () =>
      tmdbResults
        .filter((r) => (tmdbTypeFilter ? r.contentType === tmdbTypeFilter : true))
        .sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity)),
    [tmdbResults, tmdbTypeFilter],
  );

  const statusLabel = form.status === 'WATCHED' ? 'Watched' : 'Want to Watch';
  const canSave =
    !isReadOnly &&
    !createMutation.isPending &&
    !updateMutation.isPending &&
    (isEditing || Boolean(metadataPreview));

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
            watchDate: form.status === 'WATCHED' ? form.watchDate || null : null,
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
          searchLanguage === 'uk-UA' ? selectedResultTitle?.trim() ?? null : null;
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
          watchDate: form.status === 'WATCHED' ? form.watchDate || null : null,
          innaRating,
          bogdanRating,
        });
      }
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save the movie. Please check the form and try again.');
      }
    }
  };

  const handleSearchTmdb = async () => {
    if (!form.title.trim()) return;
    try {
      setError(null);
      setIsSearching(true);
      setHasSearched(true);
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
    <div className="movie-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className={`movie-drawer movie-form-drawer ${isEditing ? 'is-editing' : 'is-creating'}`}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit entry' : 'Add title'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="movie-form-drawer-head">
          <h2 className="movie-form-drawer-title">
            {isEditing ? 'Edit entry' : 'Add title'}
          </h2>
          <button
            type="button"
            className="movie-form-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="movie-form-drawer-body" onSubmit={handleSubmit}>
          <div className="movie-form-drawer-scroll">
            {error ? <div className="mfd-error">{error}</div> : null}

            <section className="mfd-card">
              <div className="mfd-card-head">
                <span>Title</span>
                <b className={form.title.trim() ? 'is-ok' : ''}>
                  {form.title.trim() ? 'Ready' : 'Required'}
                </b>
              </div>
              <input
                className="mfd-input"
                type="text"
                required
                placeholder="Enter movie or TV show title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                readOnly={isEditing}
                aria-readonly={isEditing}
              />

              {!isEditing ? (
                <div className="mfd-search-row">
                  <div className="mfd-search-by">
                    <span>Search by</span>
                    <div className="mfd-pills" role="group" aria-label="Search language">
                      <button
                        type="button"
                        className={searchLanguage === 'uk-UA' ? 'is-active' : undefined}
                        onClick={() => setSearchLanguage('uk-UA')}
                        aria-pressed={searchLanguage === 'uk-UA'}
                      >
                        UA
                      </button>
                      <button
                        type="button"
                        className={searchLanguage === 'en-US' ? 'is-active' : undefined}
                        onClick={() => setSearchLanguage('en-US')}
                        aria-pressed={searchLanguage === 'en-US'}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mfd-search-btn"
                    onClick={() => void handleSearchTmdb()}
                    disabled={!form.title.trim() || isSearching}
                  >
                    {isSearching ? (
                      <Loader2 size={16} className="mfd-spin" />
                    ) : (
                      <Search size={16} strokeWidth={2} />
                    )}
                    {isSearching ? 'Searching…' : 'Search in TMDb'}
                  </button>
                </div>
              ) : null}
            </section>

            {!isEditing && hasSearched && tmdbResults.length > 0 ? (
              <section className="mfd-card">
                <div className="mfd-card-head">
                  <span>Matches from TMDb</span>
                  <b>{tmdbResults.length} found</b>
                </div>
                <div className="mfd-pills mfd-pills-filter" role="group" aria-label="Filter by type">
                  <button
                    type="button"
                    className={tmdbTypeFilter === '' ? 'is-active' : undefined}
                    onClick={() => setTmdbTypeFilter('')}
                    aria-pressed={tmdbTypeFilter === ''}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={tmdbTypeFilter === 'MOVIE' ? 'is-active' : undefined}
                    onClick={() => setTmdbTypeFilter('MOVIE')}
                    aria-pressed={tmdbTypeFilter === 'MOVIE'}
                  >
                    Movies
                  </button>
                  <button
                    type="button"
                    className={tmdbTypeFilter === 'TV' ? 'is-active' : undefined}
                    onClick={() => setTmdbTypeFilter('TV')}
                    aria-pressed={tmdbTypeFilter === 'TV'}
                  >
                    TV
                  </button>
                </div>
                <ul className="mfd-matches">
                  {filteredResults.map((r) => {
                    const key = `${r.contentType}-${r.tmdbId}`;
                    const selected = key === selectedKey;
                    const poster = thumbUrl(r.posterPath);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          className={`mfd-match${selected ? ' is-selected' : ''}`}
                          onClick={() => void handleSelectTmdb(r)}
                        >
                          <span className={`mfd-match-poster tone-${r.contentType.toLowerCase()}`}>
                            {poster ? <img src={poster} alt="" loading="lazy" /> : null}
                          </span>
                          <span className="mfd-match-copy">
                            <strong>{r.title}</strong>
                            <em>
                              {r.year ?? '—'} · {r.contentType === 'MOVIE' ? 'Movie' : 'TV'}
                            </em>
                          </span>
                          {selected ? (
                            <Check className="mfd-match-check" size={18} strokeWidth={2.5} />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {metadataPreview ? (
              <section className="mfd-card mfd-selected">
                <div className="mfd-card-head">
                  <span>{isEditing ? 'Details' : 'Selected match'}</span>
                  <b>
                    {metadataPreview.contentType === 'MOVIE' ? 'Movie' : 'TV Series'}
                  </b>
                </div>
                <div className="mfd-selected-row">
                  <div className="mfd-selected-poster">
                    {metadataPreview.posterUrl ? (
                      <img src={metadataPreview.posterUrl} alt="" />
                    ) : (
                      <span>No poster</span>
                    )}
                  </div>
                  <div className="mfd-selected-meta">
                    <p>{metadataPreview.title}</p>
                    <span>
                      {metadataPreview.releaseYear ?? '—'} · TMDb{' '}
                      {metadataPreview.tmdbRating?.toFixed(1) ?? '—'}
                    </span>
                    <span>{metadataPreview.genres?.join(' · ') || '—'}</span>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="mfd-card">
              <div className="mfd-card-head">
                <span>Status</span>
                <b>{statusLabel}</b>
              </div>
              <div className="mfd-status" role="group" aria-label="Status">
                <button
                  type="button"
                  className={form.status === 'WATCHED' ? 'is-active' : undefined}
                  onClick={() => setForm((prev) => ({ ...prev, status: 'WATCHED' }))}
                  aria-pressed={form.status === 'WATCHED'}
                >
                  Watched
                </button>
                <button
                  type="button"
                  className={form.status === 'WANT_TO_WATCH' ? 'is-active' : undefined}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: 'WANT_TO_WATCH' }))
                  }
                  aria-pressed={form.status === 'WANT_TO_WATCH'}
                >
                  Want to Watch
                </button>
              </div>

              {form.status === 'WATCHED' ? (
                <>
                  <label className="mfd-field">
                    <span>Watch date</span>
                    <input
                      className="mfd-input"
                      type="date"
                      value={form.watchDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, watchDate: e.target.value }))
                      }
                    />
                  </label>

                  <div className="mfd-ratings">
                    <label className="mfd-field">
                      <span>Inna rating</span>
                      <input
                        className="mfd-input"
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        placeholder="0-10"
                        value={form.innaRating}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, innaRating: e.target.value }))
                        }
                      />
                    </label>
                    <label className="mfd-field">
                      <span>Bohdan rating</span>
                      <input
                        className="mfd-input"
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        placeholder="0-10"
                        value={form.bogdanRating}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, bogdanRating: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </section>
          </div>

          <footer className="movie-form-drawer-footer">
            <p className="mfd-footer-hint">
              {isEditing
                ? 'Update status, date, or ratings'
                : 'Pick a TMDb match to link artwork'}
            </p>
            <div className="mfd-footer-actions">
              <button type="button" className="mfd-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="mfd-btn-save" disabled={!canSave}>
                <Check size={16} strokeWidth={2.5} />
                {isEditing ? 'Save changes' : 'Save entry'}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
}
