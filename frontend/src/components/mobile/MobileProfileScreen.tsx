import { useEffect, useMemo } from 'react';
import { LogOut } from 'lucide-react';
import {
  useMoviesInfiniteQuery,
  useLibraryStatsQuery,
  useListMembersQuery,
} from '../../api/lists';
import { useAuth } from '../../auth/AuthContext';
import { useActiveListSync } from '../../state/ActiveListContext';
import { Avatar } from '../Avatar';
import { MobileBottomSheet } from './MobileBottomSheet';

interface MobileProfileScreenProps {
  open: boolean;
  onClose: () => void;
  onOpenListSettings: () => void;
}

export function MobileProfileScreen({
  open,
  onClose,
  onOpenListSettings,
}: MobileProfileScreenProps) {
  const { user, logout } = useAuth();
  const { activeList } = useActiveListSync();
  const listId = activeList?.id ?? null;
  const isOwner = activeList?.role === 'owner';
  const { data: members = [] } = useListMembersQuery(listId);
  const { data: stats } = useLibraryStatsQuery(listId);
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMoviesInfiniteQuery({ listId });

  useEffect(() => {
    if (!open) return;
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [open, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const statsReady = !isLoading && !hasNextPage;

  const ratedAvgs = items
    .map((movie) => movie.avgRating)
    .filter((value): value is number => value != null && !Number.isNaN(value));
  const avgTym =
    statsReady && ratedAvgs.length > 0
      ? ratedAvgs.reduce((sum, value) => sum + value, 0) / ratedAvgs.length
      : null;

  const memberRated: Record<string, number> = {};
  for (const movie of items) {
    for (const r of movie.ratings) {
      if (r.rating != null) {
        memberRated[r.userId] = (memberRated[r.userId] ?? 0) + 1;
      }
    }
  }

  const displayName = user?.name ?? user?.email ?? 'You';

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return (a.name ?? a.email).localeCompare(b.name ?? b.email);
      }),
    [members],
  );

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title="Profile"
      bodyClassName="mobile-profile-sheet-body"
    >
      <div className="mobile-screen-profile mobile-profile-sheet-content">
        <section className="mp-card mp-user-card">
          <div className="mp-user-top">
            <Avatar
              userId={user?.id ?? ''}
              name={user?.name ?? null}
              email={user?.email}
              avatarUrl={user?.avatarUrl}
              className="mp-avatar"
            />
            <div className="mp-user-copy">
              <h2>{displayName}</h2>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="mp-stats" aria-label="Library stats">
            <div className="mp-stat">
              <strong>{stats ? stats.total : '—'}</strong>
              <span>In list</span>
            </div>
            <div className="mp-stat">
              <strong>{stats ? stats.watched : '—'}</strong>
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
            <h3>{activeList?.name ?? 'List'}</h3>
          </div>
          <div className="mp-card mp-members-card">
            <ul className="mp-members">
              {sortedMembers.map((member) => (
                <li key={member.userId}>
                  <Avatar
                    userId={member.userId}
                    name={member.name}
                    email={member.email}
                    avatarUrl={member.avatarUrl}
                    className="mp-member-avatar"
                  />
                  <span className="mp-member-name">
                    {member.name ?? member.email}
                    {member.userId === user?.id ? ' (you)' : ''}
                  </span>
                  <div className="mp-member-side">
                    {member.role === 'owner' ? (
                      <span className="mp-member-role">Owner</span>
                    ) : null}
                    <span className="mp-member-meta">
                      {statsReady ? `${memberRated[member.userId] ?? 0} rated` : '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mp-invite"
              onClick={() => {
                onClose();
                onOpenListSettings();
              }}
            >
              {isOwner ? '+ Invite someone' : 'List settings'}
            </button>
          </div>
        </section>

        <section className="mp-card mp-logout-card">
          <div className="mp-logout-copy">
            <button type="button" className="mp-logout-link" onClick={() => void logout()}>
              Log out
            </button>
            <p>TymMovies · shared watchlist</p>
          </div>
          <button
            type="button"
            className="mp-logout-icon"
            onClick={() => void logout()}
            aria-label="Log out"
          >
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        </section>
      </div>
    </MobileBottomSheet>
  );
}
