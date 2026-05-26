import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ApplyFiltersCTAProps {
  activeCount: number;
  onApply: () => void;
}

export function ApplyFiltersCTA({ activeCount, onApply }: ApplyFiltersCTAProps) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [activeCount]);

  return (
    <div className="fv-cta-wrap">
      <motion.button
        key={pulseKey}
        type="button"
        className="fv-cta"
        onClick={onApply}
        initial={{ scale: 0.985 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        aria-label={
          activeCount > 0
            ? `Apply filters (${activeCount} active)`
            : 'Apply filters'
        }
      >
        <span>Apply Filters</span>
        {activeCount > 0 ? (
          <span className="fv-cta-badge">{activeCount}</span>
        ) : null}
      </motion.button>
    </div>
  );
}
