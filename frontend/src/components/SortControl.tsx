import type { MoviesQueryParams } from '../api/movies';

interface SortControlProps {
  sortBy: MoviesQueryParams['sortBy'];
  sortOrder: MoviesQueryParams['sortOrder'];
  onSortByChange: (value: MoviesQueryParams['sortBy']) => void;
  onSortOrderChange: (value: MoviesQueryParams['sortOrder']) => void;
}

export function SortControl({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SortControlProps) {
  return (
    <div className="sort-control">
      <label>
        <span>Sort by</span>
        <select
          value={sortBy}
          onChange={(e) =>
            onSortByChange(
              e.target.value as NonNullable<MoviesQueryParams['sortBy']>,
            )
          }
        >
          <option value="user_avg_rating">Rating</option>
          <option value="watch_date">Watch Date</option>
          <option value="created_at">Created Date</option>
        </select>
      </label>
      <label>
        <span>Order</span>
        <select
          value={sortOrder}
          onChange={(e) =>
            onSortOrderChange(
              e.target.value as NonNullable<MoviesQueryParams['sortOrder']>,
            )
          }
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>
    </div>
  );
}

