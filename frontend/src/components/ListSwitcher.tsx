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
        className={`list-switcher-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="list-switcher-trigger-main">
          <span className="list-switcher-name">{activeList.name}</span>
          <span className="list-switcher-role">
            {activeList.role === 'owner' ? 'Your list' : 'Shared with you'}
          </span>
        </span>
        <span className="list-switcher-chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <div className="list-switcher-menu" role="menu">
          <div className="list-switcher-menu-head">Lists</div>
          <div className="list-switcher-menu-items">
            {lists.map((l) => {
              const isActive = l.id === activeList.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={isActive ? 'is-active' : undefined}
                  onClick={() => {
                    setActiveListId(l.id);
                    setOpen(false);
                  }}
                >
                  <span className="list-switcher-item-label">{l.name}</span>
                  <span className="list-switcher-item-meta">
                    <span className={`list-switcher-role-pill is-${l.role}`}>
                      {l.role === 'owner' ? 'Owner' : 'Member'}
                    </span>
                    {isActive ? <span className="list-switcher-check" aria-hidden>✓</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="list-switcher-menu-foot">
            <button
              type="button"
              className="list-switcher-settings"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
            >
              List settings
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
