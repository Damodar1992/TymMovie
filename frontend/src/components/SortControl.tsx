import type { MoviesQueryParams } from '../api/lists';

interface SortControlProps {
  sortBy: MoviesQueryParams['sortBy'];
  sortOrder: MoviesQueryParams['sortOrder'];
  onSortByChange: (value: MoviesQueryParams['sortBy']) => void;
  onSortOrderChange: (value: MoviesQueryParams['sortOrder']) => void;
}

const SORT_BY_OPTIONS: { value: MoviesQueryParams['sortBy']; label: string }[] = [
  { value: 'created_at', label: 'Created' },
  { value: 'watch_date', label: 'Watch date' },
  { value: 'rating', label: 'Rating' },
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
        <button
          type="button"
          className="sort-order-toggle"
          aria-label="Order"
          onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          {sortOrder === 'desc' ? 'Descending ↓' : 'Ascending ↑'}
        </button>
      </div>
    </div>
  );
}

