import checkoutSdk from '@paypal/checkout-server-sdk';
import { env } from '../config/env';
import { log } from '../utils/logger';

/**
 * Official PayPal Checkout Server SDK wrapper.
 * All calls happen server-side; the client secret never leaves this process.
 */

function client(): checkoutSdk.core.PayPalHttpClient {
  const environment =
    env.paypal.mode === 'live'
      ? new checkoutSdk.core.LiveEnvironment(env.paypal.clientId, env.paypal.clientSecret)
      : new checkoutSdk.core.SandboxEnvironment(env.paypal.clientId, env.paypal.clientSecret);
  return new checkoutSdk.core.PayPalHttpClient(environment);
}

export interface PayPalOrderItem {
  title: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderInput {
  items: PayPalOrderItem[];
  total: string;
  currency?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const currency = input.currency || env.paypal.currency;

  const request = new checkoutSdk.orders.OrdersCreateRequest();
  request.prefer('return=minimal_representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: { currency_code: currency, value: input.total },
        items: input.items.map((i) => ({
          name: i.title.slice(0, 127),
          unit_amount: {
            currency_code: currency,
            value: i.unitPrice.toFixed(2),
          },
          quantity: String(i.quantity),
        })),
        description: 'BuyForMe AI cart (sandbox simulation)',
      },
    ],
  });

  const response = await client().execute(request);
  return response.result; // order object with id, status, links
}

export async function captureOrder(orderId: string) {
  const request = new checkoutSdk.orders.OrdersCaptureRequest(orderId);
  // Idempotency so a network retry cannot double-capture.
  request.headers['PayPal-Request-Id'] = `capture-${orderId}`;
  const response = await client().execute(request);
  return response.result;
}

export async function getOrder(orderId: string) {
  const request = new checkoutSdk.orders.OrdersGetRequest(orderId);
  const response = await client().execute(request);
  return response.result;
}

/** Sanity-check an order server-side before capture. */
export async function verifyOrder(
  orderId: string,
  expectedUserIdCheck: string,
  expectedAmount: string
): Promise<{ ok: boolean; reason?: string; order?: any }> {
  try {
    const order = await getOrder(orderId);
    if (order.status !== 'APPROVED') {
      return { ok: false, reason: `Order status is ${order.status}, not APPROVED`, order };
    }
    const amt = order.purchase_units?.[0]?.amount?.value;
    if (amt !== expectedAmount) {
      return { ok: false, reason: `Amount mismatch: expected ${expectedAmount}, got ${amt}`, order };
    }
    // Custom field carries our user id set at creation time
    const custom = order.purchase_units?.[0]?.custom_id;
    if (custom && custom !== expectedUserIdCheck) {
      return { ok: false, reason: 'Order does not belong to this user', order };
    }
    return { ok: true, order };
  } catch (e: any) {
    log.error('verifyOrder failed:', e.message);
    return { ok: false, reason: 'Failed to fetch order from PayPal' };
  }
}

export function isConfigured(): boolean {
  return Boolean(env.paypal.clientId && env.paypal.clientSecret);
}
