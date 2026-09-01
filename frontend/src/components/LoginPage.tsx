import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useIsMobileLayout } from '../hooks/useIsMobileLayout';
import { MobileLoginPage } from './mobile/MobileLoginPage';
import { GoogleGlyph } from './GoogleGlyph';
import './desktop-login.css';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Google sign-in was cancelled.',
  google_failed: 'Google sign-in failed. Please try again.',
  invalid_state: 'That sign-in link expired. Please try again.',
  missing_code: 'Google sign-in failed. Please try again.',
};

function readAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('authError');
  if (!raw) return null;
  return AUTH_ERROR_MESSAGES[raw] ?? 'Sign-in failed. Please try again.';
}

function DesktopLoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error] = useState<string | null>(readAuthError);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // 20% slower than native playback for a calmer login atmosphere.
    el.playbackRate = 0.64;
  }, []);

  useEffect(() => {
    if (error) {
      const url = new URL(window.location.href);
      url.searchParams.delete('authError');
      window.history.replaceState({}, '', url.toString());
    }
  }, [error]);

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
        <div><div className="desktop-auth-name">Tym<span>Movies</span></div><p>Shared watchlist</p></div>
      </header>
      <main className="desktop-auth-layout">
        <section className="desktop-auth-hero" aria-label="About TymMovies">
          <div className="desktop-auth-hero-copy">
            <h1>Everything you<br />meant to watch.</h1>
            <p>Your own list, or a list someone shared with you — with ratings from everyone who watched.</p>
          </div>
        </section>
        <section className="desktop-auth-form-area">
          <div className="desktop-auth-card desktop-auth-card-google">
            <p className="desktop-auth-eyebrow">Welcome</p>
            <h2>Sign in</h2>
            {error ? <p className="desktop-auth-error">{error}</p> : null}
            <button
              type="button"
              className="desktop-auth-google-btn"
              onClick={() => loginWithGoogle()}
            >
              <GoogleGlyph />
              Continue with Google
            </button>
            <p className="desktop-auth-footnote">
              Anyone can sign in — you'll only see lists you own or were invited to.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export function LoginPage() {
  return useIsMobileLayout() ? <MobileLoginPage /> : <DesktopLoginPage />;
}
