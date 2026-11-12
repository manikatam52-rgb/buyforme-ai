import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, GitCompareArrows, SlidersHorizontal, X, ArrowRight } from 'lucide-react';
import { api, API_ENDPOINTS, errorMessage, Product } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import ProductCard from '@/components/ProductCard';
import { useSavedProducts } from '@/hooks/useSavedProducts';

export default function Discover() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [maxPrice, setMaxPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const { add } = useCart();
  const saved = useSavedProducts();
  const navigate = useNavigate();

  const load = async (query = q, cap = maxPrice) => {
    setBusy(true); setError('');
    try {
      const search = new URLSearchParams();
      if (query.trim()) search.set('q', query.trim());
      if (cap) search.set('maxPrice', cap);
      const result = await api.get<{ products: Product[]; catalogSource: string }>(`${API_ENDPOINTS.products.list}?${search}`);
      setProducts(result.products ?? []); setSource(result.catalogSource ?? ''); setSelected([]);
    } catch (reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
  };

  useEffect(() => { void load(params.get('q') ?? ''); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timer); }, [toast]);

  const toggleCompare = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  const addItem = async (product: Product) => {
    try { await add({ productId: product.id, title: product.title, merchant: product.merchant, unitPrice: product.price, image: product.image }); setToast(`${product.title} added to cart`); }
    catch (reason) { setToast(errorMessage(reason)); }
  };

  return <div className="mx-auto max-w-7xl">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Product catalogue</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.8rem]">Find your next favourite.</h1><p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Search by product, brand, or the features that matter to you.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{source.startsWith('mock') ? 'Demo catalogue' : source || 'Catalogue'}</div></div>
    <form onSubmit={(event) => { event.preventDefault(); void load(); }} className="mb-6 flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row dark:border-slate-800 dark:bg-slate-900">
      <div className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><label htmlFor="product-search" className="sr-only">Search products</label><input id="product-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “lightweight laptop with long battery life”…" className="w-full rounded-xl border-0 bg-transparent py-3 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:ring-0" /></div>
      <div className="flex gap-2"><div className="relative min-w-0 flex-1 sm:w-40 sm:flex-none"><SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><label htmlFor="product-budget" className="sr-only">Maximum price</label><input id="product-budget" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" min="0" placeholder="Max price ₹" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-2 text-sm outline-none focus:border-indigo-300 dark:border-slate-700 dark:bg-slate-800" /></div><button disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"><Search size={15} /><span className="hidden sm:inline">Search</span></button></div>
    </form>

    <div className="mb-5 flex min-h-9 flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{busy ? 'Finding products…' : error ? 'Search unavailable' : `${products.length} ${products.length === 1 ? 'product' : 'products'}${q ? ` for “${q}”` : ''}`}{source.startsWith('mock') && <span className="ml-2 rounded bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">Demo data · prices are illustrative</span>}</p>{selected.length > 0 && <button onClick={() => navigate(`/compare?ids=${encodeURIComponent(selected.join(','))}`)} disabled={selected.length < 2} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"><GitCompareArrows size={14} /> Compare {selected.length} <ArrowRight size={13} /></button>}</div>

    {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/[0.07] dark:text-rose-200">Could not load products. {error}<button onClick={() => void load()} className="ml-2 font-semibold underline">Try again</button></div>
      : busy ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="aspect-[4/3] animate-pulse bg-slate-200 dark:bg-slate-800" /><div className="space-y-3 p-4"><div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /><div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" /><div className="h-8 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" /></div></div>)}</div>
      : products.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700"><Search size={21} className="mx-auto text-slate-400" /><h2 className="mt-3 text-sm font-semibold">No close matches yet</h2><p className="mt-1 text-xs text-slate-500">Try a broader search or adjust your price limit.</p><button onClick={() => { setQ(''); setMaxPrice(''); void load('', ''); }} className="mt-4 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Clear filters</button></div>
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} onAdd={() => void addItem(product)} onDetails={() => navigate(`/products/${encodeURIComponent(product.id)}`)} onCompare={() => toggleCompare(product.id)} isCompared={selected.includes(product.id)} onSave={() => saved.toggle(product)} isSaved={saved.isSaved(product.id)} />)}</div>}
    {selected.length > 0 && <div className="fixed inset-x-3 bottom-4 z-30 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:inset-x-auto sm:right-6 sm:mx-0 dark:border-slate-700 dark:bg-slate-900/95"><div className="flex items-center gap-2 text-xs font-medium"><GitCompareArrows size={15} className="text-indigo-600" /> {selected.length} selected <button onClick={() => setSelected([])} aria-label="Clear selection" className="ml-1 text-slate-400 hover:text-slate-700"><X size={14} /></button></div><button disabled={selected.length < 2} onClick={() => navigate(`/compare?ids=${encodeURIComponent(selected.join(','))}`)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Compare products</button></div>}
    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-medium text-white shadow-xl dark:bg-white dark:text-slate-950">{toast}</div>}
  </div>;
}
