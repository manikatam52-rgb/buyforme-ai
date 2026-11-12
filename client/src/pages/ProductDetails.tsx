import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, ShoppingBag, Star } from 'lucide-react';
import { api, API_ENDPOINTS, errorMessage, type Product } from '@/lib/api';
import { useCart } from '@/hooks/useCart';

export default function ProductDetails() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- fetch lifecycle state, not render sync
    setLoading(true);
    setError('');
    api.get<Product>(API_ENDPOINTS.products.detail(id))
      .then((result) => { if (alive) setProduct(result); })
      .catch((reason) => { if (alive) setError(errorMessage(reason)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const addItem = async () => {
    if (!product || adding) return;
    setAdding(true); setActionError('');
    try {
      await add({ productId: product.id, title: product.title, merchant: product.merchant, unitPrice: product.price, image: product.image });
      setAdded(true);
    } catch (reason) { setActionError(errorMessage(reason)); }
    finally { setAdding(false); }
  };

  if (loading) return <div className="grid min-h-80 place-items-center text-slate-500"><Loader2 className="animate-spin" /></div>;
  if (error || !product) return <div className="mx-auto max-w-xl py-16 text-center"><p className="text-rose-600">{error || 'Product not found.'}</p><Link to="/discover" className="mt-5 inline-flex items-center gap-2 text-indigo-600"><ArrowLeft size={16} /> Back to discovery</Link></div>;

  return <div className="mx-auto max-w-5xl">
    <Link to="/discover" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"><ArrowLeft size={16} /> Product discovery</Link>
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
        {product.image ? <img src={product.image} alt={product.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400">Image unavailable</div>}
      </div>
      <div className="flex flex-col py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">{product.brand} · {product.category}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{product.title}</h1>
        <p className="mt-3 text-sm text-slate-500">Sold by {product.merchant}</p>
        {product.rating && <p className="mt-3 inline-flex items-center gap-1 text-sm text-amber-600"><Star size={15} fill="currentColor" /> {product.rating}{product.reviews ? ` · ${product.reviews.toLocaleString()} reviews` : ''}</p>}
        <p className="mt-6 text-3xl font-bold">{product.currency === 'INR' || !product.currency ? '₹' : `${product.currency} `}{product.price.toLocaleString('en-IN')}</p>
        {product.description && <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">{product.description}</p>}
        {product.highlights?.length > 0 && <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">{product.highlights.map((point) => <li key={point} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{point}</li>)}</ul>}
        {product.specs && <dl className="mt-6 grid grid-cols-2 gap-3">{Object.entries(product.specs).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-100 p-3 dark:bg-slate-900"><dt className="text-xs text-slate-500">{key}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl>}
        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <button onClick={() => void addItem()} disabled={adding} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">{adding ? <Loader2 size={17} className="animate-spin" /> : <ShoppingBag size={17} />} {adding ? 'Adding…' : added ? 'Add another' : 'Add to cart'}</button>
          {added && <button onClick={() => navigate('/cart')} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold dark:border-slate-700">View cart</button>}
        </div>
        {actionError && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{actionError}</p>}
        <p className="mt-4 text-xs text-slate-500">Product data: {product.source || 'catalogue'} · Availability and final totals are confirmed at checkout.</p>
      </div>
    </div>
  </div>;
}
