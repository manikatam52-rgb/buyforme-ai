import { env } from '../config/env';
import { log } from '../utils/logger';

/**
 * Kernel integration — controlled cloud-browser research (onkernel.com).
 *
 * Kernel launches isolated cloud browsers via API. We use it STRICTLY for
 * read-only product information research (e.g. fetching a merchant page's
 * title/price metadata for a product the user is looking at).
 *
 * HARD RULE: the agent NEVER automates payment approval, never enters
 * credentials, and never interacts with a checkout flow. This service is
 * disabled unless KERNEL_API_KEY is set, and every session is destroyed
 * immediately after the read.
 */

export function kernelConfigured(): boolean {
  return Boolean(env.kernel.apiKey);
}

export interface ResearchResult {
  url: string;
  title: string;
  fetchedAt: string;
  method: 'kernel-browser' | 'plain-fetch';
  note: string;
}

const FORBIDDEN_URL_PATTERNS = [
  /paypal\./i,
  /checkout/i,
  /billing/i,
  /payment/i,
  /sign-?in/i,
  /login/i,
  /auth/i,
];

/** Guardrail: refuse any URL that could be part of a payment or auth flow. */
function assertSafeUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error('Only http(s) URLs are allowed');
  if (FORBIDDEN_URL_PATTERNS.some((re) => re.test(url.hostname) || re.test(url.pathname))) {
    throw new Error('Refusing to research payment/auth pages — product pages only');
  }
  return url;
}

/**
 * Research a product page. Uses Kernel's browser API when configured
 * (POST /browsers → CDP URL is not needed for a simple page render; we use
 * their session fetch flow), else falls back to a plain server-side fetch of
 * static metadata so the feature degrades gracefully.
 */
export async function researchProductPage(rawUrl: string): Promise<ResearchResult> {
  const url = assertSafeUrl(rawUrl);

  if (kernelConfigured()) {
    try {
      // Kernel API: create a session, evaluate a page fetch, destroy it.
      // Docs: https://docs.onkernel.com — REST over api.onkernel.com with x-api-key.
      const createRes = await fetch('https://api.onkernel.com/browsers', {
        method: 'POST',
        headers: { 'x-api-key': env.kernel.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ stealth: true }),
      });
      if (!createRes.ok) throw new Error(`Kernel create browser ${createRes.status}`);
      const browser: any = await createRes.json();
      const sessionId = browser.session_id ?? browser.id;

      try {
        const execRes = await fetch(`https://api.onkernel.com/browsers/${sessionId}/execute`, {
          method: 'POST',
          headers: { 'x-api-key': env.kernel.apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: `async (page) => { await page.goto(${JSON.stringify(url.href)}, { waitUntil: 'domcontentloaded', timeout: 20000 }); return await page.title(); }`,
          }),
        });
        const execJson: any = await execRes.json().catch(() => ({}));
        const title = execJson?.result ?? execJson?.output ?? '';
        return {
          url: url.href,
          title: String(title).slice(0, 300),
          fetchedAt: new Date().toISOString(),
          method: 'kernel-browser',
          note: 'Rendered in an isolated Kernel cloud browser (read-only; no payment interaction).',
        };
      } finally {
        // Always destroy the session — no lingering browsers
        fetch(`https://api.onkernel.com/browsers/${sessionId}`, {
          method: 'DELETE',
          headers: { 'x-api-key': env.kernel.apiKey },
        }).catch(() => undefined);
      }
    } catch (e: any) {
      log.warn('[kernel] research failed, using plain fetch fallback:', e.message);
    }
  }

  // Graceful fallback: static metadata fetch (no browser)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'BuyForMeAI-Research/1.0' } });
    const html = (await res.text()).slice(0, 200_000);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return {
      url: url.href,
      title: titleMatch?.[1]?.trim() ?? '',
      fetchedAt: new Date().toISOString(),
      method: 'plain-fetch',
      note: 'Kernel not configured; fetched static HTML metadata only.',
    };
  } catch (e: any) {
    throw new Error(`Could not research URL: ${e.message}`);
  }
}
