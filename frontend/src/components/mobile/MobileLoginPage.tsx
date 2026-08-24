import {
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type RefCallback,
} from 'react';
import { useAuth } from '../../auth/AuthContext';

function shouldSkipVideo(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean };
    }
  ).connection;
  if (connection?.saveData) return true;
  return false;
}

function tryPlay(el: HTMLVideoElement) {
  el.muted = true;
  el.defaultMuted = true;
  el.playsInline = true;
  const play = () => {
    el.muted = true;
    void el.play().catch(() => {});
  };
  play();
  el.addEventListener('canplay', play, { once: true });
  el.addEventListener('loadeddata', play, { once: true });
}

export function MobileLoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const skipVideo = shouldSkipVideo();
  const videoBoundRef = useRef<HTMLVideoElement | null>(null);

  const videoRef = useCallback<RefCallback<HTMLVideoElement>>((el) => {
    if (videoBoundRef.current === el) return;
    videoBoundRef.current = el;
    if (!el) return;
    tryPlay(el);
  }, []);

  const canSubmit = loginValue.trim().length > 0 && passwordValue.length > 0;

  const clearError = () => {
    if (error) setError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError(null);
    window.setTimeout(() => {
      const ok = login(loginValue.trim(), passwordValue);
      if (!ok) {
        setError('Wrong login or password.');
        setPending(false);
      }
      // On success, AuthProvider remounts the app — leave pending true until unmount.
    }, 180);
  };

  return (
    <div className={`mlogin${skipVideo ? ' is-fallback' : ''}`}>
      {!skipVideo ? (
        <video
          ref={videoRef}
          className="mlogin-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/spotlight-poster.jpg"
          aria-hidden="true"
        >
          <source src="/spotlight-theater.mp4" type="video/mp4" />
        </video>
      ) : (
        <div className="mlogin-fallback" aria-hidden>
          <div className="mlogin-beam mlogin-beam-a" />
          <div className="mlogin-beam mlogin-beam-b" />
          <div className="mlogin-dust" />
          <div className="mlogin-halo" />
          <img
            className="mlogin-poster"
            src="/spotlight-poster.jpg"
            alt=""
            draggable={false}
          />
        </div>
      )}

      <div className="mlogin-scrim mlogin-scrim-a" aria-hidden />
      <div className="mlogin-scrim mlogin-scrim-b" aria-hidden />

      <div className="mlogin-column">
        <div className="mlogin-brand" aria-label="TymMovies">
          <div className="mlogin-mark" aria-hidden>
            <span className="mlogin-mark-bar" />
            <span className="mlogin-mark-play" />
          </div>
          <div className="mlogin-wordmark">
            Tym<span>Movies</span>
          </div>
        </div>

        <h1 className="mlogin-headline">Everything you meant to watch.</h1>
        <p className="mlogin-subhead">
          One shared list for two people, with ratings that finally settle the
          argument.
        </p>

        <form className="mlogin-card" onSubmit={handleSubmit} noValidate>
          <div className={`mlogin-fields${error ? ' has-error' : ''}`}>
            <div className="mlogin-field">
              <label className="visually-hidden" htmlFor="mlogin-login">
                Login
              </label>
              <input
                id="mlogin-login"
                name="login"
                type="text"
                placeholder="Login"
                value={loginValue}
                onChange={(event) => {
                  setLoginValue(event.target.value);
                  clearError();
                }}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={pending}
              />
            </div>

            <div className="mlogin-field mlogin-field-password">
              <label className="visually-hidden" htmlFor="mlogin-password">
                Password
              </label>
              <input
                id="mlogin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={passwordValue}
                onChange={(event) => {
                  setPasswordValue(event.target.value);
                  clearError();
                }}
                autoComplete="current-password"
                disabled={pending}
              />
              <button
                type="button"
                className="mlogin-reveal"
                onClick={() => setShowPassword((value) => !value)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={pending}
              >
                {showPassword ? 'hide' : 'show'}
              </button>
            </div>

            {error ? <p className="mlogin-error">{error}</p> : null}
          </div>

          <button
            type="submit"
            className={`mlogin-primary${canSubmit || pending ? ' is-ready' : ''}`}
            disabled={!canSubmit}
            aria-disabled={!canSubmit || pending}
            aria-busy={pending}
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="mlogin-or" aria-hidden>
            <span />
            <em>or</em>
            <span />
          </div>

          <button
            type="button"
            className="mlogin-guest"
            onClick={loginAsGuest}
            disabled={pending}
          >
            Continue as guest
          </button>

          <p className="mlogin-footnote">Forgot the password? Ask the admin.</p>
        </form>
      </div>
    </div>
  );
}
