import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Film,
  Layers,
  Tv2,
} from 'lucide-react';
import { useGenresQuery, useMoviesQuery, type MovieStatus } from '../../api/movies';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import { FiltersHeader } from './filters/FiltersHeader';
import { FilterSectionCard } from './filters/FilterSectionCard';
import { SegmentedControl } from './filters/SegmentedControl';
import { IconLabelPill } from './filters/IconLabelPill';
import { GenreCloud } from './filters/GenreCloud';
import { ApplyFiltersCTA } from './filters/ApplyFiltersCTA';

interface MobileFiltersScreenProps {
  open: boolean;
  onApply: () => void;
}

type StatusOpt = 'ALL' | MovieStatus;
type TypeOpt = 'ALL' | 'MOVIE' | 'TV';
type SortOpt = 'created_at' | 'watch_date' | 'user_avg_rating';

export function MobileFiltersScreen({ open, onApply }: MobileFiltersScreenProps) {
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

  const { data: preview } = useMoviesQuery({
    status,
    contentType,
    genres,
    sortBy,
    sortOrder,
    page: 1,
  });

  const { data: catalog } = useMoviesQuery({
    status,
    contentType,
    sortBy,
    sortOrder,
    page: 1,
  });
  const catalogItems = catalog?.items ?? [];
  // Authoritative, whole-catalog genre list (fixes genres from movies
  // outside this page-1 popularity sample being missing from the picker).
  const { data: serverGenres = [] } = useGenresQuery();

  const { allGenres, popularGenres } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of catalogItems) {
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
    const all = Array.from(
      new Set([...sortedByPopularity, ...serverGenres, ...genres]),
    ).sort((a, b) => a.localeCompare(b));
    return {
      allGenres: all,
      popularGenres: popular,
    };
  }, [catalogItems, serverGenres, genres]);

  const activeCount =
    (status !== undefined ? 1 : 0) +
    (contentType !== undefined ? 1 : 0) +
    genres.length;

  const statusValue: StatusOpt = status ?? 'ALL';
  const typeValue: TypeOpt = contentType ?? 'ALL';
  const sortValue: SortOpt =
    sortBy === 'watch_date' || sortBy === 'user_avg_rating'
      ? sortBy
      : 'created_at';
  const orderValue = sortOrder ?? 'desc';

  const sortSummary = `${
    sortValue === 'created_at'
      ? 'Created'
      : sortValue === 'watch_date'
        ? 'Watch date'
        : 'Rating'
  } · ${orderValue === 'desc' ? 'Desc' : 'Asc'}`;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onApply}
          />
          <motion.div
            className="mobile-sheet-root mobile-filters-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <FiltersHeader onClose={onApply} />

            <div className="filters-v2 mobile-filters-sheet-body">
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
                    { value: 'WANT_TO_WATCH', label: 'Planned' },
                    { value: 'WATCHED', label: 'Watched' },
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

              <FilterSectionCard title="Sort" summary={sortSummary}>
                <div className="fv-sort-row">
                  <SegmentedControl<SortOpt>
                    name="sort"
                    ariaLabel="Sort by"
                    value={sortValue}
                    onChange={(v) => setSortBy(v)}
                    options={[
                      { value: 'created_at', label: 'Created' },
                      { value: 'watch_date', label: 'Watch date' },
                      { value: 'user_avg_rating', label: 'Rating' },
                    ]}
                  />
                  <button
                    type="button"
                    className="fv-sort-order"
                    onClick={() =>
                      setSortOrder(orderValue === 'desc' ? 'asc' : 'desc')
                    }
                    aria-label={
                      orderValue === 'desc'
                        ? 'Sort descending, tap for ascending'
                        : 'Sort ascending, tap for descending'
                    }
                  >
                    {orderValue === 'desc' ? (
                      <ArrowDown size={18} strokeWidth={2.4} />
                    ) : (
                      <ArrowUp size={18} strokeWidth={2.4} />
                    )}
                  </button>
                </div>
              </FilterSectionCard>
            </div>

            <ApplyFiltersCTA
              resultCount={preview?.total ?? 0}
              activeCount={activeCount}
              onApply={onApply}
              onReset={clearAll}
            />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
