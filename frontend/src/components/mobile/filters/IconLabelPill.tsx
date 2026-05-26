import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface IconLabelPillProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function IconLabelPill({
  icon: Icon,
  label,
  active,
  onClick,
}: IconLabelPillProps) {
  return (
    <motion.button
      type="button"
      className={`fv-type-pill${active ? ' active' : ''}`}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      aria-pressed={active}
    >
      <Icon aria-hidden />
      <span>{label}</span>
    </motion.button>
  );
}
