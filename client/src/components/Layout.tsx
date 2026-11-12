import { NavLink, Link } from 'react-router-dom';
import { Bot, LayoutDashboard, Compass, GitCompareArrows, ShoppingCart, History, LogOut, Sun, Moon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/useCart';

export default function Layout({ dark, toggleDark, children }: { dark: boolean; toggleDark: () => void; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] text-slate-900 transition-colors dark:bg-[#0b1020] dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1020]/90">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-lg font-semibold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Bot size={19} strokeWidth={2.2} /></span>
            <span>BuyForMe<span className="text-indigo-600 dark:text-indigo-400"> AI</span></span>
          </Link>
          {user && <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            <NavLink to="/assistant" className={link}><Bot size={15} /> Assistant</NavLink>
            <NavLink to="/discover" className={link}><Compass size={15} /> Discover</NavLink>
            <NavLink to="/compare" className={link}><GitCompareArrows size={15} /> Compare</NavLink>
            <NavLink to="/cart" className={link}><ShoppingCart size={15} /> Cart{count > 0 && <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">{count}</span>}</NavLink>
            <NavLink to="/dashboard" className={link}><LayoutDashboard size={15} /> Dashboard</NavLink>
            <NavLink to="/transactions" className={link}><History size={15} /> History</NavLink>
          </nav>}
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={toggleDark} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Toggle theme">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {user ? <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">{user.name.slice(0, 1).toUpperCase()}</span><span className="hidden sm:inline">{user.name.split(' ')[0]}</span><LogOut size={14} /></button>
              : <Link to="/auth" className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100">Sign in</Link>}
          </div>
        </div>
        {user && <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto border-t border-slate-200/80 px-3 py-2 lg:hidden dark:border-slate-800">
          <NavLink to="/assistant" className={link}><Bot size={15} /> Assistant</NavLink><NavLink to="/discover" className={link}><Compass size={15} /> Discover</NavLink><NavLink to="/compare" className={link}><GitCompareArrows size={15} /> Compare</NavLink><NavLink to="/cart" className={link}><ShoppingCart size={15} /> Cart{count > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">{count}</span>}</NavLink><NavLink to="/dashboard" className={link}><LayoutDashboard size={15} /> Account</NavLink><NavLink to="/transactions" className={link}><History size={15} /> History</NavLink>
        </nav>}
      </header>
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">{children}</main>
      <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="font-semibold text-slate-700 dark:text-slate-300">BuyForMe AI</Link>
          <p>AI finds the fit. You stay in control.</p>
          <p className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> Payments are approved through PayPal Sandbox.</p>
        </div>
      </footer>
    </div>
  );
}
