import { Request, Response } from 'express';
import {
  getOrCreateCart,
  computeTotals,
  addToCart,
  removeFromCart,
  updateQuantity,
} from '../services/cartService';
import { HttpError, asyncWrap } from '../middleware/errorHandler';

const clean = (body: any) => {
  if (!body?.productId || !body?.title || !(body.unitPrice >= 0)) {
    throw new HttpError(400, 'productId, title and non-negative unitPrice are required');
  }
  return {
    productId: String(body.productId),
    title: String(body.title).slice(0, 200),
    merchant: String(body.merchant ?? 'Unknown').slice(0, 100),
    unitPrice: Number(body.unitPrice),
    quantity: Math.max(1, Math.min(10, Number(body.quantity ?? 1))),
    image: body.image ? String(body.image) : undefined,
  };
};

export const getCart = asyncWrap(async (req, res) => {
  const cart = await getOrCreateCart((req as any).userId);
  res.json({ cart, totals: computeTotals(cart.items) });
});

export const addItem = asyncWrap(async (req, res) => {
  const cart = await addToCart((req as any).userId, clean(req.body));
  res.status(201).json({ cart, totals: computeTotals(cart.items) });
});

export const removeItem = asyncWrap(async (req, res) => {
  const cart = await removeFromCart((req as any).userId, req.params.productId);
  res.json({ cart, totals: computeTotals(cart.items) });
});

export const patchQuantity = asyncWrap(async (req, res) => {
  const q = Number(req.body?.quantity);
  if (!Number.isFinite(q)) throw new HttpError(400, 'quantity must be a number');
  const cart = await updateQuantity((req as any).userId, req.params.productId, q);
  res.json({ cart, totals: computeTotals(cart.items) });
});
