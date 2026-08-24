import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ApplyFiltersCTAProps {
  resultCount: number;
  activeCount: number;
  onApply: () => void;
  onReset: () => void;
}

export function ApplyFiltersCTA({
  resultCount,
  activeCount,
  onApply,
  onReset,
}: ApplyFiltersCTAProps) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [resultCount, activeCount]);

  const label =
    resultCount === 1 ? 'Show 1 film' : `Show ${resultCount} films`;

  return (
    <div className="fv-cta-wrap">
      <button
        type="button"
        className="fv-cta-reset"
        onClick={onReset}
        disabled={activeCount === 0}
      >
        Reset
      </button>
      <motion.button
        key={pulseKey}
        type="button"
        className="fv-cta"
        onClick={onApply}
        initial={{ scale: 0.985 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        aria-label={label}
      >
        <span>{label}</span>
      </motion.button>
    </div>
  );
}
