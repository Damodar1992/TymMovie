import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface FilterSectionCardProps {
  title: string;
  summary?: string;
  summaryHighlighted?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FilterSectionCard({
  title,
  summary,
  summaryHighlighted,
  defaultOpen = true,
  children,
}: FilterSectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className="fv-card">
      <button
        type="button"
        className="fv-card-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <div className="fv-card-title-row">
          <h2 className="fv-card-title">{title}</h2>
        </div>
        <div className="fv-card-title-row">
          {summary ? (
            <span
              className={`fv-card-summary${
                summaryHighlighted ? ' fv-card-summary-active' : ''
              }`}
            >
              {summary}
            </span>
          ) : null}
          <span
            className={`fv-card-chevron${open ? ' open' : ''}`}
            aria-hidden
          >
            <ChevronDown size={18} strokeWidth={2} />
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={bodyId}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: 'spring', stiffness: 260, damping: 28 },
              opacity: { duration: 0.18 },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="fv-card-body">
              <div className="fv-card-body-inner">{children}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
