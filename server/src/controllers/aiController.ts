import { Request, Response } from 'express';
import { extractIntent, compareProducts, reviewBudget } from '../services/geminiAgent';
import { searchProducts } from '../services/productDiscovery';
import { getApiDocContext } from '../services/apimaticService';
import { HttpError, asyncWrap } from '../middleware/errorHandler';

export const assistantChat = asyncWrap(async (req: Request, res: Response) => {
  const { message, history } = req.body ?? {};
  if (!message || typeof message !== 'string') throw new HttpError(400, 'message is required');

  const intent = await extractIntent(message, Array.isArray(history) ? history : []);
  const { products, source } = await searchProducts({
    q: intent.keywords?.join(' '),
    category: intent.category,
    maxPrice: intent.maxPrice,
    minPrice: intent.minPrice,
    limit: 8,
  });

  let comparison = null;
  if (products.length >= 2) {
    comparison = await compareProducts(
      products.slice(0, 3),
      `budget: ${intent.maxPrice ?? 'open'}; requirements: ${(intent.requirements ?? []).join(', ')}`
    );
  }

  res.json({
    reply: intent.reply,
    intent,
    products,
    comparison,
    catalogSource: source,
  });
});

export const compareEndpoint = asyncWrap(async (req: Request, res: Response) => {
  const { productIds } = req.body ?? {};
  if (!Array.isArray(productIds) || productIds.length < 2) {
    throw new HttpError(400, 'Provide productIds array with at least 2 ids');
  }
  const { products, source } = await searchProducts({ limit: 100 });
  const selected = products.filter((p) => (productIds as string[]).includes(p.id));
  if (selected.length < 2) throw new HttpError(404, 'Could not find those products');
  const comparison = await compareProducts(selected);
  res.json({ products: selected, comparison, catalogSource: source });
});

export const budgetGuardian = asyncWrap(async (req: Request, res: Response) => {
  const { total, items, budget } = req.body ?? {};
  const t = Number(total);
  if (!Number.isFinite(t) || t <= 0) throw new HttpError(400, 'total must be a positive number');
  const { products } = await searchProducts({ limit: 100 });
  const cheaper = products.filter((p) => p.price < t).slice(0, 3);
  const review = await reviewBudget(JSON.stringify(items ?? []), t, budget ? Number(budget) : undefined, cheaper);
  res.json(review);
});

export const apiIntelligence = asyncWrap(async (_req: Request, res: Response) => {
  const ctx = await getApiDocContext();
  res.json(ctx);
});
