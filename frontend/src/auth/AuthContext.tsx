import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AuthMode = 'admin' | 'guest' | null;

/** Legacy key — still written for existing clients. */
export const AUTH_STORAGE_KEY = 'tym-movies-auth-mode';
const SESSION_KEY = 'tm.session';
const GUEST_KEY = 'tm.guest';

const ADMIN_LOGIN = 'TymAdmin';
const ADMIN_PASSWORD = '19911992QWe';

type AuthContextValue = {
  mode: AuthMode;
  isReadOnly: boolean;
  login: (login: string, password: string) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredMode(): AuthMode {
  try {
    if (localStorage.getItem(GUEST_KEY) === '1') return 'guest';
    if (localStorage.getItem(SESSION_KEY)) return 'admin';
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw === 'admin' || raw === 'guest') return raw;
  } catch {
    // ignore storage failures
  }
  return null;
}

function writeSession(next: AuthMode) {
  try {
    if (next === 'admin') {
      localStorage.setItem(SESSION_KEY, 'admin');
      localStorage.removeItem(GUEST_KEY);
      localStorage.setItem(AUTH_STORAGE_KEY, 'admin');
      return;
    }
    if (next === 'guest') {
      localStorage.setItem(GUEST_KEY, '1');
      localStorage.removeItem(SESSION_KEY);
      localStorage.setItem(AUTH_STORAGE_KEY, 'guest');
      return;
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(getStoredMode);

  const login = useCallback((loginValue: string, passwordValue: string) => {
    if (loginValue === ADMIN_LOGIN && passwordValue === ADMIN_PASSWORD) {
      setMode('admin');
      writeSession('admin');
      return true;
    }
    return false;
  }, []);

  const loginAsGuest = useCallback(() => {
    setMode('guest');
    writeSession('guest');
  }, []);

  const logout = useCallback(() => {
    setMode(null);
    writeSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      isReadOnly: mode === 'guest',
      login,
      loginAsGuest,
      logout,
    }),
    [mode, login, loginAsGuest, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
