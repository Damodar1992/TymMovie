import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FiltersHeaderProps {
  activeCount: number;
  onReset: () => void;
  onClose: () => void;
}

export function FiltersHeader({
  activeCount,
  onReset,
  onClose,
}: FiltersHeaderProps) {
  return (
    <header className="fv-header" role="banner">
      <div>
        <AnimatePresence initial={false}>
          {activeCount > 0 ? (
            <motion.button
              key="reset"
              type="button"
              className="fv-header-btn fv-header-btn-reset"
              onClick={onReset}
              aria-label={`Reset ${activeCount} active filters`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              Reset
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <h1 className="fv-header-title">Filters</h1>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="fv-header-btn fv-header-btn-icon"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}
