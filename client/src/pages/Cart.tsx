import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShieldAlert, Loader2, Wallet, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api, API_ENDPOINTS } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';

interface Review { overBudget: boolean; message: string; suggestions?: { productId: string; reason: string }[] }

export default function Cart() {
  const { items, totals, remove, setQty, refresh } = useCart();
  const { user, saveBudget } = useAuth();
  const nav = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(user?.monthlyBudget ?? ''));
  const [guardianError, setGuardianError] = useState('');

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- load cart once on mount
  useEffect(() => { void refresh(); }, []);

  const runGuardian = async () => {
    setBusy(true);
    setGuardianError('');
    try {
      let budget = user?.monthlyBudget;
      if (budgetInput && Number(budgetInput) !== budget) { await saveBudget(Number(budgetInput)); budget = Number(budgetInput); }
      const r = await api.post<Review>(API_ENDPOINTS.ai.budgetReview, { total: totals?.total, items, budget });
      setReview(r);
    } catch (error) { setGuardianError(error instanceof Error ? error.message : 'Budget review is unavailable right now.'); } finally { setBusy(false); }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"><ShoppingBag size={21} /></span><p className="mt-4 text-lg font-semibold">Your cart is taking a breather.</p>
        <p className="mt-1 text-sm text-slate-500">Ask your shopping agent for a recommendation or explore the catalogue.</p>
        <div className="mt-6 flex justify-center gap-2"><Link to="/assistant" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Open assistant <ArrowRight size={15} /></Link><Link to="/discover" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700">Browse products</Link></div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Your selection</p><h1 className="mb-1 mt-2 text-2xl font-semibold tracking-tight">Shopping cart</h1><p className="mb-6 text-sm text-slate-500">{items.length} items · review everything before you continue.</p>
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.productId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:flex-nowrap sm:gap-4 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">{i.image ? <img src={i.image} alt={i.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><ShoppingBag size={18} /></div>}</div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold leading-5">{i.title}</h3>
                <p className="mt-1 truncate text-xs text-slate-500">{i.merchant} · ₹{i.unitPrice.toLocaleString('en-IN')} each</p>
              </div>
              <div className="ml-[80px] flex items-center gap-2 sm:ml-0">
                <button aria-label={`Decrease quantity of ${i.title}`} onClick={() => setQty(i.productId, i.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Minus size={13} /></button>
                <span className="w-6 text-center text-sm font-medium tabular-nums">{i.quantity}</span>
                <button aria-label={`Increase quantity of ${i.title}`} onClick={() => setQty(i.productId, i.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Plus size={13} /></button>
              </div>
              <div className="min-w-[76px] text-right text-sm font-semibold tabular-nums">₹{(i.unitPrice * i.quantity).toLocaleString('en-IN')}</div>
              <button aria-label={`Remove ${i.title}`} onClick={() => remove(i.productId)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold">Order summary</h2>
          {totals && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>₹{totals.subtotal.toLocaleString('en-IN')}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tax ({(totals.taxRate * 100).toFixed(0)}%)</dt><dd>₹{totals.tax.toLocaleString('en-IN')}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{totals.shipping === 0 ? 'Free' : `₹${totals.shipping}`}</dd></div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold dark:border-slate-800"><dt>Total</dt><dd>₹{totals.total.toLocaleString('en-IN')}</dd></div>
            </dl>
          )}
          {user?.monthlyBudget && totals && <div className="mt-5 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/70"><div className="flex justify-between text-[11px]"><span className="font-semibold text-slate-700 dark:text-slate-200">Monthly budget</span><span className="text-slate-500">{Math.min(100, Math.round(totals.total / user.monthlyBudget * 100))}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className={`h-full rounded-full ${totals.total > user.monthlyBudget ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, Math.round(totals.total / user.monthlyBudget * 100))}%` }} /></div><p className="mt-2 text-[10px] text-slate-500">₹{totals.total.toLocaleString('en-IN')} of ₹{user.monthlyBudget.toLocaleString('en-IN')}</p></div>}
          <details className="mt-4"><summary className="cursor-pointer text-xs font-semibold text-slate-600 marker:text-indigo-600 dark:text-slate-300">Set or update monthly budget</summary><div className="mt-3 flex gap-2"><input aria-label="Monthly budget in rupees" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} type="number" min="1" placeholder="e.g. 60000" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-indigo-400 dark:border-slate-700" /><button onClick={async () => { if (Number(budgetInput) > 0) await saveBudget(Number(budgetInput)); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700">Save</button></div></details>
          {guardianError && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{guardianError}</p>}
          <button onClick={runGuardian} disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-indigo-400/[0.07]">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />} {busy ? 'Reviewing your budget…' : 'Ask AI to review this cart'}
          </button>
          <button onClick={() => nav('/checkout')} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/15 transition hover:bg-indigo-500">
            Continue to secure checkout <ArrowRight size={15} />
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400"><CheckCircle2 size={12} className="text-emerald-600" /> You’ll review and approve with PayPal Sandbox</p>
        </div>

        {review && (
          <div className={`rounded-2xl border p-5 text-sm ${review.overBudget ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900'}`}>
            <p className="flex items-center gap-2 font-semibold mb-1"><ShieldAlert size={15} /> Budget Guardian</p>
            <p>{review.message}</p>
            {review.suggestions?.map((s) => (
              <p key={s.productId} className="mt-2 text-xs">💡 {s.reason}</p>
            ))}
            {review.overBudget && <p className="mt-3 text-xs font-medium">You can still proceed — the choice is yours.</p>}
          </div>
        )}
      </aside>
    </div>
  );
}
