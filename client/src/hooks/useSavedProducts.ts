import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/lib/api';

const STORAGE_KEY = 'bfm_saved_products';

export function useSavedProducts() {
  const [products, setProducts] = useState<Product[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Product[]; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }, [products]);
  const isSaved = useCallback((id: string) => products.some((product) => product.id === id), [products]);
  const toggle = useCallback((product: Product) => setProducts((current) => current.some((item) => item.id === product.id) ? current.filter((item) => item.id !== product.id) : [product, ...current]), []);
  const remove = useCallback((id: string) => setProducts((current) => current.filter((product) => product.id !== id)), []);
  return { products, isSaved, toggle, remove };
}
