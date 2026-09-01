import { useEffect, useRef, useState } from 'react';
import { useActiveListSync } from '../state/ActiveListContext';

export function ListSwitcher({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { lists, activeList, setActiveListId } = useActiveListSync();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!activeList) return null;

  return (
    <div className="list-switcher" ref={rootRef}>
      <button
        type="button"
        className="list-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="list-switcher-name">{activeList.name}</span>
        <span className="list-switcher-role">
          {activeList.role === 'owner' ? 'Your list' : 'Shared with you'}
        </span>
      </button>
      {open ? (
        <div className="list-switcher-menu" role="menu">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              className={l.id === activeList.id ? 'is-active' : undefined}
              onClick={() => {
                setActiveListId(l.id);
                setOpen(false);
              }}
            >
              <span>{l.name}</span>
              <em>{l.role === 'owner' ? 'Owner' : 'Member'}</em>
            </button>
          ))}
          <button
            type="button"
            className="list-switcher-settings"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
          >
            List settings…
          </button>
        </div>
      ) : null}
    </div>
  );
}
