import { useEffect, useMemo } from 'react';
import { LogOut } from 'lucide-react';
import { useMoviesInfiniteQuery, useMoviesQuery } from '../../api/movies';
import { useAuth } from '../../auth/AuthContext';
import { useMoviesFilters } from '../../state/MoviesFiltersContext';

const MEMBERS = [
  { id: 'admin', name: 'Admin', initial: 'A', tone: 'admin' },
  { id: 'inna', name: 'Inna', initial: 'I', tone: 'inna' },
  { id: 'bohdan', name: 'Bohdan', initial: 'B', tone: 'bohdan' },
] as const;

export function MobileProfileScreen() {
  const { mode, logout } = useAuth();
  const { titleLang, setTitleLang } = useMoviesFilters();
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMoviesInfiniteQuery({});
  const { data: watchedPage } = useMoviesQuery({
    status: 'WATCHED',
    page: 1,
  });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const statsReady = !isLoading && !hasNextPage;
  const total = data?.pages[0]?.total ?? items.length;
  const watchedCount = watchedPage?.total ?? 0;
  const ratedAvgs = items
    .map((movie) => movie.userAvgRating)
    .filter((value): value is number => value != null && !Number.isNaN(value));
  const avgTym =
    statsReady && ratedAvgs.length > 0
      ? ratedAvgs.reduce((sum, value) => sum + value, 0) / ratedAvgs.length
      : null;

  const innaRated = items.filter((movie) => movie.innaRating != null).length;
  const bohdanRated = items.filter((movie) => movie.bogdanRating != null).length;
  const memberRated: Record<string, number> = {
    admin: total,
    inna: innaRated,
    bohdan: bohdanRated,
  };

  const displayName = mode === 'admin' ? 'Admin' : 'Guest';
  const accessLabel =
    mode === 'admin' ? 'signed in · full access' : 'signed in · read only';

  return (
    <div className="mobile-screen mobile-screen-profile">
      <section className="mp-card mp-user-card">
        <div className="mp-user-top">
          <div className={`mp-avatar is-${mode === 'admin' ? 'admin' : 'guest'}`}>
            {displayName.slice(0, 1)}
          </div>
          <div className="mp-user-copy">
            <h2>{displayName}</h2>
            <p>{accessLabel}</p>
          </div>
        </div>

        <div className="mp-stats" aria-label="Library stats">
          <div className="mp-stat">
            <strong>{isLoading ? '—' : total}</strong>
            <span>In list</span>
          </div>
          <div className="mp-stat">
            <strong>{watchedPage ? watchedCount : '—'}</strong>
            <span>Watched</span>
          </div>
          <div className="mp-stat">
            <strong>{avgTym != null ? avgTym.toFixed(1) : '—'}</strong>
            <span>Avg Tym</span>
          </div>
        </div>
      </section>

      <section className="mp-block">
        <div className="mp-block-head">
          <h3>Members</h3>
          <span>{MEMBERS.length} people</span>
        </div>
        <div className="mp-card mp-members-card">
          <ul className="mp-members">
            {MEMBERS.map((member) => (
              <li key={member.id}>
                <span className={`mp-member-avatar is-${member.tone}`}>
                  {member.initial}
                </span>
                <span className="mp-member-name">{member.name}</span>
                <span className="mp-member-meta">
                  {statsReady || member.id === 'admin'
                    ? `${memberRated[member.id] ?? 0} rated`
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mp-invite"
            disabled
            title="Coming soon"
          >
            + Invite someone
          </button>
        </div>
      </section>

      <section className="mp-block">
        <div className="mp-block-head">
          <h3>Title language</h3>
          <span>{titleLang.toUpperCase()}</span>
        </div>
        <div className="mp-card mp-lang-card">
          <div className="mp-lang-toggle" role="group" aria-label="Title language">
            <button
              type="button"
              className={titleLang === 'en' ? 'active' : ''}
              onClick={() => setTitleLang('en')}
              aria-pressed={titleLang === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className={titleLang === 'ua' ? 'active' : ''}
              onClick={() => setTitleLang('ua')}
              aria-pressed={titleLang === 'ua'}
            >
              UA
            </button>
          </div>
        </div>
      </section>

      <section className="mp-card mp-logout-card">
        <div className="mp-logout-copy">
          <button type="button" className="mp-logout-link" onClick={logout}>
            Log out
          </button>
          <p>TymMovies v1.0 · personal watchlist</p>
        </div>
        <button
          type="button"
          className="mp-logout-icon"
          onClick={logout}
          aria-label="Log out"
        >
          <LogOut size={16} strokeWidth={2.2} />
        </button>
      </section>
    </div>
  );
}
