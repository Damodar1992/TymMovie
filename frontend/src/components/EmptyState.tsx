interface EmptyStateProps {
  title: string;
  description: string;
  eyebrow?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'catalog';
}

export function EmptyState({
  title,
  description,
  eyebrow,
  action,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <div className={`empty-state${variant === 'catalog' ? ' empty-state-catalog' : ''}`}>
      {eyebrow ? <p className="empty-state-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <button type="button" className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
