import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface SortRadioCardProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function SortRadioCard({
  icon: Icon,
  label,
  active,
  onClick,
}: SortRadioCardProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={active}
      className={`fv-radio-card${active ? ' active' : ''}`}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    >
      <Icon aria-hidden />
      <span className="fv-radio-card-label">{label}</span>
    </motion.button>
  );
}
