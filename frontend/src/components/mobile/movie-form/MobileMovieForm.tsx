import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import {
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useSetRatingMutation,
  useListMembersQuery,
  type Movie,
  type MovieStatus,
} from '../../../api/lists';
import { search, type SearchResult } from '../../../api/search';
import { useAuth } from '../../../auth/AuthContext';
import { initialFor } from '../../../lib/avatarColor';
import { Avatar } from '../../Avatar';
import { FilterSectionCard } from '../filters/FilterSectionCard';
import { SegmentedControl } from '../filters/SegmentedControl';

interface MobileMovieFormProps {
  open: boolean;
  listId: string;
  listRole: 'owner' | 'member' | 'viewer';
  movieId: string | null;
  initialMovie: Movie | null;
  onClose: () => void;
}

interface FormState {
  title: string;
  status: MovieStatus;
  watchDate: string;
  ratings: Record<string, string>;
}

function ratingsFromMovie(m: Movie | null): Record<string, string> {
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const r of m.ratings) {
    if (r.rating != null) out[r.userId] = String(r.rating);
  }
  return out;
}

function initialFormState(m: Movie | null): FormState {
  return {
    title: m?.title ?? '',
    status: m?.status ?? 'WANT_TO_WATCH',
    watchDate: m?.watchDate ?? '',
    ratings: ratingsFromMovie(m),
  };
}

function initialMetadata(m: Movie | null): SearchResult | null {
  if (!m) return null;
  return {
    movieId: m.id,
    inCatalog: true,
    tmdbId: m.tmdbId,
    contentType: m.contentType,
    title: m.title,
    originalTitle: m.originalTitle,
    year: m.releaseYear,
    posterUrl: m.posterUrl,
    tmdbRating: m.tmdbRating,
    genres: m.genres,
  };
}

export function MobileMovieForm({
  open,
  listId,
  listRole,
  movieId,
  initialMovie,
  onClose,
}: MobileMovieFormProps) {
  const { user } = useAuth();
  const isEditing = Boolean(movieId);

  const [form, setForm] = useState<FormState>(() => initialFormState(initialMovie));
  const [metadataPreview, setMetadataPreview] = useState<SearchResult | null>(() =>
    initialMetadata(initialMovie),
  );
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MOVIE' | 'TV'>('ALL');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLanguage, setSearchLanguage] = useState<'uk-UA' | 'en-US'>('uk-UA');
  const [selectedKey, setSelectedKey] = useState<string | null>(() =>
    initialMovie ? `${initialMovie.contentType}-${initialMovie.tmdbId ?? initialMovie.id}` : null,
  );

  const { data: members = [] } = useListMembersQuery(listId);
  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation();
  const setRatingMutation = useSetRatingMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const canRateFor = (targetUserId: string) => targetUserId === user?.id || listRole === 'owner';

  const applyRatings = async (listMovieId: string) => {
    for (const [userId, raw] of Object.entries(form.ratings)) {
      if (!canRateFor(userId)) continue;
      const rating = raw === '' ? null : Number.parseFloat(raw);
      await setRatingMutation.mutateAsync({ listMovieId, userId, rating, listId });
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);

    try {
      if (isEditing && movieId) {
        await updateMutation.mutateAsync({
          id: movieId,
          listId,
          payload: {
            status: form.status,
            watchDate: form.status === 'WATCHED' ? form.watchDate || null : null,
          },
        });
        if (form.status === 'WATCHED') await applyRatings(movieId);
      } else {
        if (!metadataPreview) {
          setError('Please pick a match before saving.');
          return;
        }
        const myRating =
          form.status === 'WATCHED' && user && form.ratings[user.id]
            ? Number.parseFloat(form.ratings[user.id])
            : null;
        await createMutation.mutateAsync({
          listId,
          movieId: metadataPreview.inCatalog ? metadataPreview.movieId ?? undefined : undefined,
          tmdbId: !metadataPreview.inCatalog ? metadataPreview.tmdbId ?? undefined : undefined,
          contentType: metadataPreview.contentType,
          status: form.status,
          watchDate: form.status === 'WATCHED' ? form.watchDate || null : null,
          rating: myRating,
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
      const found = await search(
        form.title.trim(),
        searchLanguage,
        typeFilter === 'ALL' ? undefined : typeFilter,
      );
      setResults(found);
      if (found.length === 0) {
        setError('No matches found.');
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setMetadataPreview(result);
    setSelectedKey(`${result.contentType}-${result.tmdbId ?? result.movieId}`);
    setForm((prev) => ({ ...prev, title: result.title || prev.title }));
  };

  const filteredResults = results
    .filter((r) => (typeFilter === 'ALL' ? true : r.contentType === typeFilter))
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
              className="filters-v2 mobile-movie-form"
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
                          UA
                        </button>
                        <button
                          type="button"
                          className={`fv-lang-btn${searchLanguage === 'en-US' ? ' active' : ''}`}
                          onClick={() => setSearchLanguage('en-US')}
                          aria-pressed={searchLanguage === 'en-US'}
                          aria-label="Search in English"
                          title="English"
                        >
                          EN
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="fv-search-btn"
                      onClick={() => void handleSearch()}
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
                          Search
                        </>
                      )}
                    </button>
                  </>
                ) : null}
              </FilterSectionCard>

              {!isEditing && results.length > 0 ? (
                <FilterSectionCard
                  title="Matches"
                  summary={`${results.length} found`}
                >
                  <SegmentedControl<'ALL' | 'MOVIE' | 'TV'>
                    name="result-type"
                    ariaLabel="Filter results by type"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                      { value: 'ALL', label: 'All' },
                      { value: 'MOVIE', label: 'Movies' },
                      { value: 'TV', label: 'TV' },
                    ]}
                  />
                  <div className="fv-tmdb-results">
                    {filteredResults.map((r) => {
                      const key = `${r.contentType}-${r.tmdbId ?? r.movieId}`;
                      const selected = key === selectedKey;
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          className={`fv-tmdb-result${selected ? ' selected' : ''}`}
                          onClick={() => handleSelect(r)}
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
                            {r.inCatalog ? ' · already in a list' : ''}
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
                          {metadataPreview.year ?? '—'}
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
                      ? form.watchDate.slice(5).split('-').reverse().join('.')
                      : 'Not set'
                }
                summaryHighlighted={
                  form.status === 'WATCHED' && Boolean(form.watchDate)
                }
                defaultOpen={form.status === 'WATCHED'}
              >
                <div className="fv-field fv-field-date">
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

              {form.status === 'WATCHED' ? (
                <FilterSectionCard
                  title="Ratings"
                  summary={ratingsSummary(form.ratings, members)}
                  summaryHighlighted={Object.values(form.ratings).some(Boolean)}
                  defaultOpen
                >
                  <div className="fv-rating-row fv-rating-row-dynamic">
                    {members.map((m) => {
                      const editable = canRateFor(m.userId);
                      return (
                        <div className="fv-field" key={m.userId}>
                          <span className="fv-field-label fv-field-label-member">
                            <Avatar
                              userId={m.userId}
                              name={m.name}
                              email={m.email}
                              avatarUrl={m.avatarUrl}
                              className="movie-rating-avatar-dynamic"
                            />
                            {m.name ?? m.email}
                            {m.userId === user?.id ? ' (you)' : ''}
                          </span>
                          <input
                            className="fv-input"
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            placeholder="0–10"
                            disabled={!editable}
                            value={form.ratings[m.userId] ?? ''}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                ratings: { ...prev.ratings, [m.userId]: e.target.value },
                              }))
                            }
                            inputMode="decimal"
                          />
                        </div>
                      );
                    })}
                  </div>
                </FilterSectionCard>
              ) : null}

              <div className="fv-cta-wrap">
                <motion.button
                  type="submit"
                  className="fv-cta"
                  disabled={isSaving || (!isEditing && !metadataPreview)}
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

function ratingsSummary(
  ratings: Record<string, string>,
  members: { userId: string; name: string | null; email: string }[],
) {
  const parts: string[] = [];
  for (const m of members) {
    const v = ratings[m.userId];
    if (v) parts.push(`${initialFor(m.name, m.email)} ${v}`);
  }
  return parts.length ? parts.join(' · ') : 'Not rated';
}
