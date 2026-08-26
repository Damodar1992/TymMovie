import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../api/client';

export type AuthMode = 'admin' | 'guest' | null;

type AuthContextValue = {
  mode: AuthMode;
  /** True until the initial session check (GET /api/auth/session) resolves. */
  isLoading: boolean;
  isReadOnly: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<{ mode: AuthMode }>('/auth/session');
        if (!cancelled) setMode(data.mode);
      } catch {
        if (!cancelled) setMode(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (loginValue: string, passwordValue: string) => {
    try {
      const { data } = await apiClient.post<{ mode: AuthMode }>('/auth/login', {
        login: loginValue,
        password: passwordValue,
      });
      setMode(data.mode);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    const { data } = await apiClient.post<{ mode: AuthMode }>('/auth/guest');
    setMode(data.mode);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setMode(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      isLoading,
      isReadOnly: mode === 'guest',
      login,
      loginAsGuest,
      logout,
    }),
    [mode, isLoading, login, loginAsGuest, logout],
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
