import { Request, Response } from 'express';
import { HttpError, asyncWrap } from '../middleware/errorHandler';
import * as elastic from '../services/elasticService';
import * as kernel from '../services/kernelService';
import * as schedule from '../services/scheduleService';
import { env } from '../config/env';

/** POST /api/search/elastic — hybrid (lexical + semantic) catalogue search */
export const elasticSearch = asyncWrap(async (req: Request, res: Response) => {
  if (!elastic.elasticConfigured()) {
    throw new HttpError(503, 'Elastic is not configured. Set ELASTIC_HOST (and optionally ELASTIC_API_KEY) to enable hybrid search.');
  }
  const { q, maxPrice, limit } = req.body ?? {};
  if (!q || typeof q !== 'string') throw new HttpError(400, 'q (query string) is required');
  const result = await elastic.hybridSearch(q, {
    maxPrice: Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : undefined,
    limit: Number.isFinite(Number(limit)) ? Number(limit) : undefined,
  });
  res.json({ ...result, provider: 'elastic' });
});

/** POST /api/search/elastic/index — (re)index the current catalogue */
export const elasticIndex = asyncWrap(async (_req: Request, res: Response) => {
  if (!elastic.elasticConfigured()) {
    throw new HttpError(503, 'Elastic is not configured. Set ELASTIC_HOST to enable indexing.');
  }
  const result = await elastic.indexCatalogue();
  res.json({ ok: true, ...result });
});

/** POST /api/research/url — read-only product-page research (Kernel, optional) */
export const researchUrl = asyncWrap(async (req: Request, res: Response) => {
  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string') throw new HttpError(400, 'url is required');
  try {
    const result = await kernel.researchProductPage(url);
    res.json({ ...result, kernelConfigured: kernel.kernelConfigured() });
  } catch (e: any) {
    // Guardrail refusals and invalid URLs are client errors, not server faults
    throw new HttpError(400, e.message || 'Could not research URL');
  }
});

/** GET /api/schedule/delivery — Bryntum Calendar/Scheduler event feed */
export const deliverySchedule = asyncWrap(async (req: Request, res: Response) => {
  const feed = await schedule.getDeliverySchedule((req as any).userId);
  res.json(feed);
});

/** GET /api/integrations — honest status of every optional integration */
export const integrationsStatus = asyncWrap(async (_req: Request, res: Response) => {
  res.json({
    channel3: { configured: Boolean(env.products.channel3Key), active: env.products.source === 'channel3' },
    apimatic: { configured: env.apimatic.enabled && Boolean(env.apimatic.apiKey), active: env.apimatic.enabled },
    zapier: { configured: Boolean(env.zapier.webhookUrl), firesOn: 'verified capture only' },
    elastic: { configured: elastic.elasticConfigured(), features: ['lexical search', 'semantic kNN re-ranking (with Gemini embeddings)'] },
    kernel: { configured: kernel.kernelConfigured(), scope: 'read-only product-page research; payments and auth flows are refused by URL guardrails' },
    bryntum: { configured: true, scope: 'delivery-schedule event feed at GET /api/schedule/delivery (frontend renders with a Bryntum component)' },
    astropods: {
      configured: false,
      note: 'Astropods hosts complete agents as deployments (declarative spec + CLI), not components embeddable in this Express app. Our agent already runs in-process; hosting it externally would split the PayPal-critical path across platforms. Documented as an alternative deployment target, not integrated.',
    },
  });
});
