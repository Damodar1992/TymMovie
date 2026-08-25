import { X } from 'lucide-react';

interface FiltersHeaderProps {
  onClose: () => void;
}

export function FiltersHeader({ onClose }: FiltersHeaderProps) {
  return (
    <header className="fv-header" role="banner">
      <div aria-hidden />

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
