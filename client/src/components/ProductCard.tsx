import { useState } from 'react';
import { Star, ShoppingCart, Info, ArrowUpRight, Check, Heart } from 'lucide-react';
import { Product } from '@/lib/api';

export default function ProductCard({ product: p, onAdd, onDetails, compact, onCompare, isCompared, onSave, isSaved }: {
  product: Product;
  onAdd: () => void;
  onDetails?: () => void;
  compact?: boolean;
  onCompare?: () => void;
  isCompared?: boolean;
  onSave?: () => void;
  isSaved?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const specs = Object.entries(p.specs ?? {}).slice(0, compact ? 1 : 3);
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_36px_-24px_rgba(15,23,42,.28)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className={`${compact ? 'h-28' : 'h-48'} relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800`}>
        {p.image && !imageFailed ? <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" onError={() => setImageFailed(true)} /> : <div className="grid h-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"><Info className="text-slate-400" size={27} /></div>}
        {p.category && <span className="absolute left-3 top-3 rounded-md border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">{p.category}</span>}
        {onSave && <button type="button" onClick={onSave} aria-label={isSaved ? `Remove ${p.title} from saved products` : `Save ${p.title}`} aria-pressed={isSaved} className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300"><Heart size={15} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'text-rose-600' : ''} /></button>}
        {onCompare && <button type="button" onClick={onCompare} aria-pressed={isCompared} className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur ${isCompared ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-white/70 bg-white/90 text-slate-700 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200'}`}>{isCompared ? <Check size={11} /> : null}{isCompared ? 'Selected' : 'Compare'}</button>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">{p.title}</h3>
          {p.rating != null && <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Star size={11} fill="currentColor" /> {p.rating}</span>}
        </div>
        <p className="mt-1.5 truncate text-xs text-slate-500 dark:text-slate-400">{p.brand}{p.merchant ? ` · ${p.merchant}` : ''}</p>
        <div className="mt-3 flex items-baseline gap-2"><span className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{p.currency === 'INR' || !p.currency ? '₹' : `${p.currency} `}{p.price.toLocaleString('en-IN')}</span>{p.reviews != null && <span className="text-[10px] text-slate-400">{p.reviews.toLocaleString()} reviews</span>}</div>
        {!compact && specs.length > 0 && <dl className="mt-3 flex flex-wrap gap-1.5">{specs.map(([k, v]) => <div key={k} className="max-w-full rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"><dt className="sr-only">{k}</dt><dd className="truncate">{k}: {v}</dd></div>)}</dl>}
        {!compact && p.highlights?.length > 0 && <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{p.highlights.slice(0, 2).join(' · ')}</p>}
        <div className="mt-auto flex gap-2 pt-4">
          <button onClick={onAdd} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-indigo-500 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100"><ShoppingCart size={14} /> Add to cart</button>
          {onDetails && <button onClick={onDetails} aria-label={`Details for ${p.title}`} className="grid h-9 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowUpRight size={15} /></button>}
        </div>
      </div>
    </article>
  );
}
