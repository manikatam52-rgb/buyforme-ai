import { env } from '../config/env';
import { log } from '../utils/logger';

/**
 * Zapier integration — post-payment automation webhook.
 *
 * Fires ONLY after a PayPal capture has been verified server-side and the
 * transaction has been persisted (paypalController.captureOrder). The user
 * pastes a "Catch Hook" URL from a Webhooks-by-Zapier trigger into
 * ZAPIER_WEBHOOK_URL; we POST the verified payment payload to it.
 *
 * No Zapier credentials are required — the hook URL itself is the secret.
 * Failures are logged but never block the user's checkout response.
 */

export function zapierConfigured(): boolean {
  return Boolean(env.zapier.webhookUrl);
}

export interface PaymentEvent {
  event: 'payment.captured';
  paypalOrderId: string;
  captureId?: string;
  amount: number;
  currency: string;
  status: string;
  environment: string;
  items: Array<{ productId: string; title: string; quantity: number; unitPrice: number }>;
  payerEmail?: string;
  occurredAt: string;
}

export async function notifyPaymentCaptured(event: PaymentEvent): Promise<boolean> {
  if (!zapierConfigured()) return false;
  try {
    const res = await fetch(env.zapier.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`Zapier hook responded ${res.status}`);
    log.info('[zapier] payment event delivered:', event.paypalOrderId);
    return true;
  } catch (e: any) {
    // Never fail checkout because of an automation hook outage
    log.error('[zapier] delivery failed (checkout unaffected):', e.message);
    return false;
  }
}
