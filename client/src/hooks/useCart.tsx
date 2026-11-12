import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api, API_ENDPOINTS, CartTotals, getToken } from '@/lib/api';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  productId: string; title: string; merchant: string; unitPrice: number; quantity: number; image?: string;
}

interface CartCtx {
  items: CartItem[];
  totals: CartTotals | null;
  count: number;
  loading: boolean;
  error: string;
  refresh: (showLoading?: boolean) => Promise<void>;
  add: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  clearAfterPurchase: () => Promise<boolean>;
}

// oxlint-disable-next-line react/only-export-components -- standard context + hook pattern
export const Ctx = createContext<CartCtx>(null as any);
export const useCart = () => useContext(Ctx); // oxlint-disable-line react/only-export-components -- standard context + hook pattern

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async (showLoading = false) => {
    if (!getToken()) {
      setItems([]); setTotals(null); setError(''); setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const r = await api.get<{ cart: { items: CartItem[] }; totals: CartTotals }>(API_ENDPOINTS.cart.root);
      setItems(r.cart.items ?? []); setTotals(r.totals); setError('');
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }, []);

  // Synchronize the server cart when the authenticated user becomes available.
  useEffect(() => {
    if (authLoading) return;
    // oxlint-disable-next-line react/set-state-in-effect -- synchronize external cart data after auth resolves
    if (user) void refresh(true);
    else { setItems([]); setTotals(null); setError(''); setLoading(false); }
  }, [user, authLoading, refresh]);

  const ctx: CartCtx = {
    items, totals, loading, error,
    count: items.reduce((s, i) => s + i.quantity, 0),
    refresh,
    add: async (item) => { await api.post(API_ENDPOINTS.cart.items, item); await refresh(); },
    remove: async (id) => { await api.del(API_ENDPOINTS.cart.item(id)); await refresh(); },
    setQty: async (id, qty) => { await api.patch(API_ENDPOINTS.cart.item(id), { quantity: qty }); await refresh(); },
    clearAfterPurchase: async () => {
      const results = await Promise.allSettled(items.map((item) => api.del(API_ENDPOINTS.cart.item(item.productId))));
      await refresh();
      return results.every((result) => result.status === 'fulfilled');
    },
  };
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}
