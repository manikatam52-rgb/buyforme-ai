import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Bot, Check, CircleAlert, Loader2, ShieldCheck } from 'lucide-react';
import { errorMessage } from '@/lib/api';

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { if (mode === 'login') await login(form.email, form.password); else await register(form.name, form.email, form.password); navigate('/assistant'); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  };
  const input = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900';

  return <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,.28)] md:grid-cols-[0.88fr_1fr] dark:border-slate-800 dark:bg-slate-900">
    <section className="relative hidden overflow-hidden bg-slate-950 p-9 text-white md:flex md:flex-col md:justify-between lg:p-12"><div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-600/30 blur-[80px]" /><Link to="/" className="relative flex items-center gap-2 text-sm font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-950"><Bot size={18} /></span>BuyForMe AI</Link><div className="relative py-12"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300">Shop with a little more clarity</p><h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">The right choice starts with what matters to you.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Let your personal shopping agent search, compare, and keep your budget in view.</p><ul className="mt-8 space-y-3 text-xs text-slate-300">{['Recommendations shaped around your needs', 'Clear comparisons with plain-language trade-offs', 'You approve every PayPal Sandbox payment'].map((point) => <li key={point} className="flex items-center gap-2"><Check size={14} className="text-emerald-400" />{point}</li>)}</ul></div><p className="relative flex items-center gap-2 text-[11px] text-slate-400"><ShieldCheck size={14} /> Your agent recommends. You decide.</p></section>

    <section className="p-6 sm:p-9 lg:p-12"><Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 md:hidden"><Bot size={17} className="text-indigo-600" /> BuyForMe AI</Link><div className="max-w-sm"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">{mode === 'login' ? 'Welcome back' : 'Get started'}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Pick up where you left off and find your next great buy.' : 'A few details, then your shopping agent is ready.'}</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === 'register' && <div><label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full name</label><input id="name" autoComplete="name" className={input} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>}
        <div><label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email address</label><input id="email" autoComplete="email" className={input} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div><label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label><input id="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={input} type="password" placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} minLength={mode === 'register' ? 8 : undefined} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><p className="mt-1.5 text-[10px] text-slate-400">{mode === 'register' ? 'Use at least 8 characters.' : 'Your password is kept private.'}</p></div>
        {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/[0.07] dark:text-rose-200"><CircleAlert size={15} className="mt-0.5 shrink-0" />{error}</p>}
        <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">{busy ? <><Loader2 size={15} className="animate-spin" /> Please wait…</> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></>}</button>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800">{mode === 'login' ? 'New to BuyForMe AI? ' : 'Already have an account? '}<button type="button" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400"><ShieldCheck size={12} /> Your agent never buys without your approval.</p>
      </div></section>
  </div>;
}
