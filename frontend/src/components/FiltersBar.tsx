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
          className="modal-backdrop filters-panel-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            id={panelId}
            className="modal filters-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header filters-panel-header">
              <h2 className="filters-panel-title" id={titleId}>
                Filters
              </h2>
              <button
                type="button"
                className="icon-button filters-panel-close"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            <div className="modal-body filters-panel-body">
              <section className="filters-panel-section" aria-label="Status">
                <span className="filter-label">Status</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={!status ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
                    onClick={() => onStatusChange(undefined)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={
                      status === 'WATCHED' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'
                    }
                    onClick={() => onStatusChange('WATCHED')}
                  >
                    Watched
                  </button>
                  <button
                    type="button"
                    className={
                      status === 'WANT_TO_WATCH'
                        ? 'toggle-chip toggle-chip-active'
                        : 'toggle-chip'
                    }
                    onClick={() => onStatusChange('WANT_TO_WATCH')}
                  >
                    Planned
                  </button>
                </div>
              </section>

              <section className="filters-panel-section" aria-label="Type">
                <span className="filter-label">Type</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={
                      !contentType ? 'toggle-chip toggle-chip-active' : 'toggle-chip'
                    }
                    onClick={() => onContentTypeChange(undefined)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={
                      contentType === 'MOVIE' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'
                    }
                    onClick={() => onContentTypeChange('MOVIE')}
                  >
                    Movies
                  </button>
                  <button
                    type="button"
                    className={
                      contentType === 'TV' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'
                    }
                    onClick={() => onContentTypeChange('TV')}
                  >
                    TV Series
                  </button>
                </div>
              </section>

              <section className="filters-panel-section" aria-label="Genres">
                <span className="filter-label">Genre</span>
                <div className="genre-chips filters-panel-genre-chips">
                  {genreList.map((genre) => {
                    const active = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        className={active ? 'chip chip-active' : 'chip'}
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
                  <p className="filters-panel-empty-genres">No genres on this page yet.</p>
                ) : null}
              </section>
            </div>

            <div className="modal-footer filters-panel-footer">
              <button type="button" className="secondary-button" onClick={clearAll}>
                Clear all
              </button>
              <button type="button" className="primary-button" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
