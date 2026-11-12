import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

/** All backend paths live here so the frontend and backend contract stay easy to align. */
export const API_ENDPOINTS = {
  auth: { register: '/auth/register', login: '/auth/login', me: '/auth/me', preferences: '/auth/preferences' },
  ai: { chat: '/ai/chat', compare: '/ai/compare', budgetReview: '/ai/budget-review' },
  products: { list: '/products', detail: (id: string) => `/products/${encodeURIComponent(id)}` },
  cart: { root: '/cart', items: '/cart/items', item: (id: string) => `/cart/items/${encodeURIComponent(id)}` },
  orders: { create: '/orders/create', capture: (id: string) => `/orders/${encodeURIComponent(id)}/capture`, status: (id: string) => `/orders/${encodeURIComponent(id)}` },
  paypal: { config: '/paypal/config' },
  transactions: '/transactions',
} as const;

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

let token: string | null = localStorage.getItem('bfm_token');
client.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem('bfm_token', value);
  else localStorage.removeItem('bfm_token');
}
export const getToken = () => token;

function getMessage(error: unknown) {
  const e = error as AxiosError<{ error?: string; message?: string }>;
  return e.response?.data?.error || e.response?.data?.message || e.message || 'Request failed';
}

export const api = {
  get: async <T>(path: string, config?: AxiosRequestConfig) => (await client.get<T>(path, config)).data,
  post: async <T>(path: string, data?: unknown, config?: AxiosRequestConfig) => (await client.post<T>(path, data ?? {}, config)).data,
  patch: async <T>(path: string, data?: unknown, config?: AxiosRequestConfig) => (await client.patch<T>(path, data ?? {}, config)).data,
  del: async <T>(path: string, config?: AxiosRequestConfig) => (await client.delete<T>(path, config)).data,
};

export function errorMessage(error: unknown) { return getMessage(error); }

export interface Product {
  id: string; title: string; brand: string; category: string; price: number; currency: string;
  rating?: number; reviews?: number; merchant: string; image?: string; specs: Record<string, string>;
  highlights: string[]; source: string; description?: string;
}
export interface CartTotals { subtotal: number; taxRate: number; tax: number; shipping: number; total: number; currency: string }
export interface ChatResponse {
  reply: string;
  intent: { keywords: string[]; maxPrice?: number; category?: string; requirements?: string[]; clarifyingQuestion?: string };
  products: Product[];
  comparison?: { bestOverall: string; bestBudget?: string; bestPerformance?: string; bestValue?: string; tradeoffs?: string; summary: string } | null;
  catalogSource: string;
}
export interface Transaction {
  _id: string; paypalOrderId: string; captureId?: string; amount: number; currency: string; status: string;
  environment: string; items: { productId: string; title: string; quantity: number; unitPrice: number }[]; createdAt: string;
}
