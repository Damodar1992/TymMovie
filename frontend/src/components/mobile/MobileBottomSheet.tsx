import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  ariaLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  sheetClassName?: string;
  bodyClassName?: string;
}

export function MobileBottomSheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  footer,
  sheetClassName,
  bodyClassName,
}: MobileBottomSheetProps) {
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="mobile-bottom-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={`mobile-bottom-sheet${sheetClassName ? ` ${sheetClassName}` : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? title}
            onClick={(event) => event.stopPropagation()}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > 72 || info.velocity.y > 500) onClose();
            }}
          >
            <div
              className="mobile-bottom-sheet-drag-head"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div className="mobile-detail-grab" aria-hidden />
              <header className="mobile-bottom-sheet-header">
                <div aria-hidden />
                <h1 className="mobile-bottom-sheet-title">{title}</h1>
                <button
                  type="button"
                  className="mobile-bottom-sheet-close"
                  onClick={onClose}
                  aria-label={`Close ${title}`}
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </header>
            </div>

            <div
              className={`mobile-bottom-sheet-body${bodyClassName ? ` ${bodyClassName}` : ''}`}
            >
              {children}
            </div>

            {footer ? <div className="mobile-bottom-sheet-footer">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
