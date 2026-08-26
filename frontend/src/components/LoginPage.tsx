import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useIsMobileLayout } from '../hooks/useIsMobileLayout';
import { MobileLoginPage } from './mobile/MobileLoginPage';
import './desktop-login.css';

function DesktopLoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const canSubmit = loginValue.trim().length > 0 && passwordValue.length > 0 && !pending;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const ok = await login(loginValue.trim(), passwordValue);
    setPending(false);
    if (!ok) setError('Wrong login or password.');
  };

  return (
    <div className="desktop-auth">
      <video
        className="desktop-auth-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/login-background.mp4" type="video/mp4" />
      </video>
      <header className="desktop-auth-brand" aria-label="TymMovies">
        <img src="/tymmovies-mark.svg" alt="" width={36} height={36} />
        <div><div className="desktop-auth-name">Tym<span>Movies</span></div><p>Shared watchlist</p></div>
      </header>
      <main className="desktop-auth-layout">
        <section className="desktop-auth-hero" aria-label="About TymMovies">
          <div className="desktop-auth-orbit" aria-hidden />
          <div className="desktop-auth-hero-copy">
            <h1>Everything you<br />meant to watch.</h1>
            <p>One shared list for two people, with ratings that finally settle the argument.</p>
            <div className="desktop-auth-stats">
              <div><strong>13</strong><span>Titles in list</span></div>
              <div><strong>5</strong><span>Watched together</span></div>
              <div><strong>6.4</strong><span>Average Tym</span></div>
            </div>
          </div>
        </section>
        <section className="desktop-auth-form-area">
          <form className="desktop-auth-card" onSubmit={handleSubmit} noValidate>
            <p className="desktop-auth-eyebrow">Welcome back</p>
            <h2>Sign in</h2>
            {error ? <p className="desktop-auth-error">{error}</p> : null}
            <label className="desktop-auth-field"><span>Login</span><input type="text" placeholder="admin" value={loginValue} onChange={(event) => { setLoginValue(event.target.value); setError(null); }} autoComplete="username" /></label>
            <label className="desktop-auth-field"><span>Password</span><div className="desktop-auth-password-wrap"><input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={passwordValue} onChange={(event) => { setPasswordValue(event.target.value); setError(null); }} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'hide' : 'show'}</button></div></label>
            <div className="desktop-auth-options"><label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Keep me signed in</span></label><span className="desktop-auth-help">Need help?</span></div>
            <button className="desktop-auth-submit" type="submit" disabled={!canSubmit}>{pending ? 'Signing in\u2026' : 'Sign in'}</button>
            <div className="desktop-auth-divider"><span>or</span></div>
            <button type="button" className="desktop-auth-guest" onClick={loginAsGuest}>Continue as guest</button>
            <p className="desktop-auth-footnote">Guests can browse the list, but not rate or edit.</p>
          </form>
        </section>
      </main>
    </div>
  );
}

export function LoginPage() {
  return useIsMobileLayout() ? <MobileLoginPage /> : <DesktopLoginPage />;
}
