import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, Bot, Check, ChevronRight, CircleDollarSign, CreditCard, Fingerprint, GitCompareArrows, Sparkles, WalletCards } from 'lucide-react';
import { api, API_ENDPOINTS, type Product } from '@/lib/api';

export default function Landing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogSource, setCatalogSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageFailures, setImageFailures] = useState<string[]>([]);

  useEffect(() => {
    api.get<{ products: Product[]; catalogSource: string }>(`${API_ENDPOINTS.products.list}?limit=3`)
      .then((data) => { setProducts(data.products ?? []); setCatalogSource(data.catalogSource ?? ''); })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const prompt = 'Find me a great everyday laptop that fits my budget';
  return <div className="overflow-hidden">
    <section className="relative mx-auto grid w-full min-w-0 grid-cols-1 items-center gap-12 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-16 lg:py-20">
      <div className="pointer-events-none absolute -left-36 top-12 h-80 w-80 rounded-full bg-indigo-200/35 blur-[90px] dark:bg-indigo-700/15" />
      <div className="relative min-w-0">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm dark:border-indigo-400/20 dark:bg-indigo-400/5 dark:text-indigo-300"><Sparkles size={13} /> A more considered way to shop</div>
        <h1 className="max-w-2xl break-words text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[3.65rem]">Shopping,<br className="sm:hidden" /> <span className="text-indigo-600 dark:text-indigo-400">Reimagined</span> by AI.</h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">Tell your shopping agent what matters. It finds products, weighs the trade-offs, and keeps your budget in view—while you make every final call.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={`/assistant?prompt=${encodeURIComponent(prompt)}`} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 transition hover:-translate-y-0.5 hover:bg-indigo-500">Try AI Shopping <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></Link>
          <Link to="/discover" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900">Explore products <ChevronRight size={16} /></Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> Your budget stays in focus</span><span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> You approve every payment</span></div>
      </div>

      <div className="relative mx-auto min-w-0 w-full max-w-[540px] lg:ml-auto">
        <div className="absolute -right-4 -top-5 h-32 w-32 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-500/10" />
        <div className="relative overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.32)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"><Bot size={17} /></span><div><p className="text-sm font-semibold">Your shopping agent</p><p className="text-[11px] text-slate-500">Ready to find your fit</p></div></div><span className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400"><span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-amber-400' : 'bg-emerald-500'}`} /> {loading ? 'Connecting catalogue' : catalogSource.startsWith('mock') ? 'Demo catalogue' : products.length ? 'Catalogue connected' : 'Catalogue preview'}</span></div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">I need a laptop for work. Good battery and under my budget, please.</div>
            <div className="flex gap-3"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"><Sparkles size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm leading-6 text-slate-700 dark:text-slate-200">I’ll compare the options against what matters to you and keep the total in range.</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Battery life</span><span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Your budget</span><span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Best value</span></div></div></div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">A few good places to start</p><p className="mt-0.5 text-[10px] text-slate-500">{catalogSource.startsWith('mock') ? 'Demo catalogue' : 'From the product catalogue'}</p></div><Link to="/discover" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">See all</Link></div>
            {loading ? <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((n) => <div key={n} className="aspect-[4/3] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}</div> : products.length ? <div className="grid min-w-0 grid-cols-3 gap-2.5">{products.slice(0, 3).map((p) => <Link key={p.id} to={`/products/${encodeURIComponent(p.id)}`} className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500"><div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">{p.image && !imageFailures.includes(p.id) ? <img src={p.image} alt={p.title} className="h-full w-full object-cover" loading="lazy" onError={() => setImageFailures((current) => [...current, p.id])} /> : <div className="grid h-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-medium text-slate-400 dark:from-slate-800 dark:to-slate-900">Product image</div>}</div><div className="p-2.5"><p className="line-clamp-2 min-h-8 text-[10px] leading-4 text-slate-600 dark:text-slate-300">{p.title}</p><p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">₹{p.price.toLocaleString('en-IN')}</p></div></Link>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700">Explore products and let your agent build a shortlist.</div>}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-[10px] text-slate-500 dark:border-slate-800"><span className="inline-flex items-center gap-1.5"><Fingerprint size={13} /> Private, personal recommendations</span><Link to={`/assistant?prompt=${encodeURIComponent(prompt)}`} className="font-semibold text-indigo-600 dark:text-indigo-400">Try it <ArrowDownRight size={12} className="inline" /></Link></div>
        </div>
      </div>
    </section>

    <section className="border-y border-slate-200/80 bg-white/70 py-5 dark:border-slate-800 dark:bg-slate-900/40"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-xs font-medium text-slate-500 sm:px-6 lg:justify-between lg:px-8"><span className="uppercase tracking-[0.14em] text-slate-400">One agent, every step</span><span className="inline-flex items-center gap-2"><Sparkles size={14} className="text-indigo-600" /> Understands what you mean</span><span className="inline-flex items-center gap-2"><GitCompareArrows size={14} className="text-indigo-600" /> Explains the trade-offs</span><span className="inline-flex items-center gap-2"><CircleDollarSign size={14} className="text-indigo-600" /> Keeps your budget close</span></div></section>

    <section className="py-16 sm:py-20"><div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">A better way to buy</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">From first thought to final choice.</h2></div><p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">A little help at each step, with the decision always in your hands.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{[
        { n: '01', icon: Bot, title: 'Say what you need', body: 'Describe the job, the budget, or the small details that matter to you.' },
        { n: '02', icon: GitCompareArrows, title: 'See the real trade-offs', body: 'Compare products side by side and get a plain-language recommendation.' },
        { n: '03', icon: WalletCards, title: 'Choose with confidence', body: 'Review your cart and approve payment through the PayPal Sandbox flow.' },
      ].map(({ n, icon: Icon, title, body }) => <article key={n} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-[0_14px_35px_-24px_rgba(30,41,59,.25)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400/30"><div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-widest text-slate-400">{n}</span><Icon size={18} className="text-indigo-600 dark:text-indigo-400" /></div><h3 className="mt-8 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{body}</p></article>)}</div>
    </section>

    <section className="mb-4 rounded-3xl bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-10 dark:bg-[#141c2d]"><div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Thoughtful by design</p><h2 className="mt-3 max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">Helpful intelligence. Human approval.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Your agent can research and recommend. Orders are created and captured on the server, and you approve payment with PayPal Sandbox before anything completes.</p><Link to="/assistant" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50">Meet your agent <ArrowRight size={15} /></Link></div><div className="grid grid-cols-2 gap-3">{[{ icon: CircleDollarSign, label: 'Budget-aware recommendations' }, { icon: Fingerprint, label: 'Private account experience' }, { icon: CreditCard, label: 'PayPal Sandbox approval' }, { icon: Check, label: 'You stay in control' }].map(({ icon: Icon, label }) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><Icon size={17} className="text-indigo-300" /><p className="mt-3 text-xs leading-5 text-slate-200">{label}</p></div>)}</div></div></section>
  </div>;
}
