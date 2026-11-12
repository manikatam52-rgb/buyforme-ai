import { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule, TextFilterModule, NumberFilterModule, PaginationModule, CellStyleModule, themeQuartz, ColDef } from 'ag-grid-community';
import { Sparkles, Loader2 } from 'lucide-react';
import { api, API_ENDPOINTS, Product, errorMessage } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useSearchParams } from 'react-router-dom';

ModuleRegistry.registerModules([ClientSideRowModelModule, TextFilterModule, NumberFilterModule, PaginationModule, CellStyleModule]);

interface Comparison {
  bestOverall: string; bestBudget?: string; bestPerformance?: string; bestValue?: string; tradeoffs?: string; summary: string;
}

export default function Compare() {
  const [products, setProducts] = useState<Product[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [compareError, setCompareError] = useState('');
  const { add } = useCart();
  const [params] = useSearchParams();
  const requestedIdsKey = params.get('ids') ?? '';
  const requestedIds = useMemo(() => requestedIdsKey.split(',').filter(Boolean), [requestedIdsKey]);
  const comparisonRows = products;

  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/set-state-in-effect -- show the pending load state before starting the request
    setProductsLoading(true);
    setLoadError('');
    setProducts([]);
    const ids = requestedIdsKey.split(',').filter(Boolean);
    const load = ids.length >= 2
      ? Promise.all(ids.map((id) => api.get<Product>(API_ENDPOINTS.products.detail(id))))
      : api.get<{ products: Product[] }>(`${API_ENDPOINTS.products.list}?limit=24`).then((r) => r.products);
    load.then((rows) => { if (active) setProducts(rows); })
      .catch((reason) => { if (active) setLoadError(errorMessage(reason)); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, [requestedIdsKey, loadAttempt]);

  const bestSet = useMemo(() => {
    if (!comparison) return new Set<string>();
    const names = [comparison.bestOverall, comparison.bestBudget, comparison.bestPerformance, comparison.bestValue]
      .filter(Boolean).map((n) => (n as string).trim().replace(/\s+[—–:]\s+.*$/, '').replace(/\s+\([^)]*\)\s*$/, '').toLowerCase());
    return new Set(names);
  }, [comparison]);

  const columnDefs = useMemo<ColDef[]>(() => {
    const base: ColDef[] = [
      {
        headerName: 'Product', field: 'title', pinned: 'left', flex: 2, minWidth: 220,
        cellClassRules: {
          'ag-cell-highlight-value': (p) => [...bestSet].some((name) => {
            const title = String(p.value).trim().toLowerCase();
            return Boolean(title) && (title.includes(name) || name.includes(title));
          }),
        },
      },
      { headerName: 'Brand', field: 'brand', filter: true, minWidth: 100 },
      {
        headerName: 'Price', field: 'price', sort: 'asc', sortIndex: 0, minWidth: 120,
        valueFormatter: (p) => `₹${Number(p.value).toLocaleString('en-IN')}`,
        cellClassRules: {
          'ag-cell-highlight-value': (p) => {
            const min = comparisonRows.length ? Math.min(...comparisonRows.map((x) => x.price)) : Number.NaN;
            return Number(p.value) === min;
          },
        },
      },
      { headerName: 'Rating', field: 'rating', minWidth: 100, sort: 'desc', sortIndex: 1, valueFormatter: (p) => (p.value ? `${p.value} ★` : '—') },
      { headerName: 'Merchant', field: 'merchant', filter: true, minWidth: 140 },
      ...[...new Set(comparisonRows.flatMap((product) => Object.keys(product.specs ?? {})))].map((k) => ({
        headerName: k, field: `specs.${k}`, minWidth: 120,
        valueGetter: (p: any) => p.data?.specs?.[k] ?? '—',
      })),
      {
        headerName: '', colId: 'actions', minWidth: 110, sortable: false, filter: false,
        cellRenderer: (p: any) => <button type="button" onClick={() => void add({ productId: p.data.id, title: p.data.title, merchant: p.data.merchant, unitPrice: p.data.price, image: p.data.image })} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">Add to cart</button>,
      },
    ];
    return base;
  }, [bestSet, comparisonRows, add]);

  const runCompare = async () => {
    const chosen = requestedIds.length >= 2 ? products.filter((p) => requestedIds.includes(p.id)) : products.slice(0, 3);
    if (chosen.length < 2) return;
    setBusy(true);
    setCompareError('');
    try {
      const r = await api.post<{ comparison: Comparison }>(API_ENDPOINTS.ai.compare, { productIds: chosen.map((p) => p.id) });
      setComparison(r.comparison);
    } catch (e) { setCompareError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Make the call with clarity</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Compare products</h1><p className="mt-1.5 text-sm text-slate-500">{requestedIds.length >= 2 ? `Comparing your ${comparisonRows.length} selected products.` : 'Sort by price or rating, filter specs, and ask AI to explain its pick.'}</p></div>
        <button onClick={runCompare} disabled={busy || comparisonRows.length < 2} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60">
          {busy ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} AI Explain
        </button>
      </div>
      <p className="sr-only">Click column headers to sort; use the column menu to filter. Lowest price and AI picks are highlighted.</p>

      {loadError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Could not load comparison products: {loadError}<button onClick={() => setLoadAttempt((n) => n + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
      {compareError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{compareError}<button onClick={runCompare} className="ml-2 font-semibold underline">Retry</button></div>}

      {comparison && (
        <div className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 p-5 text-sm space-y-2">
          <p className="font-semibold text-indigo-700 dark:text-indigo-300">{comparison.summary}</p>
          <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-1">
            <li><strong>Best overall:</strong> {comparison.bestOverall}</li>
            {comparison.bestBudget && <li><strong>Best budget:</strong> {comparison.bestBudget}</li>}
            {comparison.bestPerformance && <li><strong>Best performance:</strong> {comparison.bestPerformance}</li>}
            {comparison.bestValue && <li><strong>Best value:</strong> {comparison.bestValue}</li>}
            {comparison.tradeoffs && <li><strong>Trade-offs:</strong> {comparison.tradeoffs}</li>}
          </ul>
        </div>
      )}

      {productsLoading ? <div role="status" className="h-[520px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" /> : products.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500 dark:border-slate-700">No products are available to compare.</div> : <div className="ag-theme-quartz overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800" style={{ height: 520, width: '100%' }}>
        <AgGridReact
          rowData={comparisonRows}
          columnDefs={columnDefs}
          theme={themeQuartz.withParams({ darkMode: document.documentElement.classList.contains('dark') } as any)}
          pagination
          paginationPageSize={10}
          defaultColDef={{ sortable: true, filter: true, floatingFilter: true, resizable: true, minWidth: 120 }}
          getRowId={(p) => p.data.id}
        />
      </div>}
    </div>
  );
}
