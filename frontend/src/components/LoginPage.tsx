import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = login(loginValue.trim(), passwordValue);
    if (!ok) {
      setError('Неверный логин или пароль.');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/logo 2.png" alt="TymMovies" className="auth-logo" />
        <p className="auth-subtitle">Sign in as admin or continue as guest.</p>

        {error && <div className="error-banner">{error}</div>}

        <label className="auth-field">
          <span>Login</span>
          <input
            type="text"
            value={loginValue}
            onChange={(e) => {
              setLoginValue(e.target.value);
              if (error) setError(null);
            }}
            autoComplete="username"
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={passwordValue}
            onChange={(e) => {
              setPasswordValue(e.target.value);
              if (error) setError(null);
            }}
            autoComplete="current-password"
            required
          />
        </label>

        <div className="auth-actions">
          <button type="submit" className="primary-button">
            Login
          </button>
          <button type="button" className="secondary-button auth-guest-btn" onClick={loginAsGuest}>
            Continue as Guest
          </button>
        </div>
      </form>
    </div>
  );
}
