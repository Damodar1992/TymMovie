import { useEffect, useState } from 'react';
import { Film, SlidersHorizontal, User } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import { MobileMovieForm } from './movie-form/MobileMovieForm';
import {
  InteractiveMenu,
  type InteractiveMenuItem,
} from '../ui/modern-mobile-menu';

export type MobileTab = 'movies' | 'filters' | 'profile';
import { MobileMoviesScreen } from './MobileMoviesScreen';
import { MobileFiltersScreen } from './MobileFiltersScreen';
import { MobileProfileScreen } from './MobileProfileScreen';
import { IOSInstallHint } from './IOSInstallHint';

const TAB_STORAGE_KEY = 'tym-movies-mobile-tab';

function readTab(): MobileTab {
  try {
    const v = localStorage.getItem(TAB_STORAGE_KEY);
    if (v === 'movies' || v === 'filters' || v === 'profile') return v;
  } catch {
    /* ignore */
  }
  return 'movies';
}

function LogoutIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function FunnelIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5h16l-6 8v5l-4 2v-7L4 5z" />
    </svg>
  );
}

export function MobileShell() {
  const { isReadOnly, logout } = useAuth();
  const { status, contentType, genres } = useMoviesFilters();
  const [tab, setTabState] = useState<MobileTab>(readTab);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInstance, setFormInstance] = useState(0);

  const setTab = (t: MobileTab) => {
    setTabState(t);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.classList.add('root-mobile-full');
    return () => root.classList.remove('root-mobile-full');
  }, []);

  const activeFiltersCount =
    (status !== undefined ? 1 : 0) +
    (contentType !== undefined ? 1 : 0) +
    genres.length;

  const titles: Record<MobileTab, string> = {
    movies: 'TymMovies',
    filters: 'Filters',
    profile: 'Profile',
  };

  return (
    <div className="mobile-shell">
      {tab !== 'filters' ? (
        <header className="mobile-header">
          {tab === 'movies' ? (
            <img
              src="/logo 2.png"
              alt="TymMovies"
              className="mobile-header-logo"
            />
          ) : (
            <h1 className="mobile-header-title">{titles[tab]}</h1>
          )}

          <div className="mobile-header-actions">
            {tab === 'movies' ? (
              <button
                type="button"
                className="mobile-header-icon-btn"
                onClick={() => setTab('filters')}
                aria-label={
                  activeFiltersCount > 0
                    ? `Filters (${activeFiltersCount} active)`
                    : 'Open filters'
                }
              >
                <FunnelIcon />
                {activeFiltersCount > 0 ? (
                  <span className="mobile-header-badge">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {tab === 'movies' && !isReadOnly ? (
              <button
                type="button"
                className="mobile-header-icon-btn"
                onClick={() => {
                  setFormInstance((n) => n + 1);
                  setIsFormOpen(true);
                }}
                aria-label="Add movie"
              >
                <img src="/add_movie_icon.svg" alt="" width={24} height={24} />
              </button>
            ) : null}

            {tab === 'profile' ? (
              <button
                type="button"
                className="mobile-header-icon-btn"
                onClick={logout}
                aria-label="Log out"
                title="Log out"
              >
                <LogoutIcon />
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      <IOSInstallHint />

      <main className="mobile-content">
        {tab === 'movies' ? <MobileMoviesScreen /> : null}
        {tab === 'filters' ? (
          <MobileFiltersScreen onApply={() => setTab('movies')} />
        ) : null}
        {tab === 'profile' ? <MobileProfileScreen /> : null}
      </main>

      <InteractiveMenu
        items={menuItems}
        accentColor="#c8a8ff"
        activeIndex={tabOrder.indexOf(tab)}
        onItemSelect={(idx) => setTab(tabOrder[idx])}
      />

      {!isReadOnly ? (
        <MobileMovieForm
          key={`new-${formInstance}`}
          open={isFormOpen}
          movieId={null}
          initialMovie={null}
          onClose={() => setIsFormOpen(false)}
        />
      ) : null}
    </div>
  );
}

const tabOrder: MobileTab[] = ['movies', 'filters', 'profile'];

const menuItems: InteractiveMenuItem[] = [
  { label: 'movies', icon: Film },
  { label: 'filters', icon: SlidersHorizontal },
  { label: 'profile', icon: User },
];
