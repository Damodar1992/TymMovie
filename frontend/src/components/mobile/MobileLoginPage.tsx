import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { GoogleGlyph } from '../GoogleGlyph';

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
  // 20% slower than native playback for a calmer login atmosphere.
  el.playbackRate = 0.64;
  el.setAttribute('muted', '');
  el.setAttribute('playsinline', '');
  el.setAttribute('webkit-playsinline', '');
  el.setAttribute('autoplay', '');
}

function readAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('authError');
}

export function MobileLoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error] = useState<string | null>(readAuthError);
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
      el.playbackRate = 0.64;
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

        <h1 className="mlogin-headline">
          Everything you want to watch.
          <br />
          All in one place.
        </h1>
        <p className="mlogin-subhead">
          Share lists, compare ratings, and decide what to watch next -
          together.
        </p>

        <div className="mlogin-card">
          {error ? <p className="mlogin-error">Sign-in failed. Please try again.</p> : null}
          <button
            type="button"
            className="mlogin-primary is-ready"
            onClick={() => loginWithGoogle()}
          >
            <GoogleGlyph />
            Continue with Google
          </button>
          <p className="mlogin-footnote">Anyone can sign in — you'll only see lists you own or were invited to.</p>
        </div>
      </div>
    </div>
  );
}
