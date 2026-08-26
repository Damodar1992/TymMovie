import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useAuth } from '../../auth/AuthContext';

function shouldSkipVideo(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData) return true;
  if (
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g'
  ) {
    return true;
  }
  return false;
}

function prepareVideo(el: HTMLVideoElement) {
  el.muted = true;
  el.defaultMuted = true;
  el.volume = 0;
  el.playsInline = true;
  el.autoplay = true;
  el.loop = true;
  el.setAttribute('muted', '');
  el.setAttribute('playsinline', '');
  el.setAttribute('webkit-playsinline', '');
  el.setAttribute('autoplay', '');
}

export function MobileLoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [skipVideo] = useState(shouldSkipVideo);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [useFallback, setUseFallback] = useState(skipVideo);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const failTimerRef = useRef<number | null>(null);

  const attemptPlay = useCallback(async () => {
    const el = videoRef.current;
    if (!el || useFallback) return false;
    prepareVideo(el);
    try {
      await el.play();
      setVideoPlaying(true);
      return true;
    } catch {
      setVideoPlaying(false);
      return false;
    }
  }, [useFallback]);

  useEffect(() => {
    if (skipVideo) return;
    const el = videoRef.current;
    if (!el) return;

    prepareVideo(el);

    const onPlaying = () => {
      setVideoPlaying(true);
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
    };
    const onPause = () => {
      if (!el.ended && document.visibilityState === 'visible') {
        void attemptPlay();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void attemptPlay();
    };
    const onPageShow = () => void attemptPlay();
    const unlock = () => {
      void attemptPlay();
    };

    el.addEventListener('playing', onPlaying);
    el.addEventListener('pause', onPause);
    el.addEventListener('loadeddata', unlock);
    el.addEventListener('canplay', unlock);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true });

    void attemptPlay();
    // If autoplay never starts, fall back to poster/beams.
    failTimerRef.current = window.setTimeout(() => {
      const node = videoRef.current;
      if (!node || node.paused || node.readyState < 2) {
        setUseFallback(true);
        setVideoPlaying(false);
      }
    }, 3500);

    return () => {
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('loadeddata', unlock);
      el.removeEventListener('canplay', unlock);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
      }
    };
  }, [attemptPlay, skipVideo]);

  const canSubmit = loginValue.trim().length > 0 && passwordValue.length > 0;

  const clearError = () => {
    if (error) setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError(null);
    const ok = await login(loginValue.trim(), passwordValue);
    if (!ok) {
      setError('Wrong login or password.');
      setPending(false);
    }
  };

  return (
    <div className={`mlogin${useFallback ? ' is-fallback' : ''}`}>
      <img
        className="mlogin-poster-base"
        src="/spotlight-poster.jpg"
        alt=""
        draggable={false}
        aria-hidden
      />

      {!useFallback ? (
        <video
          ref={videoRef}
          className={`mlogin-video${videoPlaying ? ' is-playing' : ''}`}
          src="/spotlight-theater.mp4"
          poster="/spotlight-poster.jpg"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden="true"
        />
      ) : (
        <div className="mlogin-fallback" aria-hidden>
          <div className="mlogin-beam mlogin-beam-a" />
          <div className="mlogin-beam mlogin-beam-b" />
          <div className="mlogin-dust" />
          <div className="mlogin-halo" />
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
