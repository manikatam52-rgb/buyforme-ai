import { Request, Response, NextFunction } from 'express';
import * as paypal from '../services/paypalService';
import { getOrCreateCart, computeTotals } from '../services/cartService';
import { Transaction } from '../models/Transaction';
import { HttpError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { log, redact } from '../utils/logger';
import { notifyPaymentCaptured } from '../services/zapierService';

// Express 4 does not catch async throws — wrap every handler
const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/** POST /api/orders/create — server-side PayPal order creation from the user's cart */
export const createOrder = wrap(async (req, res) => {
  if (!paypal.isConfigured()) {
    throw new HttpError(503, 'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }
  const userId = (req as any).userId as string;
  const cart = await getOrCreateCart(userId);
  if (cart.items.length === 0) throw new HttpError(400, 'Cart is empty');

  // Validate items and recompute the amount SERVER-SIDE. Never trust client totals.
  for (const i of cart.items) {
    if (!i.title || !(i.unitPrice >= 0) || !(i.quantity >= 1)) {
      throw new HttpError(400, `Invalid cart item: ${i.productId}`);
    }
  }
  const totals = computeTotals(cart.items);
  // For the demo we bill the numeric total in the configured PayPal currency.
  const order = await paypal.createOrder({
    items: cart.items.map((i) => ({
      title: i.title,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
    total: totals.total.toFixed(2),
    tax: totals.tax.toFixed(2),
    shipping: totals.shipping.toFixed(2),
    userId,
  });

  await Transaction.create({
    userId,
    paypalOrderId: order.id,
    amount: totals.total,
    currency: env.paypal.currency,
    status: 'CREATED',
    environment: env.paypal.mode,
    items: cart.items.map((i) => ({ productId: i.productId, title: i.title, quantity: i.quantity, unitPrice: i.unitPrice })),
  });

  res.status(201).json({ orderId: order.id, totals, status: order.status });
});

/** POST /api/orders/:id/capture — server-side capture; verifies, dedupes, records */
export const captureOrder = wrap(async (req, res) => {
  const orderId = req.params.id;
  const userId = (req as any).userId as string;

  const txn = await Transaction.findOne({ paypalOrderId: orderId, userId });
  if (!txn) throw new HttpError(404, 'Order not found for this user');
  if (txn.status === 'COMPLETED') {
    // Idempotent: return the existing completed record, never capture twice
    return void res.json({ status: 'COMPLETED', alreadyCaptured: true, transaction: txn });
  }

  const verify = await paypal.verifyOrder(orderId, userId, txn.amount.toFixed(2));
  if (!verify.ok) {
    txn.status = 'FAILED';
    await txn.save();
    log.error('[capture] verification failed:', verify.reason);
    throw new HttpError(402, verify.reason || 'Order could not be verified');
  }

  try {
    const capture = await paypal.captureOrder(orderId);
    const captureId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? undefined;
    const payerEmail = capture?.payer?.email_address ?? undefined;

    txn.status = 'COMPLETED';
    txn.captureId = captureId;
    txn.payerEmail = payerEmail;
    txn.rawCapture = redact(capture) as Record<string, unknown>;
    await txn.save();

    // Post-payment automation (Zapier) — strictly after verified capture + persistence.
    // Awaited so the demo shows the hook firing before the UI navigates away.
    await notifyPaymentCaptured({
      event: 'payment.captured',
      paypalOrderId: orderId,
      captureId,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      environment: txn.environment,
      items: txn.items.map((i) => ({ productId: i.productId, title: i.title, quantity: i.quantity, unitPrice: i.unitPrice })),
      payerEmail,
      occurredAt: new Date().toISOString(),
    });

    res.json({ status: 'COMPLETED', transaction: txn });
  } catch (e: any) {
    txn.status = 'FAILED';
    await txn.save();
    log.error('[capture] PayPal error:', e.message);
    throw new HttpError(502, 'Payment capture failed');
  }
});

/** GET /api/orders/:id — status lookup */
export const getOrderStatus = wrap(async (req, res) => {
  const txn = await Transaction.findOne({
    paypalOrderId: req.params.id,
    userId: (req as any).userId,
  });
  if (!txn) throw new HttpError(404, 'Not found');
  res.json(txn);
});

/** GET /api/transactions — history */
export const listTransactions = wrap(async (req, res) => {
  const txns = await Transaction.find({ userId: (req as any).userId })
    .sort({ createdAt: -1 })
    .limit(50);
  const completed = txns.filter((t) => t.status === 'COMPLETED');
  res.json({
    transactions: txns,
    totalSpent: completed.reduce((s, t) => s + t.amount, 0),
    currency: env.paypal.currency,
  });
});
