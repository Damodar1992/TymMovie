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
  return (
    <div className="filters-bar">
      <div className="filters-row filters-row-primary">
        <div className="filter-toggle-group">
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
        </div>

        <div className="filter-toggle-group">
          <span className="filter-label">Type</span>
          <div className="toggle-group">
            <button
              type="button"
              className={!contentType ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
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
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={() => {
            onStatusChange(undefined);
            onContentTypeChange(undefined);
            onGenresChange([]);
          }}
          aria-label="Clear filters"
        >
          <img
            src="/delete_filter.svg"
            alt=""
            style={{ width: 20, height: 20, display: 'block' }}
          />
        </button>
      </div>

      <div className="filters-row filters-row-genres">
        <div className="genre-filter">
          <span>Filter by Genre</span>
          <div className="genre-chips">
              {(availableGenres.length > 0 ? availableGenres : selectedGenres).map(
                (genre) => {
                const active = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    className={active ? 'chip chip-active' : 'chip'}
                    onClick={() => {
                      if (active) {
                        onGenresChange(
                          selectedGenres.filter((g) => g !== genre),
                        );
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
        </div>
      </div>
    </div>
  );
}

