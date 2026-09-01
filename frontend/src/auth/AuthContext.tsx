import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, apiBaseUrl } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the initial session check (GET /api/auth/session) resolves. */
  isLoading: boolean;
  loginWithGoogle: (inviteToken?: string | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await apiClient.get<AuthUser | null>('/auth/session');
      setUser(data ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<AuthUser | null>('/auth/session');
        if (!cancelled) setUser(data ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithGoogle = useCallback((inviteToken?: string | null) => {
    const url = inviteToken
      ? `${apiBaseUrl}/auth/google-start?invite=${encodeURIComponent(inviteToken)}`
      : `${apiBaseUrl}/auth/google-start`;
    window.location.href = url;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, loginWithGoogle, logout, refresh }),
    [user, isLoading, loginWithGoogle, logout, refresh],
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
