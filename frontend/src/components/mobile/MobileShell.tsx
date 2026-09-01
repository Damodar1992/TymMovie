import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, SlidersHorizontal, User } from 'lucide-react';
import { useActiveListSync } from '../../state/ActiveListContext';
import {
  InteractiveMenu,
  type InteractiveMenuItem,
} from '../ui/modern-mobile-menu';
import { ListSwitcher } from '../ListSwitcher';
import { ListSettingsPanel } from '../ListSettingsPanel';
import { MobileMoviesScreen } from './MobileMoviesScreen';
import { MobileFiltersScreen } from './MobileFiltersScreen';
import { MobileProfileScreen } from './MobileProfileScreen';
import { MobileMovieForm } from './movie-form/MobileMovieForm';
import { IOSInstallHint } from './IOSInstallHint';

export type MobileTab = 'add' | 'filters' | 'profile';

const TAB_STORAGE_KEY = 'tym-movies-mobile-tab';

function readLegacySheet(): 'filters' | 'profile' | null {
  try {
    const v = localStorage.getItem(TAB_STORAGE_KEY);
    if (v === 'profile' || v === 'filters') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function MobileShell() {
  const { activeList } = useActiveListSync();
  const listId = activeList?.id ?? null;
  const canEdit = activeList ? activeList.role !== 'viewer' : false;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInstance, setFormInstance] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const tabOrder = useMemo<MobileTab[]>(
    () => (canEdit ? ['add', 'filters', 'profile'] : ['filters', 'profile']),
    [canEdit],
  );

  const menuItems = useMemo<InteractiveMenuItem[]>(
    () =>
      canEdit
        ? [
            { label: 'add', icon: Plus },
            { label: 'filters', icon: SlidersHorizontal },
            { label: 'profile', icon: User },
          ]
        : [
            { label: 'filters', icon: SlidersHorizontal },
            { label: 'profile', icon: User },
          ],
    [canEdit],
  );

  const openAddForm = () => {
    if (!canEdit || !listId) return;
    setFormInstance((n) => n + 1);
    setIsFormOpen(true);
  };

  const setTab = (t: 'filters' | 'profile') => {
    if (t === 'filters') {
      setFiltersOpen(true);
      setProfileOpen(false);
      return;
    }
    setProfileOpen(true);
    setFiltersOpen(false);
  };

  const closeFilters = () => {
    setFiltersOpen(false);
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  const openListSettings = () => {
    setProfileOpen(false);
    setSettingsOpen(true);
  };

  useEffect(() => {
    const legacy = readLegacySheet();
    if (legacy === 'profile') setProfileOpen(true);
    if (legacy === 'filters') setFiltersOpen(true);
  }, []);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.classList.add('root-mobile-full');
    return () => root.classList.remove('root-mobile-full');
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    const menu = shell?.querySelector<HTMLElement>('.menu');
    if (!shell || !menu) return;

    const update = () => {
      shell.style.setProperty('--mobile-menu-offset', `${menu.offsetHeight}px`);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(menu);
    return () => observer.disconnect();
  }, []);

  const menuActiveIndex = filtersOpen
    ? tabOrder.indexOf('filters')
    : profileOpen
      ? tabOrder.indexOf('profile')
      : -1;

  return (
    <div className="mobile-shell" ref={shellRef}>
      <header className="mobile-header">
        {activeList ? (
          <ListSwitcher onOpenSettings={openListSettings} />
        ) : (
          <div className="mobile-header-brand" aria-label="TymMovies">
            <div className="mlogin-mark" aria-hidden>
              <span className="mlogin-mark-bar" />
              <span className="mlogin-mark-play" />
            </div>
            <div className="mlogin-wordmark">
              Tym<span>Movies</span>
            </div>
          </div>
        )}

      </header>

      <IOSInstallHint />

      <main className="mobile-content">
        <MobileMoviesScreen />
      </main>

      <InteractiveMenu
        items={menuItems}
        accentColor="#c8a8ff"
        activeIndex={menuActiveIndex}
        onItemSelect={(idx) => {
          const tab = tabOrder[idx];
          if (tab === 'add') {
            openAddForm();
            return;
          }
          setTab(tab);
        }}
      />

      <MobileFiltersScreen open={filtersOpen} onApply={closeFilters} />

      <MobileProfileScreen
        open={profileOpen}
        onClose={closeProfile}
        onOpenListSettings={openListSettings}
      />

      {canEdit && listId && activeList ? (
        <MobileMovieForm
          key={`new-${formInstance}`}
          open={isFormOpen}
          listId={listId}
          listRole={activeList.role}
          movieId={null}
          initialMovie={null}
          onClose={() => setIsFormOpen(false)}
        />
      ) : null}

      {settingsOpen && activeList ? (
        <ListSettingsPanel
          list={activeList}
          onClose={() => setSettingsOpen(false)}
          variant="sheet"
        />
      ) : null}
    </div>
  );
}

