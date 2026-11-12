import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, API_ENDPOINTS, CartTotals, getToken } from '@/lib/api';

export interface CartItem {
  productId: string; title: string; merchant: string; unitPrice: number; quantity: number; image?: string;
}

interface CartCtx {
  items: CartItem[];
  totals: CartTotals | null;
  count: number;
  refresh: () => Promise<void>;
  add: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  clearLocal: () => void;
}

const Ctx = createContext<CartCtx>(null as any);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);

  const refresh = async () => {
    if (!getToken()) return;
    try {
      const r = await api.get<{ cart: { items: CartItem[] }; totals: CartTotals }>(API_ENDPOINTS.cart.root);
      setItems(r.cart.items); setTotals(r.totals);
    } catch { /* not logged in */ }
  };

  useEffect(() => { refresh(); }, []);

  const ctx: CartCtx = {
    items, totals,
    count: items.reduce((s, i) => s + i.quantity, 0),
    refresh,
    add: async (item) => { await api.post(API_ENDPOINTS.cart.items, item); await refresh(); },
    remove: async (id) => { await api.del(API_ENDPOINTS.cart.item(id)); await refresh(); },
    setQty: async (id, qty) => { await api.patch(API_ENDPOINTS.cart.item(id), { quantity: qty }); await refresh(); },
    clearLocal: () => { setItems([]); setTotals(null); },
  };
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}
