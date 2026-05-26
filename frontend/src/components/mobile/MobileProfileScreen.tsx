import { useAuth } from '../../auth/AuthContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';

export function MobileProfileScreen() {
  const { mode, logout } = useAuth();
  const { titleLang, setTitleLang } = useMoviesFilters();

  return (
    <div className="mobile-screen mobile-screen-profile">
      <section className="mobile-profile-section">
        <h2 className="mobile-filter-title">Account</h2>
        <p className="mobile-profile-line">
          Signed in as <strong>{mode === 'admin' ? 'Admin' : 'Guest'}</strong>
        </p>
        <button
          type="button"
          className="secondary-button mobile-profile-logout"
          onClick={logout}
        >
          Log out
        </button>
      </section>

      <section className="mobile-profile-section">
        <h2 className="mobile-filter-title">Title language</h2>
        <div className="toggle-group" role="group" aria-label="Title language">
          <button
            type="button"
            className={
              titleLang === 'en' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'
            }
            onClick={() => setTitleLang('en')}
          >
            English
          </button>
          <button
            type="button"
            className={
              titleLang === 'ua' ? 'toggle-chip toggle-chip-active' : 'toggle-chip'
            }
            onClick={() => setTitleLang('ua')}
          >
            Українська
          </button>
        </div>
      </section>

      <section className="mobile-profile-section">
        <h2 className="mobile-filter-title">About</h2>
        <p className="mobile-profile-line">
          TymMovies — personal movies &amp; TV watchlist.
        </p>
      </section>
    </div>
  );
}
