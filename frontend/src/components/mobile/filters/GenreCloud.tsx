import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface GenreCloudProps {
  genres: string[];
  selected: string[];
  popular?: string[];
  onToggle: (genre: string) => void;
}

export function GenreCloud({
  genres,
  selected,
  popular = [],
  onToggle,
}: GenreCloudProps) {
  const [query, setQuery] = useState('');

  const { popularList, restList } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (g: string) => (q ? g.toLowerCase().includes(q) : true);

    const popSet = new Set(popular);
    const popularList = popular.filter(matches);
    const restList = genres.filter((g) => !popSet.has(g) && matches(g));

    return { popularList, restList };
  }, [genres, popular, query]);

  const isEmpty = popularList.length === 0 && restList.length === 0;

  return (
    <div className="fv-genre">
      <div className="fv-genre-search">
        <span className="fv-genre-search-icon" aria-hidden>
          <Search size={16} strokeWidth={2} />
        </span>
        <input
          className="fv-genre-search-input"
          type="search"
          placeholder="Search genres"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search genres"
        />
      </div>

      {isEmpty ? (
        <p className="fv-genre-empty">No genres match your search.</p>
      ) : (
        <>
          {popularList.length > 0 ? (
            <div>
              <p className="fv-genre-group-label">Popular</p>
              <div className="fv-chip-cloud">
                {popularList.map((g) => (
                  <Chip
                    key={`p-${g}`}
                    label={g}
                    active={selected.includes(g)}
                    onClick={() => onToggle(g)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {restList.length > 0 ? (
            <div>
              {popularList.length > 0 ? (
                <p
                  className="fv-genre-group-label"
                  style={{ marginTop: 12 }}
                >
                  All genres
                </p>
              ) : null}
              <div className="fv-chip-cloud">
                {restList.map((g) => (
                  <Chip
                    key={`a-${g}`}
                    label={g}
                    active={selected.includes(g)}
                    onClick={() => onToggle(g)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className={`fv-chip${active ? ' active' : ''}`}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      aria-pressed={active}
    >
      {label}
    </motion.button>
  );
}
