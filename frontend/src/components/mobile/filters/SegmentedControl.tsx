import { motion } from 'framer-motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="fv-segmented"
      role="tablist"
      aria-label={ariaLabel ?? name}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`fv-segmented-item${isActive ? ' active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {isActive ? (
              <motion.span
                layoutId={`seg-indicator-${name}`}
                className="fv-segmented-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span style={{ position: 'relative', zIndex: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
