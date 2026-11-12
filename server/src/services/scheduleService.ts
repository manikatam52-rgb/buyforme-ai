import { env } from '../config/env';
import { Transaction } from '../models/Transaction';
import { HttpError } from '../middleware/errorHandler';

/**
 * Bryntum integration — delivery schedule feed for Bryntum Calendar / Scheduler.
 *
 * Bryntum components are frontend (Agent 2 renders them); the backend's job is
 * to emit event data in the exact shape Bryntum's `Calendar`/`Scheduler` stores
 * expect (https://bryntum.com/products/calendar/docs — `events` with
 * id/name/startDate/endDate/resourceId + extra event data carried in `meta`).
 *
 * GET /api/schedule/delivery returns completed PayPal captures projected as
 * "delivery window" events: sandbox-estimated 2–5 business days after capture.
 */

export interface BryntumEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  resourceId: string;
  eventColor?: string;
  meta: {
    paypalOrderId: string;
    captureId?: string;
    amount: number;
    currency: string;
    status: string;
    items: Array<{ title: string; quantity: number }>;
  };
}

/** Add business days (Mon–Fri) to a date. */
function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export async function getDeliverySchedule(userId: string): Promise<{
  events: BryntumEvent[];
  resources: Array<{ id: string; name: string }>;
  note: string;
}> {
  const txns = await Transaction.find({ userId, status: 'COMPLETED' })
    .sort({ updatedAt: -1 })
    .limit(50);
  if (txns.length === 0) {
    throw new HttpError(404, 'No completed payments yet — complete a sandbox checkout to build your delivery schedule.');
  }

  const events: BryntumEvent[] = txns.map((t: any, i: number) => {
    const capturedAt: Date = t.updatedAt ?? t.createdAt;
    const start = addBusinessDays(new Date(capturedAt), 2);
    const end = addBusinessDays(new Date(capturedAt), 5);
    return {
      id: `delivery-${t._id ?? i}`,
      name: `Delivery: ${(t.items[0]?.title ?? 'Order').slice(0, 60)}${t.items.length > 1 ? ` +${t.items.length - 1} more` : ''}`,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      resourceId: 'me',
      eventColor: t.environment === 'sandbox' ? 'orange' : 'green',
      meta: {
        paypalOrderId: t.paypalOrderId,
        captureId: t.captureId,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        items: t.items.map((it: { title: string; quantity: number }) => ({ title: it.title, quantity: it.quantity })),
      },
    };
  });

  return {
    events,
    resources: [{ id: 'me', name: 'My deliveries' }],
    note: `Bryntum Calendar/Scheduler feed — ${events.length} completed capture(s), ${env.paypal.mode} environment. Delivery windows are simulated (2–5 business days).`,
  };
}
