import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useActiveList } from '../state/ActiveListContext';
import { useAcceptInviteMutation, useInvitePreviewQuery } from '../api/invites';
import './desktop-login.css';

function InviteShell({ children }: { children: ReactNode }) {
  return (
    <div className="desktop-auth invite-shell">
      <header className="desktop-auth-brand" aria-label="TymMovies">
        <img src="/tymmovies-mark.svg" alt="" width={36} height={36} />
        <div><div className="desktop-auth-name">Tym<span>Movies</span></div><p>Shared watchlist</p></div>
      </header>
      <main className="desktop-auth-layout invite-shell-layout">
        <section className="desktop-auth-form-area">
          <div className="desktop-auth-card desktop-auth-card-google">{children}</div>
        </section>
      </main>
    </div>
  );
}

/** Public route: /invite/:token — see db-multi-user-architecture doc §4.
 *  Works whether the visitor is already signed in (accept immediately) or
 *  brand new (Google login carries the token through `state` and joins in
 *  the same round trip, see auth/google-callback.ts). */
export function InvitePage({ token }: { token: string }) {
  const { user, isLoading: authLoading, loginWithGoogle } = useAuth();
  const { data: preview, isLoading: previewLoading } = useInvitePreviewQuery(token);
  const { setActiveListId } = useActiveList();
  const acceptMutation = useAcceptInviteMutation();
  const [joined, setJoined] = useState(false);

  const handleAccept = async () => {
    try {
      const { listId } = await acceptMutation.mutateAsync(token);
      setActiveListId(listId);
      setJoined(true);
      window.setTimeout(() => {
        window.location.href = '/';
      }, 600);
    } catch {
      /* acceptMutation.isError renders the message below */
    }
  };

  if (authLoading || previewLoading) {
    return <InviteShell><p className="desktop-auth-footnote">Loading…</p></InviteShell>;
  }

  if (!preview || !preview.valid) {
    return (
      <InviteShell>
        <p className="desktop-auth-eyebrow">Invite link</p>
        <h2>This link isn't valid</h2>
        <p className="desktop-auth-footnote">
          It may have been revoked. Ask whoever sent it to share a new one.
        </p>
      </InviteShell>
    );
  }

  if (joined) {
    return (
      <InviteShell>
        <p className="desktop-auth-eyebrow">Invite link</p>
        <h2>You're in</h2>
        <p className="desktop-auth-footnote">Taking you to "{preview.listName}"…</p>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <p className="desktop-auth-eyebrow">Invite link</p>
      <h2>Join "{preview.listName}"</h2>
      <p className="desktop-auth-footnote" style={{ marginTop: 0, marginBottom: 20 }}>
        Invited by {preview.ownerName}.
      </p>
      {user ? (
        <button
          type="button"
          className="desktop-auth-submit"
          onClick={() => void handleAccept()}
          disabled={acceptMutation.isPending}
        >
          {acceptMutation.isPending ? 'Joining…' : 'Join list'}
        </button>
      ) : (
        <button type="button" className="desktop-auth-google-btn" onClick={() => loginWithGoogle(token)}>
          Continue with Google to join
        </button>
      )}
      {acceptMutation.isError ? (
        <p className="desktop-auth-error">Something went wrong. Please try again.</p>
      ) : null}
    </InviteShell>
  );
}
