import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { Product, searchProducts } from './productDiscovery';
import { log } from '../utils/logger';

/**
 * AI shopping agent built on Google Gemini with structured JSON output.
 * The agent plans searches, interprets results and produces explanations.
 * It NEVER executes payments — it only advises; the user always approves.
 */

const genAI = env.gemini.apiKey ? new GoogleGenerativeAI(env.gemini.apiKey) : null;

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
    maxPrice: { type: 'number', nullable: true },
    minPrice: { type: 'number', nullable: true },
    requirements: { type: 'array', items: { type: 'string' } },
    clarifyingQuestion: { type: 'string', nullable: true },
    reply: { type: 'string' },
  },
  required: ['keywords', 'reply'],
} as const;

const COMPARE_SCHEMA = {
  type: 'object',
  properties: {
    bestOverall: { type: 'string' },
    bestBudget: { type: 'string' },
    bestPerformance: { type: 'string' },
    bestValue: { type: 'string' },
    tradeoffs: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['summary', 'bestOverall'],
} as const;

const BUDGET_SCHEMA = {
  type: 'object',
  properties: {
    overBudget: { type: 'boolean' },
    message: { type: 'string' },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  },
  required: ['overBudget', 'message'],
} as const;

function model() {
  if (!genAI) throw new Error('GEMINI_API_KEY is not configured');
  return genAI.getGenerativeModel({
    model: env.gemini.model,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
  });
}

export function aiConfigured(): boolean {
  return Boolean(genAI);
}

export interface Extraction {
  category?: string;
  keywords: string[];
  maxPrice?: number;
  minPrice?: number;
  requirements?: string[];
  clarifyingQuestion?: string;
  reply: string;
}

export async function extractIntent(
  userMessage: string,
  history: { role: string; text: string }[] = []
): Promise<Extraction> {
  const prompt = `You are BuyForMe AI, a shopping agent. Understand the user's shopping request and extract structured intent.
Return JSON: category, keywords (search terms), maxPrice, minPrice, requirements, clarifyingQuestion (only if truly needed), reply (short friendly reply to user; mention the budget/category found).

Conversation so far: ${JSON.stringify(history.slice(-6))}
User message: """${userMessage}"""`;
  try {
    const result = await model().generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    parsed.keywords = parsed.keywords ?? [userMessage];
    return parsed as Extraction;
  } catch (e: any) {
    log.error('extractIntent failed:', e.message);
    // Heuristic fallback so the demo still works without the API key
    const numbers = userMessage.match(/(\d[\d,]*)/g)?.map((n) => parseFloat(n.replace(/,/g, ''))) ?? [];
    const big = numbers.filter((n) => n > 500);
    return {
      keywords: userMessage.split(/\s+/).slice(0, 6),
      maxPrice: big.length ? Math.max(...big) : undefined,
      requirements: [],
      reply: 'I could not reach the AI service, so I ran a keyword search for you.',
    };
  }
}

export interface Comparison {
  bestOverall: string;
  bestBudget?: string;
  bestPerformance?: string;
  bestValue?: string;
  tradeoffs?: string;
  summary: string;
}

export async function compareProducts(products: Product[], context = ''): Promise<Comparison> {
  const sheet = products
    .map(
      (p, i) =>
        `${i}. ${p.title} (${p.brand}) — price ${p.price} ${p.currency}, rating ${p.rating ?? 'n/a'}, specs: ${JSON.stringify(p.specs)}, highlights: ${p.highlights.join('; ')}`
    )
    .join('\n');

  const prompt = `Compare these products for a shopper. Return JSON with keys bestOverall, bestBudget, bestPerformance, bestValue, tradeoffs, summary. Values should be the product names plus one-line reasons. Summary is a short paragraph addressed to the shopper.
${context ? `Shopper context: ${context}\n` : ''}Products:
${sheet}`;
  try {
    const result = await model().generateContent(prompt);
    return JSON.parse(result.response.text()) as Comparison;
  } catch (e: any) {
    log.error('compareProducts failed:', e.message);
    const cheapest = [...products].sort((a, b) => a.price - b.price)[0];
    return {
      bestOverall: products[0].title,
      bestBudget: cheapest.title,
      summary: 'AI comparison is unavailable right now; ranked products by rating instead.',
    };
  }
}

export interface BudgetReview {
  overBudget: boolean;
  message: string;
  suggestions?: { productId: string; reason: string }[];
}

export async function reviewBudget(
  cartSummary: string,
  total: number,
  budget?: number,
  cheaperAlternatives: Product[] = []
): Promise<BudgetReview> {
  const prompt = `You are BuyForMe AI's Budget Guardian. Cart total is ${total}. User's budget is ${
    budget ?? 'unknown'
  }. Cheaper alternatives: ${cheaperAlternatives
    .map((p) => `${p.title} @ ${p.price}`)
    .join(', ') || 'none'}.
Return JSON: overBudget (bool), message (explain totals and any savings), suggestions (array of {productId, reason}).
Cart: ${cartSummary}`;
  try {
    const result = await model().generateContent(prompt);
    return JSON.parse(result.response.text()) as BudgetReview;
  } catch (e: any) {
    log.error('reviewBudget failed:', e.message);
    const over = budget != null && total > budget;
    return {
      overBudget: over,
      message: over
        ? `Heads-up: your total ${total} exceeds your budget of ${budget}. Please confirm you're comfortable before paying.`
        : `Your total ${total} is within your budget${budget != null ? ` of ${budget}` : ''}. Ready when you are.`,
    };
  }
}

export { EXTRACTION_SCHEMA, COMPARE_SCHEMA, BUDGET_SCHEMA };
