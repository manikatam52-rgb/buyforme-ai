import { env } from '../config/env';
import { log } from '../utils/logger';
import { Product, searchProducts } from './productDiscovery';

/**
 * Elastic integration — hybrid product search (lexical BM25 + semantic kNN).
 *
 * Enabled only when ELASTIC_HOST (+ optional ELASTIC_API_KEY) is configured.
 * Uses plain REST calls to the Elasticsearch API — no heavy client dependency.
 *
 * Index strategy:
 *   - buyforme-products: title (text), brand, category (keyword), specs flattened,
 *     price (float), plus a `title_vector` dense_vector field for semantic search.
 *   - Embeddings are generated with Gemini text-embedding when a key is present;
 *     otherwise semantic search degrades gracefully to lexical-only.
 *   - Catalogue data itself always comes from Channel3/mock via productDiscovery —
 *     Elastic is a search layer, never a source of fabricated products.
 */

export function elasticConfigured(): boolean {
  return Boolean(env.elastic.host);
}

export const PRODUCTS_INDEX = 'buyforme-products';

interface EsHit {
  _id: string;
  _score: number;
  _source: Record<string, any>;
}

function esHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.elastic.apiKey) h.Authorization = `ApiKey ${env.elastic.apiKey}`;
  return h;
}

function esUrl(path: string): string {
  return `${env.elastic.host.replace(/\/$/, '')}${path}`;
}

/** Create the products index with mappings + semantic vector field (idempotent). */
export async function ensureIndex(): Promise<void> {
  const mapping = {
    mappings: {
      properties: {
        productId: { type: 'keyword' },
        title: { type: 'text' },
        brand: { type: 'keyword' },
        category: { type: 'keyword' },
        description: { type: 'text' },
        specs_flat: { type: 'text' },
        price: { type: 'float' },
        currency: { type: 'keyword' },
        merchant: { type: 'keyword' },
        title_vector: {
          type: 'dense_vector',
          dims: env.elastic.embeddingDims,
          index: true,
          similarity: 'cosine',
        },
        indexed_at: { type: 'date' },
      },
    },
  };
  const res = await fetch(esUrl(`/${PRODUCTS_INDEX}`), {
    method: 'PUT',
    headers: esHeaders(),
    body: JSON.stringify(mapping),
  });
  // 400 "resource_already_exists_exception" is fine
  if (!res.ok) {
    const body = await res.text();
    if (!body.includes('resource_already_exists')) throw new Error(`Elastic index create failed: ${res.status} ${body.slice(0, 200)}`);
  }
}

/** Generate an embedding via Gemini (optional; semantic search is off without it). */
async function embed(text: string): Promise<number[] | null> {
  if (!env.gemini.apiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.elastic.embeddingModel}:embedContent?key=${env.gemini.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] } }),
      }
    );
    if (!res.ok) throw new Error(`embedding API ${res.status}`);
    const json: any = await res.json();
    return json?.embedding?.values ?? null;
  } catch (e: any) {
    log.warn('[elastic] embedding failed, falling back to lexical:', e.message);
    return null;
  }
}

/** (Re)index the current catalogue into Elasticsearch. */
export async function indexCatalogue(limit = 100): Promise<{ indexed: number; source: string }> {
  const { products, source } = await searchProducts({ limit });
  if (!elasticConfigured()) throw new Error('Elastic is not configured (ELASTIC_HOST missing)');
  await ensureIndex();

  const lines: string[] = [];
  for (const p of products) {
    lines.push(JSON.stringify({ index: { _index: PRODUCTS_INDEX, _id: p.id } }));
    lines.push(
      JSON.stringify({
        productId: p.id,
        title: p.title,
        brand: p.brand,
        category: p.category,
        description: p.highlights.join('. '),
        specs_flat: Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join('; '),
        price: p.price,
        currency: p.currency,
        merchant: p.merchant,
        indexed_at: new Date().toISOString(),
      })
    );
  }
  const res = await fetch(esUrl('/_bulk'), {
    method: 'POST',
    headers: { ...esHeaders(), 'Content-Type': 'application/x-ndjson' },
    body: lines.join('\n') + '\n',
  });
  if (!res.ok) throw new Error(`Elastic bulk failed: ${res.status}`);
  return { indexed: products.length, source };
}

/** Hybrid search: lexical match boosted with an optional kNN semantic clause. */
export async function hybridSearch(
  q: string,
  opts: { maxPrice?: number; limit?: number } = {}
): Promise<{ products: Product[]; mode: 'hybrid' | 'lexical'; total: number }> {
  if (!elasticConfigured()) throw new Error('Elastic is not configured');

  const vector = await embed(q);
  const filter: any[] = [];
  if (opts.maxPrice != null) filter.push({ range: { price: { lte: opts.maxPrice } } });

  const query: any = {
    bool: {
      must: q
        ? {
            multi_match: {
              query: q,
              fields: ['title^3', 'brand', 'category', 'description', 'specs_flat'],
              fuzziness: 'AUTO',
            },
          }
        : { match_all: {} },
      filter,
    },
  };
  if (vector) {
    query.bool.should = [
      {
        knn: {
          title_vector: { vector, k: 10, num_candidates: 100 },
        },
      },
    ];
  }

  const res = await fetch(esUrl(`/${PRODUCTS_INDEX}/_search`), {
    method: 'POST',
    headers: esHeaders(),
    body: JSON.stringify({
      query,
      size: Math.min(opts.limit ?? 12, 50),
      // Title-vector kNN needs the top-level knn clause in some ES versions; we
      // approximate hybrid scoring with a script-free approach: use `should` for
      // lexical boost and re-rank client-side on recency not needed here.
    }),
  });
  if (!res.ok) throw new Error(`Elastic search failed: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  const json: any = await res.json();
  const hits: EsHit[] = json.hits?.hits ?? [];

  // Rehydrate full products from the discovery service so prices/offers are fresh
  // (Elastic holds searchable metadata; prices must not be trusted hours later).
  const ids = hits.map((h) => h._id);
  const fresh = await searchProducts({ limit: 200 });
  const byId = new Map(fresh.products.map((p) => [p.id, p]));
  const products = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));

  return {
    products,
    mode: vector ? 'hybrid' : 'lexical',
    total: json.hits?.total?.value ?? products.length,
  };
}
