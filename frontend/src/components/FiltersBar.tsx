import { useEffect, useId, useState } from 'react';
import type { MovieStatus } from '../api/movies';

interface FiltersBarProps {
  status?: MovieStatus;
  onStatusChange: (status: MovieStatus | undefined) => void;
  contentType?: 'MOVIE' | 'TV';
  onContentTypeChange: (type: 'MOVIE' | 'TV' | undefined) => void;
  availableGenres: string[];
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

export function FiltersBar({
  status,
  onStatusChange,
  contentType,
  onContentTypeChange,
  availableGenres,
  selectedGenres,
  onGenresChange,
}: FiltersBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();

  const activeCount =
    (status !== undefined ? 1 : 0) +
    (contentType !== undefined ? 1 : 0) +
    selectedGenres.length;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const clearAll = () => {
    onStatusChange(undefined);
    onContentTypeChange(undefined);
    onGenresChange([]);
  };

  const genreList =
    availableGenres.length > 0 ? availableGenres : selectedGenres;

  return (
    <div className="filters-bar filters-bar-trigger-wrap">
      <button
        type="button"
        className="filters-trigger"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
      >
        <span>Filters</span>
        {activeCount > 0 ? (
          <span className="filters-trigger-badge" aria-label={`${activeCount} active`}>
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="movie-drawer-backdrop filters-drawer-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <aside
            id={panelId}
            className="movie-drawer filters-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="movie-drawer-top">
              <span>Filters</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters">
                ×
              </button>
            </div>
            <h2 className="filters-drawer-title" id={titleId}>
              Filters
            </h2>
            <p className="filters-drawer-summary">
              {activeCount > 0 ? `${activeCount} active` : 'All titles'}
            </p>

            <div className="filters-drawer-scroll">
              <section className="mfd-card" aria-label="Status">
                <div className="mfd-card-head">
                  <span>Status</span>
                </div>
                <div className="mfd-status" role="group">
                  <button
                    type="button"
                    className={!status ? 'is-active' : undefined}
                    onClick={() => onStatusChange(undefined)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={status === 'WATCHED' ? 'is-active' : undefined}
                    onClick={() => onStatusChange('WATCHED')}
                  >
                    Watched
                  </button>
                  <button
                    type="button"
                    className={status === 'WANT_TO_WATCH' ? 'is-active' : undefined}
                    onClick={() => onStatusChange('WANT_TO_WATCH')}
                  >
                    Planned
                  </button>
                </div>
              </section>

              <section className="mfd-card" aria-label="Type">
                <div className="mfd-card-head">
                  <span>Type</span>
                </div>
                <div className="mfd-status" role="group">
                  <button
                    type="button"
                    className={!contentType ? 'is-active' : undefined}
                    onClick={() => onContentTypeChange(undefined)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={contentType === 'MOVIE' ? 'is-active' : undefined}
                    onClick={() => onContentTypeChange('MOVIE')}
                  >
                    Movies
                  </button>
                  <button
                    type="button"
                    className={contentType === 'TV' ? 'is-active' : undefined}
                    onClick={() => onContentTypeChange('TV')}
                  >
                    TV Series
                  </button>
                </div>
              </section>

              <section className="mfd-card" aria-label="Genres">
                <div className="mfd-card-head">
                  <span>Genres</span>
                  {selectedGenres.length > 0 ? <b>{selectedGenres.length} selected</b> : null}
                </div>
                <div className="filters-drawer-genres">
                  {genreList.map((genre) => {
                    const active = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        className={active ? 'is-active' : undefined}
                        onClick={() => {
                          if (active) {
                            onGenresChange(selectedGenres.filter((g) => g !== genre));
                          } else {
                            onGenresChange([...selectedGenres, genre]);
                          }
                        }}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
                {genreList.length === 0 ? (
                  <p className="filters-drawer-empty">No genres on this page yet.</p>
                ) : null}
              </section>
            </div>

            <footer className="movie-form-drawer-footer">
              <button
                type="button"
                className="mfd-btn-cancel"
                onClick={clearAll}
                disabled={activeCount === 0}
              >
                Clear all
              </button>
              <button type="button" className="mfd-btn-save" onClick={() => setOpen(false)}>
                Filter
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
