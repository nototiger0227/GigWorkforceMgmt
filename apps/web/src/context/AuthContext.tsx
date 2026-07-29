import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, LoginResponse } from '@gig/shared';
import { api, clearToken, getToken, setToken } from '../lib/api';
import { disconnectSocket } from '../lib/socket';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ user: AuthUser }>('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    clearToken();
    disconnectSocket();
    setUser(null);
  }

  function setAuth(token: string, u: AuthUser) {
    setToken(token);
    setUser(u);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
