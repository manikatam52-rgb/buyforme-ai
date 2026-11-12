import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExternalLink, LockKeyhole, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api, API_ENDPOINTS } from '@/lib/api';
import { errorMessage } from '@/lib/api';
import { useCart } from '@/hooks/useCart';

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function Checkout() {
  const { items, totals, loading: cartLoading, error: cartError, clearAfterPurchase } = useCart();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paypalConfig, setPaypalConfig] = useState<{ clientId: string; mode: string; currency: string } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const buttonsRendered = useRef(false);

  // Load the PayPal JS SDK with the PUBLIC client id from our server (safe to expose)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await api.get<{ clientId: string; mode: string; currency: string }>(API_ENDPOINTS.paypal.config);
        if (cancelled) return;
        setPaypalConfig(config);
        if (!config.clientId) { setError('PayPal is not configured on the server (PAYPAL_CLIENT_ID missing).'); return; }
        if (!totals) return;
        if (config.currency.toUpperCase() !== totals.currency.toUpperCase()) {
          setError(`Checkout is unavailable: your cart is priced in ${totals.currency}, while PayPal is configured for ${config.currency}. The backend must align these currencies before payment.`);
          return;
        }
        if (window.paypal) { setSdkReady(true); return; }
        const s = document.createElement('script');
        s.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${config.currency}&intent=capture${config.mode === 'sandbox' ? '&components=buttons' : ''}`;
        s.onload = () => { if (!cancelled) setSdkReady(true); };
        s.onerror = () => setError('Failed to load PayPal SDK.');
        document.body.appendChild(s);
      } catch (e) { setError(errorMessage(e)); }
      finally { if (!cancelled) setConfigLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [totals]);

  // Render smart buttons once SDK + totals are available
  useEffect(() => {
    if (!sdkReady || !window.paypal || !totals || !paypalConfig || paypalConfig.currency.toUpperCase() !== totals.currency.toUpperCase() || buttonsRendered.current) return;
    buttonsRendered.current = true;
    window.paypal
      .Buttons({
        style: { layout: 'vertical', shape: 'pill', color: 'blue' },
        // 1) Server-side order creation from our cart (authoritative amounts)
        createOrder: async () => {
          const r = await api.post<{ orderId: string }>(API_ENDPOINTS.orders.create);
          return r.orderId;
        },
        // 2) Capture on OUR server after user approves in the popup — never trust the client
        onApprove: async (data: any) => {
          setProcessing(true); setError('');
          try {
            const r = await api.post<{ transaction: { status: string } }>(API_ENDPOINTS.orders.capture(data.orderID));
            if (r.transaction?.status !== 'COMPLETED') {
              nav('/confirmation', { state: { orderId: data.orderID, transaction: r.transaction, paymentError: 'PayPal did not confirm a completed capture.' } });
              return;
            }
            const cartCleared = await clearAfterPurchase();
            nav('/confirmation', { state: { orderId: data.orderID, transaction: r.transaction, cartCleanupWarning: !cartCleared } });
          } catch (e) {
            nav('/confirmation', { state: { orderId: data.orderID, paymentError: errorMessage(e) } });
          } finally { setProcessing(false); }
        },
        onError: (err: any) => nav('/confirmation', { state: { paymentError: err?.message ?? 'PayPal checkout encountered an error.' } }),
        onCancel: () => nav('/confirmation', { state: { paymentError: 'Payment was cancelled. You were not charged.' } }),
      })
      .render('#paypal-buttons');
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- buttons must render exactly once; capture/nav are stable runtime callbacks
  }, [sdkReady, totals]);

  if (cartLoading || configLoading) return <div role="status" className="mx-auto max-w-4xl animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Loading secure checkout…</div>;
  if (cartError) return <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">Could not load your cart: {cartError}<button onClick={() => location.reload()} className="ml-2 font-semibold underline">Retry</button></div>;
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
        <p className="text-lg font-semibold">Nothing to check out just yet</p><p className="mt-1 text-sm text-slate-500">Your cart is empty. Browse and add a product to get started.</p>
        <Link to="/discover" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/cart" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600"><ArrowLeft size={14} /> Back to cart</Link>
      <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">One last look</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Review and approve</h1><p className="mt-1.5 text-sm text-slate-500">Your payment is captured securely on the server only after you approve with PayPal.</p></div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_310px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-semibold">Order details</h2><ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{items.map((i) => <li key={i.productId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="line-clamp-1 text-xs font-semibold">{i.title}</p><p className="mt-1 text-[10px] text-slate-500">{i.quantity} × ₹{i.unitPrice.toLocaleString('en-IN')}</p></div><p className="text-xs font-semibold">₹{(i.unitPrice * i.quantity).toLocaleString('en-IN')}</p></li>)}</ul></section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-semibold">Payment summary</h2>{totals && <dl className="mt-4 space-y-2.5 text-xs"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>₹{totals.subtotal.toLocaleString('en-IN')}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd>₹{totals.tax.toLocaleString('en-IN')}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{totals.shipping === 0 ? 'Free' : `₹${totals.shipping.toLocaleString('en-IN')}`}</dd></div><div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold dark:border-slate-800"><dt>Total due</dt><dd>₹{totals.total.toLocaleString('en-IN')}</dd></div></dl>}
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-800 dark:bg-emerald-400/[0.07] dark:text-emerald-300"><p className="flex items-center gap-1.5 font-semibold"><CheckCircle2 size={13} /> PayPal {paypalConfig?.mode === 'sandbox' ? 'Sandbox' : 'Checkout'}</p><p className="mt-1">{paypalConfig?.mode === 'sandbox' ? 'A test transaction. No real money moves.' : 'You will review and approve the payment with PayPal before capture.'}</p></div>
          </div>
        </aside>
      </div>

      {error && <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole size={16} className="text-emerald-600" /> Approve securely with PayPal</p>
        <p className="mb-4 mt-1 text-xs text-slate-500">PayPal will show the payment details and ask you to confirm before capture.</p>
        {processing && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-xs font-medium text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-200"><Loader2 size={15} className="animate-spin" /> Capturing your approved payment securely…</div>}
        {!error && !sdkReady ? <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="animate-spin" size={14} /> Loading PayPal checkout…</p> : null}
        {!error && sdkReady && <div id="paypal-buttons" className={processing ? 'pointer-events-none opacity-50' : ''} />}
        <a href="https://developer.paypal.com/tools/sandbox/" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
          Need Sandbox test accounts? <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
