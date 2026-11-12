import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/hooks/useCart';
import Layout from '@/components/Layout';
const Landing = lazy(() => import('@/pages/Landing'));
const Auth = lazy(() => import('@/pages/Auth'));
const Assistant = lazy(() => import('@/pages/Assistant'));
const Discover = lazy(() => import('@/pages/Discover'));
const Compare = lazy(() => import('@/pages/Compare'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const ProductDetails = lazy(() => import('@/pages/ProductDetails'));

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="py-24 text-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('bfm_theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('bfm_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <Layout dark={dark} toggleDark={() => setDark((d) => !d)}>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<div className="mx-auto grid min-h-[55vh] max-w-4xl place-items-center text-sm text-slate-500"><span>Loading your shopping space…</span></div>}>
          <Routes>
            <Route element={<ThemeWrapper><Landing /></ThemeWrapper>} path="/" />
            <Route element={<ThemeWrapper><Auth /></ThemeWrapper>} path="/auth" />
            <Route element={<ThemeWrapper><Protected><Assistant /></Protected></ThemeWrapper>} path="/assistant" />
            <Route element={<ThemeWrapper><Protected><Discover /></Protected></ThemeWrapper>} path="/discover" />
            <Route element={<ThemeWrapper><Protected><ProductDetails /></Protected></ThemeWrapper>} path="/products/:id" />
            <Route element={<ThemeWrapper><Protected><Compare /></Protected></ThemeWrapper>} path="/compare" />
            <Route element={<ThemeWrapper><Protected><Cart /></Protected></ThemeWrapper>} path="/cart" />
            <Route element={<ThemeWrapper><Protected><Checkout /></Protected></ThemeWrapper>} path="/checkout" />
            <Route element={<ThemeWrapper><Protected><Confirmation /></Protected></ThemeWrapper>} path="/confirmation" />
            <Route element={<ThemeWrapper><Protected><Dashboard /></Protected></ThemeWrapper>} path="/dashboard" />
            <Route element={<ThemeWrapper><Protected><Transactions /></Protected></ThemeWrapper>} path="/transactions" />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
