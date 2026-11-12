import { Request, Response } from 'express';
import { searchProducts, getProduct } from '../services/productDiscovery';
import { HttpError, asyncWrap } from '../middleware/errorHandler';

export const search = asyncWrap(async (req: Request, res: Response) => {
  const { q, category, maxPrice, minPrice, limit } = req.query as Record<string, string>;
  const num = (v?: string) => (v != null && v !== '' ? Number(v) : undefined);
  const { products, source } = await searchProducts({
    q,
    category,
    maxPrice: num(maxPrice),
    minPrice: num(minPrice),
    limit: num(limit) ?? 24,
  });
  res.json({ products, catalogSource: source });
});

export const detail = asyncWrap(async (req: Request, res: Response) => {
  const product = await getProduct(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json(product);
});
