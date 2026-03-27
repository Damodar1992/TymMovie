import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AuthMode = 'admin' | 'guest' | null;

export const AUTH_STORAGE_KEY = 'tym-movies-auth-mode';
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
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw === 'admin' || raw === 'guest') return raw;
  } catch {
    // ignore storage failures
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(getStoredMode);

  const persistMode = useCallback((next: AuthMode) => {
    try {
      if (next) localStorage.setItem(AUTH_STORAGE_KEY, next);
      else localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }, []);

  const login = useCallback(
    (loginValue: string, passwordValue: string) => {
      if (loginValue === ADMIN_LOGIN && passwordValue === ADMIN_PASSWORD) {
        setMode('admin');
        persistMode('admin');
        return true;
      }
      return false;
    },
    [persistMode],
  );

  const loginAsGuest = useCallback(() => {
    setMode('guest');
    persistMode('guest');
  }, [persistMode]);

  const logout = useCallback(() => {
    setMode(null);
    persistMode(null);
  }, [persistMode]);

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
