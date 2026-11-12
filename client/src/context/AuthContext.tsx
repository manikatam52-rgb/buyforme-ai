import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, API_ENDPOINTS, setToken, getToken } from '@/lib/api';

interface User { id: string; email: string; name: string; monthlyBudget?: number }

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  saveBudget: (amount: number) => Promise<void>;
}

// oxlint-disable-next-line react/only-export-components -- standard context + hook pattern
export const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx); // oxlint-disable-line react/only-export-components -- standard context + hook pattern

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- mount-time bootstrap of auth state
    if (!getToken()) { setLoading(false); return; }
    api.get<User>(API_ENDPOINTS.auth.me)
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const ctx: AuthCtx = {
    user,
    loading,
    login: async (email, password) => {
      const r = await api.post<{ token: string; user: User }>(API_ENDPOINTS.auth.login, { email, password });
      setToken(r.token); setUser(r.user);
    },
    register: async (name, email, password) => {
      const r = await api.post<{ token: string; user: User }>(API_ENDPOINTS.auth.register, { name, email, password });
      setToken(r.token); setUser(r.user);
    },
    logout: () => { setToken(null); setUser(null); },
    saveBudget: async (amount) => {
      await api.patch(API_ENDPOINTS.auth.preferences, { monthlyBudget: amount });
      setUser((u) => (u ? { ...u, monthlyBudget: amount } : u));
    },
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}
