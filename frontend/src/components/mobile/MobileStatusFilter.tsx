import { useEffect, useRef, useState } from 'react';
import type { MovieStatus } from '../../api/lists';

type StatusFilter = MovieStatus | undefined;

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'WANT_TO_WATCH', label: 'Planned' },
  { value: 'WATCHED', label: 'Watched' },
];

function statusLabel(status: StatusFilter) {
  return OPTIONS.find((option) => option.value === status)?.label ?? 'All';
}

interface MobileStatusFilterProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function MobileStatusFilter({ value, onChange }: MobileStatusFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="mobile-status-filter" ref={rootRef}>
      <button
        type="button"
        className={`mobile-status-filter-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Status: ${statusLabel(value)}`}
      >
        <span className="mobile-status-filter-label">{statusLabel(value)}</span>
        <span className="mobile-status-filter-chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <div className="mobile-status-filter-menu" role="listbox" aria-label="Filter by status">
          {OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.label}
                type="button"
                role="option"
                aria-selected={active}
                className={active ? 'is-active' : undefined}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {active ? (
                  <span className="mobile-status-filter-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
