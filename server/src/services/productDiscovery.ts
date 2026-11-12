import { env } from '../config/env';

/**
 * Product discovery service.
 *
 * PRODUCT_SOURCE=mock      -> local mock catalogue, clearly labelled MOCK.
 * PRODUCT_SOURCE=channel3  -> real Channel3 API (requires CHANNEL3_API_KEY).
 *
 * The adapter interface keeps them swappable — no fabricated live data.
 */

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  rating?: number;
  reviews?: number;
  merchant: string;
  image?: string;
  specs: Record<string, string>;
  highlights: string[];
  source: 'mock' | 'channel3';
}

export interface SearchParams {
  q?: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  limit?: number;
}

/** Clearly-labelled mock catalogue (static test data, not live market prices). */
const MOCK_CATALOGUE: Product[] = [
  {
    id: 'mock-lenovo-ideapad-slim5',
    title: 'Lenovo IdeaPad Slim 5 14"',
    brand: 'Lenovo',
    category: 'laptop',
    price: 57999,
    currency: 'INR',
    rating: 4.4,
    reviews: 2140,
    merchant: 'MockStore India',
    image: '/img/products/laptop-lenovo.svg',
    specs: { CPU: 'Ryzen 5 7530U', RAM: '16 GB DDR4', Storage: '512 GB SSD', Display: '14" FHD IPS', Battery: '57 Wh', Weight: '1.46 kg' },
    highlights: ['16 GB RAM', 'Great keyboard for coding', 'Good battery life'],
    source: 'mock',
  },
  {
    id: 'mock-asus-vivobook-15',
    title: 'ASUS Vivobook 15 X1502',
    brand: 'ASUS',
    category: 'laptop',
    price: 54990,
    currency: 'INR',
    rating: 4.2,
    reviews: 1580,
    merchant: 'MockStore India',
    image: '/img/products/laptop-asus.svg',
    specs: { CPU: 'Core i5-1235U', RAM: '16 GB DDR4', Storage: '512 GB SSD', Display: '15.6" FHD', Battery: '50 Wh', Weight: '1.7 kg' },
    highlights: ['Largest display of the trio', 'Thunderbolt-class USB-C', 'Slightly heavier'],
    source: 'mock',
  },
  {
    id: 'mock-hp-pavilion-14',
    title: 'HP Pavilion 14',
    brand: 'HP',
    category: 'laptop',
    price: 62490,
    currency: 'INR',
    rating: 4.3,
    reviews: 990,
    merchant: 'MockStore India',
    image: '/img/products/laptop-hp.svg',
    specs: { CPU: 'Core i5-1240P', RAM: '16 GB LPDDR4x', Storage: '1 TB SSD', Display: '14" FHD IPS', Battery: '51 Wh', Weight: '1.41 kg' },
    highlights: ['Best sustained performance', '1 TB storage', 'Premium build'],
    source: 'mock',
  },
  {
    id: 'mock-acer-aspire-5',
    title: 'Acer Aspire 5 A515',
    brand: 'Acer',
    category: 'laptop',
    price: 47990,
    currency: 'INR',
    rating: 4.0,
    reviews: 3200,
    merchant: 'MockStore India',
    image: '/img/products/laptop-acer.svg',
    specs: { CPU: 'Ryzen 5 5500U', RAM: '8 GB DDR4', Storage: '512 GB SSD', Display: '15.6" FHD', Battery: '50 Wh', Weight: '1.8 kg' },
    highlights: ['Cheapest option', 'Upgradeable RAM', 'Only 8 GB RAM stock'],
    source: 'mock',
  },
  {
    id: 'mock-headphones-sony-wf',
    title: 'Sony WF-C700N Earbuds',
    brand: 'Sony',
    category: 'audio',
    price: 8990,
    currency: 'INR',
    rating: 4.5,
    reviews: 5400,
    merchant: 'MockStore India',
    image: '/img/products/audio-generic.svg',
    specs: { Type: 'TWS earbuds', ANC: 'Yes', Battery: '15 h with case', Bluetooth: '5.2' },
    highlights: ['Comfortable fit', 'Solid ANC for the price'],
    source: 'mock',
  },
  {
    id: 'mock-monitor-dell-24',
    title: 'Dell SE2422HX 24" Monitor',
    brand: 'Dell',
    category: 'monitor',
    price: 8499,
    currency: 'INR',
    rating: 4.6,
    reviews: 8100,
    merchant: 'MockStore India',
    image: '/img/products/monitor-generic.svg',
    specs: { Size: '24"', Panel: 'VA', Resolution: '1920x1080', Refresh: '75 Hz' },
    highlights: ['Crisp panel for the price', 'Great second screen for coding'],
    source: 'mock',
  },
];

// Simple SVG placeholders so the catalogue renders without binary assets
export const PLACEHOLDER_SVG = (label: string, color: string) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="${color}"/><text x="240" y="168" font-family="Segoe UI,Arial" font-size="28" fill="#fff" text-anchor="middle">${label}</text></svg>`
  );

function mockSearch(p: SearchParams): Product[] {
  let items = [...MOCK_CATALOGUE];
  if (p.category) {
    const c = p.category.toLowerCase();
    items = items.filter((i) => i.category === c || i.title.toLowerCase().includes(c));
  }
  if (p.q) {
    const words = p.q.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter((i) =>
      words.some((w) =>
        `${i.title} ${i.brand} ${i.category} ${Object.values(i.specs).join(' ')}`
          .toLowerCase()
          .includes(w)
      )
    );
  }
  if (p.minPrice != null) items = items.filter((i) => i.price >= p.minPrice!);
  if (p.maxPrice != null) items = items.filter((i) => i.price <= p.maxPrice!);
  items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return items.slice(0, p.limit ?? 24);
}

async function channel3Search(p: SearchParams): Promise<Product[]> {
  const url = new URL('/v1/products/search', env.products.channel3BaseUrl);
  if (p.q) url.searchParams.set('q', p.q);
  if (p.category) url.searchParams.set('category', p.category);
  if (p.maxPrice != null) url.searchParams.set('max_price', String(p.maxPrice));
  url.searchParams.set('limit', String(p.limit ?? 24));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.products.channel3Key}` },
  });
  if (!res.ok) throw new Error(`Channel3 responded ${res.status}`);
  const json: any = await res.json();

  // Map Channel3's payload to our normalised Product shape.
  return (json.products ?? json.results ?? []).map((r: any) => ({
    id: r.id,
    title: r.title ?? r.name,
    brand: r.brand ?? 'Unknown',
    category: r.category ?? 'general',
    price: Number(r.price ?? r.best_offer?.price ?? 0),
    currency: r.currency ?? 'USD',
    rating: r.rating,
    reviews: r.reviews_count ?? r.reviews,
    merchant: r.merchant ?? r.offers?.[0]?.merchant ?? 'Unknown',
    image: r.image_url ?? r.image,
    specs: r.specifications ?? {},
    highlights: r.highlights ?? [],
    source: 'channel3' as const,
  }));
}

export async function searchProducts(p: SearchParams): Promise<{ products: Product[]; source: string }> {
  if (env.products.source === 'channel3' && env.products.channel3Key) {
    try {
      const products = await channel3Search(p);
      return { products, source: 'channel3' };
    } catch (e: any) {
      // Graceful fallback — but keep labelling honest
      console.error('[channel3] falling back to mock:', e.message);
      return { products: mockSearch(p), source: 'mock (channel3 unavailable)' };
    }
  }
  return { products: mockSearch(p), source: 'mock' };
}

export async function getProduct(id: string): Promise<Product | null> {
  const { products } = await searchProducts({ limit: 100 });
  return products.find((x) => x.id === id) ?? null;
}
