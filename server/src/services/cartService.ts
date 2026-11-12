import { Cart, ICartItem } from '../models/Cart';
import { env } from '../config/env';

export interface CartTotals {
  subtotal: number;
  taxRate: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

const TAX_RATE = 0.08; // Simulated GST-style rate, surfaced to the user
const FREE_SHIPPING_THRESHOLD = 4999;
const SHIPPING_FEE = 149;

export async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ userId } as any);
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

export function computeTotals(items: ICartItem[]): CartTotals {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;
  // Label totals in the currency PayPal will actually bill (single-currency demo).
  return { subtotal, taxRate: TAX_RATE, tax, shipping, total, currency: env.paypal.currency };
}

export async function addToCart(userId: string, item: ICartItem) {
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.items.push(item);
  }
  await cart.save();
  return cart;
}

export async function removeFromCart(userId: string, productId: string) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => i.productId !== productId);
  await cart.save();
  return cart;
}

export async function updateQuantity(userId: string, productId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return cart;
  item.quantity = Math.max(1, Math.min(10, quantity));
  await cart.save();
  return cart;
}
