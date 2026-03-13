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
      <label>
        <span>Status</span>
        <select
          value={status ?? ''}
          onChange={(e) => {
            const val = e.target.value as MovieStatus | '';
            onStatusChange(val === '' ? undefined : val);
          }}
        >
          <option value="">All</option>
          <option value="WATCHED">Watched</option>
          <option value="WANT_TO_WATCH">Want to Watch</option>
        </select>
      </label>

      <label>
        <span>Type</span>
        <select
          value={contentType ?? ''}
          onChange={(e) => {
            const val = e.target.value as '' | 'MOVIE' | 'TV';
            onContentTypeChange(val === '' ? undefined : val);
          }}
        >
          <option value="">All</option>
          <option value="MOVIE">Movies</option>
          <option value="TV">TV Series</option>
        </select>
      </label>

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

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          onStatusChange(undefined);
          onContentTypeChange(undefined);
          onGenresChange([]);
        }}
      >
        Clear Filters
      </button>
    </div>
  );
}

