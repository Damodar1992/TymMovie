import type { MovieStatus } from '../api/movies';

interface FiltersBarProps {
  status?: MovieStatus;
  onStatusChange: (status: MovieStatus | undefined) => void;
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

const KNOWN_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
];

export function FiltersBar({
  status,
  onStatusChange,
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

      <div className="genre-filter">
        <span>Filter by Genre</span>
        <div className="genre-chips">
          {KNOWN_GENRES.map((genre) => {
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
          onGenresChange([]);
        }}
      >
        Clear Filters
      </button>
    </div>
  );
}

