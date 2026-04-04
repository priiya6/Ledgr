import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { bindAuthHandlers, api } from '@/api/client';
import { useLoginMutation, type AuthUser } from '@/api/hooks';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  setSession: (user: AuthUser | null, token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const loginMutation = useLoginMutation();

  const setSession = (nextUser: AuthUser | null, token: string | null) => {
    setUser(nextUser);
    setAccessToken(token);
    tokenRef.current = token;
  };

  const refresh = async () => {
    try {
      const response = await api.post('/auth/refresh');
      const nextToken = response.data.data.accessToken as string;
      const nextUser = response.data.data.user as AuthUser;
      setSession(nextUser, nextToken);
      return nextToken;
    } catch {
      setSession(null, null);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    setSession(result.user, result.accessToken);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // no-op
    } finally {
      setSession(null, null);
    }
  };

  useEffect(() => {
    bindAuthHandlers({
      getToken: () => tokenRef.current,
      refreshAccessToken: refresh,
      handleLogout: () => {
        setSession(null, null);
      },
    });
    void refresh().finally(() => setIsReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isReady,
      login,
      logout,
      refresh,
      setSession,
    }),
    [user, accessToken, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
