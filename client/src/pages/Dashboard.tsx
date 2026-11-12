import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Receipt, Compass, Bot, TrendingUp, ArrowRight, Loader2, Heart, CalendarDays, CircleAlert, Check } from 'lucide-react';
import { api, API_ENDPOINTS, errorMessage, Transaction } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSavedProducts } from '@/hooks/useSavedProducts';
import { useCart } from '@/hooks/useCart';
import ProductCard from '@/components/ProductCard';

const EMPTY_TRANSACTIONS: Transaction[] = [];

// Pure helper: computes current-month spend + 6-month history from a transaction list.
function computeSpending(transactions: Transaction[]) {
  const now = new Date();
  const currentMonthSpend = transactions.filter((transaction) => {
    const date = new Date(transaction.createdAt);
    return transaction.status === 'COMPLETED' && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now); date.setDate(1); date.setMonth(date.getMonth() - (5 - index));
    const amount = transactions.filter((t) => { const d = new Date(t.createdAt); return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && t.status === 'COMPLETED'; }).reduce((sum, t) => sum + t.amount, 0);
    return { label: date.toLocaleDateString(undefined, { month: 'short' }), amount };
  });
  return { currentMonthSpend, monthly };
}

export default function Dashboard() {
  const { user, saveBudget } = useAuth();
  const { products: savedProducts, isSaved, toggle: toggleSaved } = useSavedProducts();
  const { add } = useCart();
  const navigate = useNavigate();
  const [data, setData] = useState<{ transactions: Transaction[]; totalSpent: number; currency?: string } | null>(null);
  const [error, setError] = useState('');
  const [budget, setBudget] = useState(String(user?.monthlyBudget ?? ''));
  const [budgetBusy, setBudgetBusy] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [budgetError, setBudgetError] = useState('');

  useEffect(() => { api.get<{ transactions: Transaction[]; totalSpent: number; currency?: string }>(API_ENDPOINTS.transactions).then(setData).catch((e) => setError(errorMessage(e))); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- load once on mount

  // Sync the budget input when the user profile changes (React "adjust state during render" pattern)
  const [syncedBudget, setSyncedBudget] = useState(user?.monthlyBudget);
  if ((user?.monthlyBudget ?? undefined) !== syncedBudget) {
    setSyncedBudget(user?.monthlyBudget);
    setBudget(String(user?.monthlyBudget ?? ''));
  }

  const transactions = data?.transactions ?? EMPTY_TRANSACTIONS;
  const recent = transactions.slice(0, 5);
  const currency = data?.currency ?? 'INR';
  const formatAmount = (amount: number) => new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN', { style: 'currency', currency }).format(amount);
  // Compute the spend windows outside of render — this runs once per data load.
  const spending = useMemo(() => computeSpending(transactions), [transactions]);
  const { currentMonthSpend, monthly } = spending;
  const maxSpend = Math.max(1, ...monthly.map((item) => item.amount));

  const saveMonthlyBudget = async () => {
    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) { setBudgetError('Enter a monthly budget greater than zero.'); return; }
    setBudgetBusy(true);
    setBudgetError('');
    try { await saveBudget(Number(budget)); setBudgetSaved(true); window.setTimeout(() => setBudgetSaved(false), 2200); }
    catch (reason) { setBudgetError(errorMessage(reason)); }
    finally { setBudgetBusy(false); }
  };
  const addSavedProduct = async (product: (typeof savedProducts)[number]) => {
    try { await add({ productId: product.id, title: product.title, merchant: product.merchant, unitPrice: product.price, image: product.image }); }
    catch (reason) { setError(errorMessage(reason)); }
  };

  return <div className="mx-auto max-w-7xl">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Your account</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Good to see you, {user?.name?.split(' ')[0] ?? 'shopper'}.</h1><p className="mt-1.5 text-sm text-slate-500">A clear view of what you’ve explored, saved, and spent.</p></div><Link to="/assistant" className="inline-flex items-center gap-2 self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 sm:self-auto"><Bot size={15} /> Ask your agent</Link></div>
    {error && <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/[0.07] dark:text-rose-200"><CircleAlert size={15} />{error}</div>}

    <section className="grid gap-3 sm:grid-cols-3">
      {[{ icon: Wallet, label: 'Total spend', value: data ? formatAmount(data.totalSpent) : '—', foot: 'Completed transactions' }, { icon: Receipt, label: 'Transactions', value: data ? String(transactions.length) : '—', foot: `${transactions.filter((t) => t.status === 'COMPLETED').length} completed` }, { icon: Heart, label: 'Saved products', value: String(savedProducts.length), foot: 'Saved on this device' }].map(({ icon: Icon, label, value, foot }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p><Icon size={16} className="text-indigo-600 dark:text-indigo-400" /></div><p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-[10px] text-slate-400">{foot}</p></article>)}
    </section>

    <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Spending activity</h2><p className="mt-1 text-xs text-slate-500">Completed PayPal payments · last six months</p></div><TrendingUp size={17} className="text-slate-400" /></div>
          <div className="mt-6 flex h-36 items-end gap-2 sm:gap-4">{monthly.map((month) => <div key={`${month.label}-${month.amount}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex w-full flex-1 items-end"><div title={formatAmount(month.amount)} className={`w-full rounded-t-md transition-colors ${month.amount > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`} style={{ height: `${month.amount > 0 ? Math.max(12, month.amount / maxSpend * 100) : 5}%` }} /></div><span className="text-[10px] text-slate-400">{month.label}</span></div>)}</div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="text-sm font-semibold">Recent activity</h2><p className="mt-1 text-[11px] text-slate-500">Your latest order updates</p></div><Link to="/transactions" className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">All transactions <ArrowRight size={12} className="ml-1 inline" /></Link></div>
          {!data ? <div className="flex justify-center py-10 text-slate-400"><Loader2 size={18} className="animate-spin" /></div> : recent.length === 0 ? <div className="px-5 py-9 text-center"><CalendarDays size={19} className="mx-auto text-slate-400" /><p className="mt-2 text-xs font-semibold">Your story starts here</p><p className="mt-1 text-[11px] text-slate-500">When you complete an order, it’ll show up here.</p><Link to="/assistant" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Start shopping</Link></div> : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{recent.map((transaction) => <li key={transaction._id} className="flex items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-xs font-semibold">{transaction.items[0]?.title ?? 'Order'}{transaction.items.length > 1 ? ` +${transaction.items.length - 1} more` : ''}</p><p className="mt-1 text-[10px] text-slate-500">{new Date(transaction.createdAt).toLocaleDateString()} · <span className={transaction.status === 'COMPLETED' ? 'text-emerald-600' : transaction.status === 'FAILED' ? 'text-rose-600' : ''}>{transaction.status}</span></p></div><p className="shrink-0 text-xs font-semibold tabular-nums">{new Intl.NumberFormat(transaction.currency === 'USD' ? 'en-US' : 'en-IN', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}</p></li>)}</ul>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-2"><div><h2 className="text-sm font-semibold">Saved products</h2><p className="mt-1 text-[11px] text-slate-500">Saved on this device for your next visit.</p></div><Heart size={16} className="text-rose-500" /></div>
          {savedProducts.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center dark:border-slate-700"><p className="text-xs font-medium">Keep a shortlist close.</p><p className="mt-1 text-[11px] text-slate-500">Tap the heart on any product to save it here.</p><Link to="/discover" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Explore products</Link></div> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{savedProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} compact isSaved={isSaved(product.id)} onSave={() => toggleSaved(product)} onAdd={() => void addSavedProduct(product)} onDetails={() => navigate(`/products/${encodeURIComponent(product.id)}`)} />)}</div>}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold">Monthly budget</h2><p className="mt-1 text-[11px] text-slate-500">A gentle guide for your agent.</p></div><Wallet size={16} className="text-indigo-600 dark:text-indigo-400" /></div>
          <form onSubmit={(e) => { e.preventDefault(); void saveMonthlyBudget(); }} className="mt-4 flex gap-2"><label htmlFor="dashboard-budget" className="sr-only">Monthly budget in rupees</label><input id="dashboard-budget" value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="1" placeholder="₹ e.g. 60,000" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs focus:border-indigo-400 dark:border-slate-700" /><button disabled={budgetBusy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100">{budgetBusy ? <Loader2 size={13} className="animate-spin" /> : budgetSaved ? <Check size={13} /> : null}{budgetSaved ? 'Saved' : 'Save'}</button></form>
          {budgetError && <p role="alert" className="mt-2 rounded-lg bg-rose-50 p-2.5 text-[11px] text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{budgetError}</p>}
          {user?.monthlyBudget && data && currency === 'INR' && <div className="mt-5"><div className="mb-2 flex justify-between text-[10px]"><span className="text-slate-500">Monthly spend so far</span><span className="font-semibold">{Math.min(100, Math.round(currentMonthSpend / user.monthlyBudget * 100))}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${currentMonthSpend > user.monthlyBudget ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, Math.round(currentMonthSpend / user.monthlyBudget * 100))}%` }} /></div><p className="mt-2 text-[10px] text-slate-400">{formatAmount(currentMonthSpend)} spent of ₹{user.monthlyBudget.toLocaleString('en-IN')}</p></div>}
          {user?.monthlyBudget && data && currency !== 'INR' && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">Your monthly budget is in INR, while recorded payments are in {currency}. The budget progress bar is hidden until both currencies match.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-semibold">Quick paths</h2><div className="mt-3 space-y-1"><Link to="/assistant" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><Bot size={14} className="text-indigo-600" /> Shop with your agent</Link><Link to="/discover" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><Compass size={14} className="text-indigo-600" /> Discover products</Link><Link to="/transactions" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><Receipt size={14} className="text-indigo-600" /> View transaction history</Link></div></section>
      </aside>
    </div>
  </div>;
}
