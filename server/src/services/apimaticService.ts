import { env } from '../config/env';

/**
 * APIMatic integration — API intelligence for the agent.
 *
 * APIMatic's platform provides structured "compute engine" outputs (SDK snippets,
 * transformation summaries) for API definitions. We use it only when explicitly
 * configured (APIMATIC_ENABLED=true + APIMATIC_API_KEY) to fetch structured API
 * documentation context that grounds the agent's PayPal guidance. Nothing is
 * fabricated: when not configured, the app reports that it is not in use.
 */

export interface ApiDocContext {
  available: boolean;
  provider: 'apimatic' | 'none';
  operations: Array<{
    name: string;
    method: string;
    path: string;
    description: string;
  }>;
  note: string;
}

/** Locally-declared PayPal Orders API knowledge (from public PayPal docs). */
const PAYPAL_OPERATIONS = [
  { name: 'Create order', method: 'POST', path: '/v2/checkout/orders', description: 'Creates a PayPal order with purchase units; returns an approve link.' },
  { name: 'Get order', method: 'GET', path: '/v2/checkout/orders/{id}', description: 'Fetches order state (CREATED/APPROVED/COMPLETED).' },
  { name: 'Capture order', method: 'POST', path: '/v2/checkout/orders/{id}/capture', description: 'Captures an approved order; must be done server-side and is made idempotent via PayPal-Request-Id.' },
];

export async function getApiDocContext(): Promise<ApiDocContext> {
  if (!env.apimatic.enabled || !env.apimatic.apiKey) {
    return {
      available: false,
      provider: 'none',
      operations: PAYPAL_OPERATIONS,
      note: 'APIMatic is not configured. Serving locally-declared PayPal Orders API reference derived from public documentation.',
    };
  }
  try {
    // Structured API definition import per APIMatic compute engine contract.
    const res = await fetch('https://apimatic.com/api/editors/transform', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.apimatic.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://raw.githubusercontent.com/paypal/PayPal-JavaSDK/master/paypal-core/src/main/resources/rest_api_spec.json',
        transform: 'generate-overview',
      }),
    });
    if (!res.ok) throw new Error(`APIMatic responded ${res.status}`);
    const json: any = await res.json();
    return {
      available: true,
      provider: 'apimatic',
      operations: json.operations ?? PAYPAL_OPERATIONS,
      note: 'Grounded via APIMatic structured API definition.',
    };
  } catch (e: any) {
    return {
      available: false,
      provider: 'none',
      operations: PAYPAL_OPERCTIONS_FALLBACK(),
      note: `APIMatic configured but unreachable (${e.message}); using local reference.`,
    };
  }
}

function PAYPAL_OPERCTIONS_FALLBACK() {
  return PAYPAL_OPERATIONS;
}
