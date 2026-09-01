import { useMemo, useState, type FormEvent } from 'react';
import { Check, Search, Loader2, Play } from 'lucide-react';
import {
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useSetRatingMutation,
  useListMembersQuery,
  type Movie,
  type MovieStatus,
} from '../api/lists';
import { search, type SearchResult } from '../api/search';
import { useAuth } from '../auth/AuthContext';
import { youtubeTrailerUrl } from '../lib/trailer';
import { Avatar } from './Avatar';

interface MovieFormModalProps {
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

function formStateFromMovie(m: Movie | null): FormState {
  return {
    title: m?.title ?? '',
    status: m?.status ?? 'WANT_TO_WATCH',
    watchDate: m?.watchDate ?? '',
    ratings: ratingsFromMovie(m),
  };
}

export function MovieFormModal({ listId, listRole, movieId, initialMovie, onClose }: MovieFormModalProps) {
  const { user } = useAuth();
  const isEditing = Boolean(movieId);
  const [form, setForm] = useState<FormState>(() => formStateFromMovie(initialMovie));
  const [metadataPreview, setMetadataPreview] = useState<SearchResult | null>(() =>
    initialMovie
      ? {
          movieId: initialMovie.id,
          inCatalog: true,
          tmdbId: initialMovie.tmdbId,
          contentType: initialMovie.contentType,
          title: initialMovie.title,
          originalTitle: initialMovie.originalTitle,
          year: initialMovie.releaseYear,
          posterUrl: initialMovie.posterUrl,
          tmdbRating: initialMovie.tmdbRating,
          genres: initialMovie.genres,
          trailerKey: initialMovie.trailerKey,
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'' | 'MOVIE' | 'TV'>('');
  const [searchLanguage, setSearchLanguage] = useState<'uk-UA' | 'en-US'>('uk-UA');
  const [hasSearched, setHasSearched] = useState(false);

  const { data: members = [] } = useListMembersQuery(listId);
  const createMutation = useCreateMovieMutation();
  const updateMutation = useUpdateMovieMutation();
  const setRatingMutation = useSetRatingMutation();

  const canRateFor = (targetUserId: string) => targetUserId === user?.id || listRole === 'owner';

  const selectedKey = metadataPreview
    ? `${metadataPreview.contentType}-${metadataPreview.tmdbId ?? metadataPreview.movieId}`
    : null;

  const filteredResults = useMemo(
    () =>
      results
        .filter((r) => (typeFilter ? r.contentType === typeFilter : true))
        .sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity)),
    [results, typeFilter],
  );

  const statusLabel = form.status === 'WATCHED' ? 'Watched' : 'Want to Watch';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canSave = !isSaving && (isEditing || Boolean(metadataPreview));

  const applyRatings = async (listMovieId: string) => {
    const entries = Object.entries(form.ratings);
    for (const [userId, raw] of entries) {
      if (!canRateFor(userId)) continue;
      const rating = raw === '' ? null : Number.parseFloat(raw);
      await setRatingMutation.mutateAsync({ listMovieId, userId, rating, listId });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
        const created = await createMutation.mutateAsync({
          listId,
          movieId: metadataPreview.inCatalog ? metadataPreview.movieId ?? undefined : undefined,
          tmdbId: !metadataPreview.inCatalog ? metadataPreview.tmdbId ?? undefined : undefined,
          contentType: metadataPreview.contentType,
          status: form.status,
          watchDate: form.status === 'WATCHED' ? form.watchDate || null : null,
          rating: myRating,
        });
        // Owner filling in someone else's rating right away needs the new
        // list_movies id, which the create response doesn't return here —
        // the query cache is invalidated so it will show up on refresh;
        // for others' ratings on a brand-new entry, editing it right after
        // covers that case. (Your own rating above is already saved.)
        void created;
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the movie.');
    }
  };

  const handleSearch = async () => {
    if (!form.title.trim()) return;
    try {
      setError(null);
      setIsSearching(true);
      setHasSearched(true);
      const found = await search(form.title.trim(), searchLanguage, typeFilter || undefined);
      setResults(found);
      if (found.length === 0) setError('No matches found.');
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setMetadataPreview(result);
    setForm((prev) => ({ ...prev, title: result.title || prev.title }));
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
          <h2 className="movie-form-drawer-title">{isEditing ? 'Edit entry' : 'Add title'}</h2>
          <button type="button" className="movie-form-drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="movie-form-drawer-body" onSubmit={handleSubmit}>
          <div className="movie-form-drawer-scroll">
            {error ? <div className="mfd-error">{error}</div> : null}

            <section className="mfd-card">
              <div className="mfd-card-head">
                <span>Title</span>
                <b className={form.title.trim() ? 'is-ok' : ''}>{form.title.trim() ? 'Ready' : 'Required'}</b>
              </div>
              <input
                className="mfd-input"
                type="text"
                required
                placeholder="Enter movie or TV show title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                readOnly={isEditing}
                aria-readonly={isEditing}
              />

              {!isEditing ? (
                <div className="mfd-search-row">
                  <div className="mfd-search-by">
                    <span>Search by</span>
                    <div className="mfd-pills" role="group" aria-label="Search language">
                      <button type="button" className={searchLanguage === 'uk-UA' ? 'is-active' : undefined} onClick={() => setSearchLanguage('uk-UA')} aria-pressed={searchLanguage === 'uk-UA'}>UA</button>
                      <button type="button" className={searchLanguage === 'en-US' ? 'is-active' : undefined} onClick={() => setSearchLanguage('en-US')} aria-pressed={searchLanguage === 'en-US'}>EN</button>
                    </div>
                  </div>
                  <button type="button" className="mfd-search-btn" onClick={() => void handleSearch()} disabled={!form.title.trim() || isSearching}>
                    {isSearching ? <Loader2 size={16} className="mfd-spin" /> : <Search size={16} strokeWidth={2} />}
                    {isSearching ? 'Searching…' : 'Search'}
                  </button>
                </div>
              ) : null}
            </section>

            {!isEditing && hasSearched && results.length > 0 ? (
              <section className="mfd-card">
                <div className="mfd-card-head">
                  <span>Matches</span>
                  <b>{results.length} found</b>
                </div>
                <div className="mfd-pills mfd-pills-filter" role="group" aria-label="Filter by type">
                  <button type="button" className={typeFilter === '' ? 'is-active' : undefined} onClick={() => setTypeFilter('')} aria-pressed={typeFilter === ''}>All</button>
                  <button type="button" className={typeFilter === 'MOVIE' ? 'is-active' : undefined} onClick={() => setTypeFilter('MOVIE')} aria-pressed={typeFilter === 'MOVIE'}>Movies</button>
                  <button type="button" className={typeFilter === 'TV' ? 'is-active' : undefined} onClick={() => setTypeFilter('TV')} aria-pressed={typeFilter === 'TV'}>TV</button>
                </div>
                <ul className="mfd-matches">
                  {filteredResults.map((r) => {
                    const key = `${r.contentType}-${r.tmdbId ?? r.movieId}`;
                    const selected = key === selectedKey;
                    return (
                      <li key={key}>
                        <button type="button" className={`mfd-match${selected ? ' is-selected' : ''}`} onClick={() => handleSelect(r)}>
                          <span className={`mfd-match-poster tone-${r.contentType.toLowerCase()}`}>
                            {r.posterUrl ? <img src={r.posterUrl} alt="" loading="lazy" /> : null}
                          </span>
                          <span className="mfd-match-copy">
                            <strong>{r.title}</strong>
                            <em>
                              {r.year ?? '—'} · {r.contentType === 'MOVIE' ? 'Movie' : 'TV'}
                              {r.inCatalog ? ' · already in a list' : ''}
                            </em>
                          </span>
                          {selected ? <Check className="mfd-match-check" size={18} strokeWidth={2.5} /> : null}
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
                  <b>{metadataPreview.contentType === 'MOVIE' ? 'Movie' : 'TV Series'}</b>
                </div>
                <div className="mfd-selected-row">
                  <div className="mfd-selected-poster">
                    {metadataPreview.posterUrl ? <img src={metadataPreview.posterUrl} alt="" /> : <span>No poster</span>}
                  </div>
                  <div className="mfd-selected-meta">
                    <p>{metadataPreview.title}</p>
                    <span>{metadataPreview.year ?? '—'} · TMDb {metadataPreview.tmdbRating?.toFixed(1) ?? '—'}</span>
                    <span>{metadataPreview.genres?.join(' · ') || '—'}</span>
                    {metadataPreview.trailerKey ? (
                      <a
                        className="mfd-selected-trailer"
                        href={youtubeTrailerUrl(metadataPreview.trailerKey)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Watch trailer"
                      >
                        <Play size={13} strokeWidth={2.2} aria-hidden />
                        Trailer
                      </a>
                    ) : null}
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
                <button type="button" className={form.status === 'WATCHED' ? 'is-active' : undefined} onClick={() => setForm((prev) => ({ ...prev, status: 'WATCHED' }))} aria-pressed={form.status === 'WATCHED'}>Watched</button>
                <button type="button" className={form.status === 'WANT_TO_WATCH' ? 'is-active' : undefined} onClick={() => setForm((prev) => ({ ...prev, status: 'WANT_TO_WATCH' }))} aria-pressed={form.status === 'WANT_TO_WATCH'}>Want to Watch</button>
              </div>

              {form.status === 'WATCHED' ? (
                <>
                  <label className="mfd-field">
                    <span>Watch date</span>
                    <input className="mfd-input" type="date" value={form.watchDate} onChange={(e) => setForm((prev) => ({ ...prev, watchDate: e.target.value }))} />
                  </label>

                  <div className="mfd-ratings">
                    {members.map((m) => {
                      const editable = canRateFor(m.userId);
                      return (
                        <label className="mfd-field" key={m.userId}>
                          <span>
                            <Avatar
                              userId={m.userId}
                              name={m.name}
                              email={m.email}
                              avatarUrl={m.avatarUrl}
                              className="movie-rating-avatar-dynamic"
                              style={{ marginRight: 6 }}
                            />
                            {m.name ?? m.email}
                            {m.userId === user?.id ? ' (you)' : ''}
                          </span>
                          <input
                            className="mfd-input"
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            placeholder="0-10"
                            disabled={!editable}
                            value={form.ratings[m.userId] ?? ''}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                ratings: { ...prev.ratings, [m.userId]: e.target.value },
                              }))
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </section>
          </div>

          <footer className="movie-form-drawer-footer">
            <p className="mfd-footer-hint">
              {isEditing ? 'Update status, date, or ratings' : 'Pick a match to link artwork'}
            </p>
            <div className="mfd-footer-actions">
              <button type="button" className="mfd-btn-cancel" onClick={onClose}>Cancel</button>
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
