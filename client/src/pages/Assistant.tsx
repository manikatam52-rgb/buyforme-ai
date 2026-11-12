import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Bot, User as UserIcon, BadgeCheck, Loader2, Sparkles, Wallet, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import { api, API_ENDPOINTS, ChatResponse, Product, errorMessage } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import { useSavedProducts } from '@/hooks/useSavedProducts';

interface Msg { role: 'user' | 'ai'; text: string; data?: ChatResponse }
const SUGGESTIONS = ['A laptop for coding under ₹60,000', 'Noise-cancelling headphones for travel', 'Compare the best wireless earbuds'];

export default function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'ai', text: 'Hi! Tell me what you need and what matters most. I’ll search the catalogue, compare the trade-offs, and help you find a good fit.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const sentPrompt = useRef(false);
  const { add } = useCart();
  const saved = useSavedProducts();
  const { user } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: text.trim() }]);
    setInput(''); setBusy(true);
    try {
      const data = await api.post<ChatResponse>(API_ENDPOINTS.ai.chat, { message: text.trim(), history });
      setMessages((m) => [...m, { role: 'ai', text: data.reply, data }]);
    } catch (error) {
      setMessages((m) => [...m, { role: 'ai', text: `I couldn’t complete that search. ${errorMessage(error)} You can try again or browse the catalogue.` }]);
    } finally { setBusy(false); }
  };

  // Runs at most once: consume a ?prompt= deep-link handed over from another page.
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs only when the query string changes
  useEffect(() => {
    const initialPrompt = params.get('prompt');
    if (initialPrompt && !sentPrompt.current) {
      sentPrompt.current = true;
      setParams((current) => { current.delete('prompt'); return current; }, { replace: true });
      void send(initialPrompt);
    }
  }, [params]); // oxlint-disable-line react-hooks/exhaustive-deps -- runs at most once per ?prompt= deep-link
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2600); return () => window.clearTimeout(timer); }, [toast]);

  const addToCart = async (product: Product) => {
    try { await add({ productId: product.id, title: product.title, merchant: product.merchant, unitPrice: product.price, image: product.image }); setToast(`${product.title} added to cart`); }
    catch (error) { if ((error as { response?: { status?: number } }).response?.status === 401) nav('/auth'); else setToast(errorMessage(error)); }
  };

  return <div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Personal shopping</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.8rem]">Let’s find the right one.</h1><p className="mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">Tell your agent what you’re looking for. It will bring back products and explain why they fit.</p></div>
      <Link to="/discover" className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><Compass size={14} /> Browse catalogue</Link>
    </div>

    {user?.monthlyBudget != null && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 dark:border-indigo-400/15 dark:bg-indigo-400/[0.06]"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"><Wallet size={17} /></span><div><p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Budget-aware shopping</p><p className="mt-0.5 text-[11px] text-slate-500">Your monthly budget is ₹{user.monthlyBudget.toLocaleString('en-IN')}</p></div></div><Link to="/dashboard" className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Manage budget <ArrowRight size={12} className="ml-1 inline" /></Link></div>}

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
      <section aria-label="Shopping conversation" className="flex min-h-[65vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 dark:border-slate-800"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"><Bot size={17} /></span><div><p className="text-sm font-semibold">Shopping agent</p><p className="text-[11px] text-slate-500">Product research, made personal</p></div></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready</span></div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'ai' && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-400/15 dark:bg-indigo-400/10 dark:text-indigo-300"><Sparkles size={15} /></span>}
            <div className={`min-w-0 ${message.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[94%]'}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-slate-950 text-white dark:bg-indigo-600' : 'rounded-bl-md bg-slate-50 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200'}`}>{message.text}</div>
              {message.data?.products?.length ? <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">A shortlist for you</p><p className="mt-0.5 text-[10px] text-slate-500">{message.data.products.length} matches · {message.data.catalogSource.startsWith('mock') ? 'Demo catalogue' : 'Product catalogue'}</p></div><Link to="/compare" className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Compare products</Link></div>
                <div className="grid gap-3 sm:grid-cols-2">{message.data.products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} onDetails={() => nav(`/products/${encodeURIComponent(product.id)}`)} onSave={() => saved.toggle(product)} isSaved={saved.isSaved(product.id)} compact />)}</div>
                {message.data.comparison && <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-400/15 dark:bg-indigo-400/[0.06]"><p className="flex items-center gap-2 text-xs font-semibold text-indigo-800 dark:text-indigo-200"><BadgeCheck size={15} /> Why this shortlist</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{message.data.comparison.summary}</p><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><p><span className="font-semibold">Best overall</span><br /><span className="text-slate-600 dark:text-slate-400">{message.data.comparison.bestOverall}</span></p>{message.data.comparison.bestBudget && <p><span className="font-semibold">Best on budget</span><br /><span className="text-slate-600 dark:text-slate-400">{message.data.comparison.bestBudget}</span></p>}{message.data.comparison.tradeoffs && <p className="sm:col-span-2"><span className="font-semibold">Trade-off to consider</span><br /><span className="text-slate-600 dark:text-slate-400">{message.data.comparison.tradeoffs}</span></p>}</div></div>}
                {message.data.intent.clarifyingQuestion && <button onClick={() => void send(message.data!.intent.clarifyingQuestion!)} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Answer a quick question: “{message.data.intent.clarifyingQuestion}”</button>}
              </div> : null}
            </div>
            {message.role === 'user' && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><UserIcon size={15} /></span>}
          </div>)}
          {busy && <div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"><Sparkles size={15} /></span><div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/70"><Loader2 className="animate-spin" size={14} /> Looking across products and weighing the details…</div></div>}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-100 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
          {messages.length <= 1 && <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{SUGGESTIONS.map((suggestion) => <button key={suggestion} onClick={() => void send(suggestion)} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-[11px] text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500">{suggestion}</button>)}</div>}
          <form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:border-indigo-500">
            <label className="sr-only" htmlFor="shopping-prompt">Describe what you want to buy</label><textarea id="shopping-prompt" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }} rows={1} placeholder="Describe what you need…" className="max-h-28 min-h-10 flex-1 resize-y border-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-0" />
            <button disabled={busy || !input.trim()} aria-label="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button>
          </form>
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400"><ShieldCheck size={11} /> Your agent can recommend. You approve every purchase.</p>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Your agent handles</p><ol className="mt-4 space-y-4">{[['01', 'Understands your needs', 'Budget, category, and the little details.'], ['02', 'Searches the catalogue', 'Brings back relevant options to review.'], ['03', 'Explains the trade-offs', 'Highlights what makes each choice fit.']].map(([n, title, detail]) => <li key={n} className="flex gap-3"><span className="pt-0.5 text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400">{n}</span><div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p></div></li>)}</ol></div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/[0.06]"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><ShieldCheck size={15} /> You stay in control</p><p className="mt-2 text-xs leading-5 text-emerald-900/70 dark:text-emerald-200/70">Your agent never places an order on its own. PayPal Sandbox opens only when you choose to continue.</p></div>
      </aside>
    </div>
    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-medium text-white shadow-xl dark:bg-white dark:text-slate-950">{toast}</div>}
  </div>;
}
