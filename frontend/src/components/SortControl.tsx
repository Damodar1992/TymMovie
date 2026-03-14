import type { MoviesQueryParams } from '../api/movies';

interface SortControlProps {
  sortBy: MoviesQueryParams['sortBy'];
  sortOrder: MoviesQueryParams['sortOrder'];
  onSortByChange: (value: MoviesQueryParams['sortBy']) => void;
  onSortOrderChange: (value: MoviesQueryParams['sortOrder']) => void;
}

const SORT_BY_OPTIONS: { value: MoviesQueryParams['sortBy']; label: string }[] = [
  { value: 'created_at', label: 'Created Date' },
  { value: 'watch_date', label: 'Watch Date' },
  { value: 'user_avg_rating', label: 'Rating' },
];

const SORT_ORDER_OPTIONS: { value: MoviesQueryParams['sortOrder']; label: string }[] = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

export function SortControl({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SortControlProps) {
  return (
    <div className="sort-control filters-row">
      <div className="filter-toggle-group">
        <span className="filter-label">Sort by</span>
        <div className="toggle-group" role="group" aria-label="Sort by">
          {SORT_BY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={sortBy === opt.value ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
              onClick={() => onSortByChange(opt.value)}
              aria-pressed={sortBy === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-toggle-group">
        <span className="filter-label">Order</span>
        <div className="toggle-group" role="group" aria-label="Order">
          {SORT_ORDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={sortOrder === opt.value ? 'toggle-chip toggle-chip-active' : 'toggle-chip'}
              onClick={() => onSortOrderChange(opt.value)}
              aria-pressed={sortOrder === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

