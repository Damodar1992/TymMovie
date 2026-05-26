import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import {
  useCreateMovieMutation,
  useUpdateMovieMutation,
  type Movie,
  type MovieStatus,
} from '../../../api/movies';
import {
  searchMulti,
  getMovieDetails,
  getTvDetails,
  buildPosterUrl,
  type TmdbSearchResult,
} from '../../../../lib/tmdb';
import { useAuth } from '../../../auth/AuthContext';
import { FilterSectionCard } from '../filters/FilterSectionCard';
import { SegmentedControl } from '../filters/SegmentedControl';

interface MobileMovieFormProps {
  open: boolean;
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

interface MetadataPreview {
  contentType: 'MOVIE' | 'TV';
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  releaseYear: number | null;
  posterUrl: string | null;
  genres: string[] | null;
  tmdbRating: number | null;
}

function initialFormState(m: Movie | null): FormState {
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

function initialMetadata(m: Movie | null): MetadataPreview | null {
  if (!m) return null;
  return {
    contentType: m.contentType,
    tmdbId: m.tmdbId ?? 0,
    title: m.title,
    originalTitle: m.originalTitle,
    releaseYear: m.releaseYear,
    posterUrl: m.posterUrl ?? null,
    genres: m.genres ?? null,
    tmdbRating: m.tmdbRating != null ? Number(m.tmdbRating) : null,
  };
}

export function MobileMovieForm({
  open,
  movieId,
  initialMovie,
  onClose,
}: MobileMovieFormProps) {
  const { isReadOnly } = useAuth();
  const isEditing = Boolean(movieId);

  const [form, setForm] = useState<FormState>(() =>
    initialFormState(initialMovie),
  );
  const [metadataPreview, setMetadataPreview] = useState<MetadataPreview | null>(
    () => initialMetadata(initialMovie),
  );
  const [error, setError] = useState<string | null>(null);
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbTypeFilter, setTmdbTypeFilter] = useState<'ALL' | 'MOVIE' | 'TV'>(
    'ALL',
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchLanguage, setSearchLanguage] = useState<'uk-UA' | 'en-US'>(
    'uk-UA',
  );
  const [selectedTmdbKey, setSelectedTmdbKey] = useState<string | null>(null);
  const [selectedResultTitle, setSelectedResultTitle] = useState<string | null>(
    null,
  );

  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (isReadOnly) return;
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
          setError('Please pick a match from TMDb before saving.');
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save the movie. Please try again.',
      );
    }
  };

  const handleSearch = async () => {
    if (!form.title.trim()) return;
    try {
      setError(null);
      setIsSearching(true);
      const results = await searchMulti(form.title.trim(), searchLanguage);
      setTmdbResults(results);
      setTmdbTypeFilter('ALL');
      if (results.length === 0) {
        setError('No matches found in TMDb.');
      }
    } catch {
      setError('Failed to load metadata from TMDb.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTmdb = async (result: TmdbSearchResult) => {
    try {
      setError(null);
      setSelectedTmdbKey(`${result.contentType}-${result.tmdbId}`);
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
      setForm((prev) => ({ ...prev, title: details.title || prev.title }));
    } catch {
      setError('Failed to load metadata from TMDb.');
    }
  };

  const filteredTmdb = tmdbResults
    .filter((r) =>
      tmdbTypeFilter === 'ALL' ? true : r.contentType === tmdbTypeFilter,
    )
    .sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity));

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-sheet-root"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={isEditing ? 'Edit entry' : 'Add title'}
          >
            <header className="fv-header">
              <button
                type="button"
                className="fv-header-cancel"
                onClick={onClose}
              >
                Cancel
              </button>

              <h1 className="fv-header-title">
                {isEditing ? 'Edit Entry' : 'Add Title'}
              </h1>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="fv-header-btn fv-header-btn-icon"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>
            </header>

            <form
              className="filters-v2"
              onSubmit={handleSubmit}
              style={{ paddingTop: 8 }}
            >
              {error ? <div className="fv-error-banner">{error}</div> : null}

              <FilterSectionCard
                title="Title"
                summary={form.title ? truncate(form.title, 24) : 'Required'}
                summaryHighlighted={Boolean(form.title)}
              >
                <div className="fv-field">
                  <input
                    className="fv-input"
                    type="text"
                    placeholder="Enter movie or TV show title"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    readOnly={isEditing}
                    aria-readonly={isEditing}
                  />
                </div>

                {!isEditing ? (
                  <>
                    <div className="fv-field">
                      <span className="fv-field-label">Search language</span>
                      <div className="fv-lang-row">
                        <button
                          type="button"
                          className={`fv-lang-btn${searchLanguage === 'uk-UA' ? ' active' : ''}`}
                          onClick={() => setSearchLanguage('uk-UA')}
                          aria-pressed={searchLanguage === 'uk-UA'}
                          aria-label="Search in Ukrainian"
                          title="Ukrainian"
                        >
                          <UkraineFlag />
                        </button>
                        <button
                          type="button"
                          className={`fv-lang-btn${searchLanguage === 'en-US' ? ' active' : ''}`}
                          onClick={() => setSearchLanguage('en-US')}
                          aria-pressed={searchLanguage === 'en-US'}
                          aria-label="Search in English"
                          title="English"
                        >
                          <UkFlag />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="fv-search-btn"
                      onClick={handleSearch}
                      disabled={!form.title.trim() || isSearching}
                    >
                      {isSearching ? (
                        <>
                          <Loader2
                            size={16}
                            strokeWidth={2}
                            className="fv-search-spinner"
                          />
                          Searching…
                        </>
                      ) : (
                        <>
                          <Search size={16} strokeWidth={2} />
                          Search in TMDb
                        </>
                      )}
                    </button>
                  </>
                ) : null}
              </FilterSectionCard>

              {!isEditing && tmdbResults.length > 0 ? (
                <FilterSectionCard
                  title="Matches from TMDb"
                  summary={`${tmdbResults.length} found`}
                >
                  <SegmentedControl<'ALL' | 'MOVIE' | 'TV'>
                    name="tmdb-type"
                    ariaLabel="Filter TMDb results by type"
                    value={tmdbTypeFilter}
                    onChange={setTmdbTypeFilter}
                    options={[
                      { value: 'ALL', label: 'All' },
                      { value: 'MOVIE', label: 'Movies' },
                      { value: 'TV', label: 'TV' },
                    ]}
                  />
                  <div className="fv-tmdb-results">
                    {filteredTmdb.map((r) => {
                      const key = `${r.contentType}-${r.tmdbId}`;
                      const selected = key === selectedTmdbKey;
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          className={`fv-tmdb-result${selected ? ' selected' : ''}`}
                          onClick={() => handleSelectTmdb(r)}
                          whileTap={{ scale: 0.985 }}
                          transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 28,
                          }}
                        >
                          <span className="fv-tmdb-result-title">
                            {r.title}
                            {r.year ? ` (${r.year})` : ''}
                          </span>
                          <span className="fv-tmdb-result-meta">
                            {r.contentType === 'MOVIE' ? 'Movie' : 'TV Series'}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </FilterSectionCard>
              ) : null}

              {metadataPreview ? (
                <FilterSectionCard
                  title={isEditing ? 'Details' : 'Selected match'}
                  summary={
                    metadataPreview.contentType === 'MOVIE'
                      ? 'Movie'
                      : 'TV Series'
                  }
                  summaryHighlighted
                >
                  <div className="fv-meta-row">
                    <div className="fv-meta-poster">
                      {metadataPreview.posterUrl ? (
                        <img
                          src={metadataPreview.posterUrl}
                          alt={metadataPreview.title}
                          loading="lazy"
                        />
                      ) : (
                        <span className="fv-meta-poster-placeholder">
                          No poster
                        </span>
                      )}
                    </div>
                    <div className="fv-meta-info">
                      <div className="fv-meta-row-line">
                        <span className="fv-meta-row-key">Type</span>
                        <span className="fv-meta-row-val">
                          {metadataPreview.contentType === 'MOVIE'
                            ? 'Movie'
                            : 'TV Series'}
                        </span>
                      </div>
                      <div className="fv-meta-row-line">
                        <span className="fv-meta-row-key">Year</span>
                        <span className="fv-meta-row-val">
                          {metadataPreview.releaseYear ?? '—'}
                        </span>
                      </div>
                      <div className="fv-meta-row-line">
                        <span className="fv-meta-row-key">TMDb rating</span>
                        <span className="fv-meta-row-val">
                          {metadataPreview.tmdbRating != null
                            ? metadataPreview.tmdbRating.toFixed(1)
                            : '—'}
                        </span>
                      </div>
                      {metadataPreview.genres &&
                      metadataPreview.genres.length > 0 ? (
                        <div className="fv-meta-genres">
                          {metadataPreview.genres.slice(0, 6).map((g) => (
                            <span key={g} className="fv-meta-genre-chip">
                              {g}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </FilterSectionCard>
              ) : null}

              <FilterSectionCard
                title="Status"
                summary={
                  form.status === 'WATCHED' ? 'Watched' : 'Want to watch'
                }
                summaryHighlighted
              >
                <SegmentedControl<MovieStatus>
                  name="status"
                  ariaLabel="Status"
                  value={form.status}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, status: v }))
                  }
                  options={[
                    { value: 'WANT_TO_WATCH', label: 'Planned' },
                    { value: 'WATCHED', label: 'Watched' },
                  ]}
                />
              </FilterSectionCard>

              <FilterSectionCard
                key={`watch-date-${form.status}`}
                title="Watch date"
                summary={
                  form.status !== 'WATCHED'
                    ? '—'
                    : form.watchDate
                      ? form.watchDate
                      : 'Not set'
                }
                summaryHighlighted={
                  form.status === 'WATCHED' && Boolean(form.watchDate)
                }
                defaultOpen={form.status === 'WATCHED'}
              >
                <div className="fv-field">
                  <input
                    className="fv-input"
                    type="date"
                    value={form.watchDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        watchDate: e.target.value,
                      }))
                    }
                    disabled={form.status !== 'WATCHED'}
                  />
                </div>
              </FilterSectionCard>

              <FilterSectionCard
                title="Ratings"
                summary={ratingsSummary(form.innaRating, form.bogdanRating)}
                summaryHighlighted={Boolean(
                  form.innaRating || form.bogdanRating,
                )}
              >
                <div className="fv-rating-row">
                  <div className="fv-field">
                    <span className="fv-field-label">Inna</span>
                    <input
                      className="fv-input"
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      placeholder="0–10"
                      value={form.innaRating}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          innaRating: e.target.value,
                        }))
                      }
                      inputMode="decimal"
                    />
                  </div>
                  <div className="fv-field">
                    <span className="fv-field-label">Bohdan</span>
                    <input
                      className="fv-input"
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      placeholder="0–10"
                      value={form.bogdanRating}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bogdanRating: e.target.value,
                        }))
                      }
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </FilterSectionCard>

              <div className="fv-cta-wrap">
                <motion.button
                  type="submit"
                  className="fv-cta"
                  disabled={
                    isReadOnly ||
                    isSaving ||
                    (!isEditing && !metadataPreview)
                  }
                  whileTap={{ scale: 0.97 }}
                  transition={{
                    type: 'spring',
                    stiffness: 360,
                    damping: 22,
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        size={18}
                        strokeWidth={2.2}
                        className="fv-search-spinner"
                      />
                      Saving…
                    </>
                  ) : (
                    <span>{isEditing ? 'Save Changes' : 'Save Entry'}</span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function ratingsSummary(inna: string, bohdan: string) {
  if (!inna && !bohdan) return 'Not rated';
  const parts: string[] = [];
  if (inna) parts.push(`I ${inna}`);
  if (bohdan) parts.push(`B ${bohdan}`);
  return parts.join(' · ');
}

function UkraineFlag() {
  return (
    <svg
      viewBox="0 0 24 16"
      width="28"
      height="19"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="8" fill="#0057B7" />
      <rect y="8" width="24" height="8" fill="#FFD700" />
    </svg>
  );
}

function UkFlag() {
  return (
    <svg
      viewBox="0 0 60 30"
      width="28"
      height="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
