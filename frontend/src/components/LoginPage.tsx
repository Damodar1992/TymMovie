import { useState, type FormEvent, type InputHTMLAttributes, type MouseEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

const LOGIN_HERO_SRC = '/login-hero.jpg';

type AuthGlowInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label?: string;
};

function AuthGlowInput({ label, placeholder, ...rest }: AuthGlowInputProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="auth-glow-field">
      {label ? <span className="auth-glow-label">{label}</span> : null}
      <div
        className="auth-glow-input-wrap"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <input className="auth-glow-input" placeholder={placeholder} {...rest} />
        {isHovering ? (
          <>
            <div
              className="auth-glow-line auth-glow-line-top"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--auth-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="auth-glow-line auth-glow-line-bottom"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--auth-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [orbPos, setOrbPos] = useState({ x: 0, y: 0 });
  const [orbActive, setOrbActive] = useState(false);

  const handleOrbMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrbPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = login(loginValue.trim(), passwordValue);
    if (!ok) {
      setError('Неверный логин или пароль.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-login-shell">
        <div
          className={`auth-login-form-col${orbActive ? ' is-orb-active' : ''}`}
          onMouseMove={handleOrbMove}
          onMouseEnter={() => setOrbActive(true)}
          onMouseLeave={() => setOrbActive(false)}
        >
          <div
            className="auth-login-orb"
            style={{
              transform: `translate(${orbPos.x - 250}px, ${orbPos.y - 250}px)`,
            }}
          />
          <div className="auth-form-stack">
            <div className="auth-login-brand">
              <img src="/logo 2.png" alt="TymMovies" className="auth-logo-compact" />
              <h1 className="auth-login-title">Sign in</h1>
              <p className="auth-subtitle">Sign in as admin or continue as guest.</p>
            </div>

            {error ? <div className="error-banner">{error}</div> : null}

            <form onSubmit={handleSubmit}>
              <AuthGlowInput
                placeholder="Login"
                type="text"
                value={loginValue}
                onChange={(e) => {
                  setLoginValue(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="username"
                required
              />
              <AuthGlowInput
                placeholder="Password"
                type="password"
                value={passwordValue}
                onChange={(e) => {
                  setPasswordValue(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="current-password"
                required
              />

              <span className="auth-forgot-hint">Forgot your password? Ask the admin.</span>

              <div className="auth-cta-row">
                <button type="submit" className="auth-btn-signin">
                  <span>Sign in</span>
                  <span className="auth-btn-signin-shine" aria-hidden>
                    <span className="auth-btn-signin-shine-bar" />
                  </span>
                </button>
                <button type="button" className="auth-btn-guest" onClick={loginAsGuest}>
                  Continue as Guest
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="auth-login-hero" aria-hidden>
          <img
            src={LOGIN_HERO_SRC}
            alt="Cinema theater seats"
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
