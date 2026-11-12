import { Router } from 'express';
import * as auth from '../controllers/authController';
import * as ai from '../controllers/aiController';
import * as products from '../controllers/productController';
import * as cart from '../controllers/cartController';
import * as orders from '../controllers/paypalController';
import * as integrations from '../controllers/integrationsController';
import { requireAuth } from '../middleware/auth';
import { env } from '../config/env';
import rateLimit from 'express-rate-limit';

const router = Router();

// Sensitive endpoints get basic rate limiting
const authLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true });
const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true });
const payLimiter = rateLimit({ windowMs: 60_000, max: 15, standardHeaders: true });

// Health + meta
router.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Public client config for the PayPal JS SDK (client id is public by design)
router.get('/paypal/config', (_req, res) =>
  res.json({
    clientId: env.paypal.clientId,
    mode: env.paypal.mode,
    currency: env.paypal.currency,
  })
);

// Auth
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', requireAuth, auth.me);
router.patch('/auth/preferences', requireAuth, auth.updatePreferences);

// AI agent
router.post('/ai/chat', requireAuth, aiLimiter, ai.assistantChat);
router.post('/ai/compare', requireAuth, aiLimiter, ai.compareEndpoint);
router.post('/ai/budget-review', requireAuth, aiLimiter, ai.budgetGuardian);
router.get('/ai/api-intelligence', requireAuth, ai.apiIntelligence);

// Products
router.get('/products', products.search);
router.get('/products/:id', products.detail);

// Optional sponsor integrations (each 503s honestly when not configured)
router.get('/integrations', requireAuth, integrations.integrationsStatus);
router.post('/search/elastic', requireAuth, aiLimiter, integrations.elasticSearch);
router.post('/search/elastic/index', requireAuth, integrations.elasticIndex);
router.post('/research/url', requireAuth, aiLimiter, integrations.researchUrl);
router.get('/schedule/delivery', requireAuth, integrations.deliverySchedule);

// Cart
router.get('/cart', requireAuth, cart.getCart);
router.post('/cart/items', requireAuth, cart.addItem);
router.delete('/cart/items/:productId', requireAuth, cart.removeItem);
router.patch('/cart/items/:productId', requireAuth, cart.patchQuantity);

// PayPal orders (all server-side)
router.post('/orders/create', requireAuth, payLimiter, orders.createOrder);
router.post('/orders/:id/capture', requireAuth, payLimiter, orders.captureOrder);
router.get('/orders/:id', requireAuth, orders.getOrderStatus);
router.get('/transactions', requireAuth, orders.listTransactions);

export default router;
