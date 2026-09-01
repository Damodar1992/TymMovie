import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useActiveList } from '../state/ActiveListContext';
import { useAcceptInviteMutation, useInvitePreviewQuery } from '../api/invites';
import { GoogleGlyph } from './GoogleGlyph';
import './desktop-login.css';

function InviteShell({
  heroTitle,
  heroSubtitle,
  children,
}: {
  heroTitle: ReactNode;
  heroSubtitle?: ReactNode;
  children: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = 0.64;
  }, []);

  return (
    <div className="desktop-auth">
      <video
        ref={videoRef}
        className="desktop-auth-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = 0.64;
        }}
      >
        <source src="/login-background.mp4" type="video/mp4" />
      </video>
      <header className="desktop-auth-brand" aria-label="TymMovies">
        <img src="/tymmovies-mark.svg" alt="" width={36} height={36} />
        <div>
          <div className="desktop-auth-name">
            Tym<span>Movies</span>
          </div>
          <p>Shared watchlist</p>
        </div>
      </header>
      <main className="desktop-auth-layout">
        <section className="desktop-auth-hero" aria-label="Invite">
          <div className="desktop-auth-hero-copy">
            <h1>{heroTitle}</h1>
            {heroSubtitle ? <p>{heroSubtitle}</p> : null}
          </div>
        </section>
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
    return (
      <InviteShell
        heroTitle={
          <>
            You're invited
            <br />
            to watch together.
          </>
        }
        heroSubtitle="Loading invite details…"
      >
        <p className="desktop-auth-eyebrow">Invite link</p>
        <h2>One moment</h2>
        <p className="desktop-auth-footnote">Loading…</p>
      </InviteShell>
    );
  }

  if (!preview || !preview.valid) {
    return (
      <InviteShell
        heroTitle={
          <>
            This link
            <br />
            isn't valid.
          </>
        }
        heroSubtitle="It may have been revoked or already used."
      >
        <p className="desktop-auth-eyebrow">Invite link</p>
        <h2>Can't join</h2>
        <p className="desktop-auth-footnote">
          Ask whoever sent it to share a new one.
        </p>
      </InviteShell>
    );
  }

  if (joined) {
    return (
      <InviteShell
        heroTitle={
          <>
            You're
            <br />
            in.
          </>
        }
        heroSubtitle={`Taking you to "${preview.listName}"…`}
      >
        <p className="desktop-auth-eyebrow">Invite link</p>
        <h2>Welcome</h2>
        <p className="desktop-auth-footnote">Redirecting to your shared list…</p>
      </InviteShell>
    );
  }

  return (
    <InviteShell
      heroTitle={
        <>
          You're invited
          <br />
          to watch together.
        </>
      }
      heroSubtitle={
        <>
          {preview.ownerName} shared &ldquo;{preview.listName}&rdquo; with you — sign in and start
          comparing ratings.
        </>
      }
    >
      <p className="desktop-auth-eyebrow">Invite link</p>
      <h2>{user ? 'Join the list' : 'Sign in to join'}</h2>
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
        <button
          type="button"
          className="desktop-auth-google-btn"
          onClick={() => loginWithGoogle(token)}
        >
          <GoogleGlyph />
          Continue with Google
        </button>
      )}
      {acceptMutation.isError ? (
        <p className="desktop-auth-error">Something went wrong. Please try again.</p>
      ) : null}
      {!user ? (
        <p className="desktop-auth-footnote">
          Anyone can sign in — you&apos;ll only see lists you own or were invited to.
        </p>
      ) : null}
    </InviteShell>
  );
}
