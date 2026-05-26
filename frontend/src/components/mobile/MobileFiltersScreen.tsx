import { useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  Film,
  Layers,
  Star,
  Tv2,
} from 'lucide-react';
import { useMoviesQuery, type MovieStatus } from '../../api/movies';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import { FiltersHeader } from './filters/FiltersHeader';
import { FilterSectionCard } from './filters/FilterSectionCard';
import { SegmentedControl } from './filters/SegmentedControl';
import { IconLabelPill } from './filters/IconLabelPill';
import { GenreCloud } from './filters/GenreCloud';
import { SortRadioCard } from './filters/SortRadioCard';
import { ApplyFiltersCTA } from './filters/ApplyFiltersCTA';

interface MobileFiltersScreenProps {
  onApply: () => void;
}

type StatusOpt = 'ALL' | MovieStatus;
type TypeOpt = 'ALL' | 'MOVIE' | 'TV';

export function MobileFiltersScreen({ onApply }: MobileFiltersScreenProps) {
  const {
    status,
    setStatus,
    contentType,
    setContentType,
    genres,
    setGenres,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    clearAll,
  } = useMoviesFilters();

  const { data } = useMoviesQuery({
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
    page: 1,
  });
  const items = data?.items ?? [];

  const { allGenres, popularGenres } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of items) {
      for (const g of m.genres ?? []) {
        if (typeof g !== 'string') continue;
        const key = g.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    const sortedByPopularity = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([g]) => g);

    const popular = sortedByPopularity.slice(0, 6);
    const all = Array.from(new Set([...sortedByPopularity, ...genres])).sort(
      (a, b) => a.localeCompare(b),
    );
    return { allGenres: all, popularGenres: popular };
  }, [items, genres]);

  const activeCount =
    (status !== undefined ? 1 : 0) +
    (contentType !== undefined ? 1 : 0) +
    genres.length;

  const statusValue: StatusOpt = status ?? 'ALL';
  const typeValue: TypeOpt = contentType ?? 'ALL';

  return (
    <div className="filters-v2 mobile-screen-filters-v2">
      <FiltersHeader
        activeCount={activeCount}
        onReset={clearAll}
        onClose={onApply}
      />

      <FilterSectionCard
        title="Status"
        summary={
          status === 'WATCHED'
            ? 'Watched'
            : status === 'WANT_TO_WATCH'
              ? 'Planned'
              : 'All'
        }
        summaryHighlighted={status !== undefined}
      >
        <SegmentedControl<StatusOpt>
          name="status"
          ariaLabel="Filter by status"
          value={statusValue}
          onChange={(v) => setStatus(v === 'ALL' ? undefined : v)}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'WATCHED', label: 'Watched' },
            { value: 'WANT_TO_WATCH', label: 'Planned' },
          ]}
        />
      </FilterSectionCard>

      <FilterSectionCard
        title="Type"
        summary={
          contentType === 'MOVIE'
            ? 'Movies'
            : contentType === 'TV'
              ? 'TV'
              : 'All'
        }
        summaryHighlighted={contentType !== undefined}
      >
        <div className="fv-type-row" role="radiogroup" aria-label="Content type">
          <IconLabelPill
            icon={Layers}
            label="All"
            active={typeValue === 'ALL'}
            onClick={() => setContentType(undefined)}
          />
          <IconLabelPill
            icon={Film}
            label="Movies"
            active={typeValue === 'MOVIE'}
            onClick={() => setContentType('MOVIE')}
          />
          <IconLabelPill
            icon={Tv2}
            label="TV"
            active={typeValue === 'TV'}
            onClick={() => setContentType('TV')}
          />
        </div>
      </FilterSectionCard>

      <FilterSectionCard
        title="Genre"
        summary={
          genres.length > 0
            ? `${genres.length} selected`
            : 'Any'
        }
        summaryHighlighted={genres.length > 0}
      >
        <GenreCloud
          genres={allGenres}
          popular={popularGenres}
          selected={genres}
          onToggle={(g) =>
            genres.includes(g)
              ? setGenres(genres.filter((x) => x !== g))
              : setGenres([...genres, g])
          }
        />
      </FilterSectionCard>

      <FilterSectionCard
        title="Sort"
        summary={`${
          sortBy === 'created_at'
            ? 'Created'
            : sortBy === 'watch_date'
              ? 'Watched'
              : sortBy === 'user_avg_rating'
                ? 'Rating'
                : 'Created'
        } \u00b7 ${sortOrder === 'desc' ? 'Desc' : 'Asc'}`}
      >
        <div className="fv-radio-row" role="radiogroup" aria-label="Sort by">
          <SortRadioCard
            icon={Calendar}
            label="Created"
            active={sortBy === 'created_at'}
            onClick={() => setSortBy('created_at')}
          />
          <SortRadioCard
            icon={CalendarCheck}
            label="Watched"
            active={sortBy === 'watch_date'}
            onClick={() => setSortBy('watch_date')}
          />
          <SortRadioCard
            icon={Star}
            label="Rating"
            active={sortBy === 'user_avg_rating'}
            onClick={() => setSortBy('user_avg_rating')}
          />
        </div>

        <SegmentedControl<'asc' | 'desc'>
          name="order"
          ariaLabel="Sort order"
          value={sortOrder ?? 'desc'}
          onChange={(v) => setSortOrder(v)}
          options={[
            { value: 'desc', label: 'Descending' },
            { value: 'asc', label: 'Ascending' },
          ]}
        />
      </FilterSectionCard>

      <ApplyFiltersCTA activeCount={activeCount} onApply={onApply} />
    </div>
  );
}
