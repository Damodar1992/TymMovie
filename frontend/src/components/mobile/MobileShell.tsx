import { useEffect, useRef, useState } from 'react';
import { Film, MoreHorizontal, SlidersHorizontal, User } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';
import {
  InteractiveMenu,
  type InteractiveMenuItem,
} from '../ui/modern-mobile-menu';
import { MobileMoviesScreen } from './MobileMoviesScreen';
import { MobileFiltersScreen } from './MobileFiltersScreen';
import { MobileProfileScreen } from './MobileProfileScreen';
import { MobileMovieForm } from './movie-form/MobileMovieForm';
import { IOSInstallHint } from './IOSInstallHint';

export type MobileTab = 'movies' | 'filters' | 'profile';

const TAB_STORAGE_KEY = 'tym-movies-mobile-tab';

function readTab(): MobileTab {
  try {
    const v = localStorage.getItem(TAB_STORAGE_KEY);
    if (v === 'movies' || v === 'profile') return v;
    // Legacy: filters used to be a tab page — open movies instead.
    if (v === 'filters') return 'movies';
  } catch {
    /* ignore */
  }
  return 'movies';
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
  const { isReadOnly } = useAuth();
  const { status, contentType, genres } = useMoviesFilters();
  const [tab, setTabState] = useState<MobileTab>(readTab);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInstance, setFormInstance] = useState(0);
  const shellRef = useRef<HTMLDivElement>(null);

  const setTab = (t: MobileTab) => {
    if (t === 'filters') {
      setFiltersOpen(true);
      setTabState('movies');
      try {
        localStorage.setItem(TAB_STORAGE_KEY, 'movies');
      } catch {
        /* ignore */
      }
      return;
    }
    setFiltersOpen(false);
    setTabState(t);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const closeFilters = () => {
    setFiltersOpen(false);
    setTabState('movies');
    try {
      localStorage.setItem(TAB_STORAGE_KEY, 'movies');
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

  useEffect(() => {
    const updateShellHeight = () => {
      const height = window.screen.height;
      shellRef.current?.style.setProperty(
        '--mobile-shell-height',
        `${height}px`,
      );
    };

    updateShellHeight();
    window.addEventListener('orientationchange', updateShellHeight);
    return () => window.removeEventListener('orientationchange', updateShellHeight);
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

  const activeFiltersCount =
    (status !== undefined ? 1 : 0) +
    (contentType !== undefined ? 1 : 0) +
    genres.length;

  const titles: Record<'movies' | 'profile', string> = {
    movies: 'TymMovies',
    profile: 'Profile',
  };

  const menuActiveIndex = filtersOpen
    ? tabOrder.indexOf('filters')
    : tabOrder.indexOf(tab === 'filters' ? 'movies' : tab);

  return (
    <div className="mobile-shell" ref={shellRef}>
      <header className="mobile-header">
        {tab === 'movies' ? (
          <div className="mobile-header-brand" aria-label="TymMovies">
            <div className="mlogin-mark" aria-hidden>
              <span className="mlogin-mark-bar" />
              <span className="mlogin-mark-play" />
            </div>
            <div className="mlogin-wordmark">
              Tym<span>Movies</span>
            </div>
          </div>
        ) : (
          <h1 className="mobile-header-title">{titles.profile}</h1>
        )}

        <div className="mobile-header-actions">
          {tab === 'movies' ? (
            <button
              type="button"
              className="mobile-header-icon-btn"
              onClick={() => setFiltersOpen(true)}
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
              aria-label="More"
              disabled
            >
              <MoreHorizontal size={18} strokeWidth={2.2} />
            </button>
          ) : null}
        </div>
      </header>

      <IOSInstallHint />

      <main className="mobile-content">
        {tab === 'profile' ? <MobileProfileScreen /> : <MobileMoviesScreen />}
      </main>

      <InteractiveMenu
        items={menuItems}
        accentColor="#c8a8ff"
        activeIndex={menuActiveIndex}
        onItemSelect={(idx) => setTab(tabOrder[idx])}
      />

      <MobileFiltersScreen open={filtersOpen} onApply={closeFilters} />

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
