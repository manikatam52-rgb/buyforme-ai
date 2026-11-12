import dotenv from 'dotenv';
dotenv.config();

const required = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${key}`);
  return v;
};

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret'),
  mongoUri: required(
    'MONGODB_URI',
    'mongodb://127.0.0.1:27017/buyforme'
  ),
  paypal: {
    mode: (process.env.PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live',
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    currency: process.env.PAYPAL_CURRENCY || 'USD',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    // gemini-1.5/2.0/2.5-flash are retired for new API users; 3.8/flash-latest often return 503
    // under load. "gemini-flash-lite-latest" is a stable alias that follows the current lite model.
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  },
  products: {  // Channel3: search mode — 'default' (fast, structured) or 'agentic' (natural-language briefs)
    channel3Mode: (process.env.CHANNEL3_MODE || 'default') as 'default' | 'agentic' | 'keyword',
    source: (process.env.PRODUCT_SOURCE || 'mock') as 'mock' | 'channel3',
    channel3Key: process.env.CHANNEL3_API_KEY || '',
    channel3BaseUrl:
      process.env.CHANNEL3_BASE_URL || 'https://api.trychannel3.com',
    // Currency used for Channel3 locale (offer prices). Keep in sync with PayPal currency.
    channel3Currency: process.env.CHANNEL3_CURRENCY || 'USD',
    channel3Country: process.env.CHANNEL3_COUNTRY || 'US',
  },
  apimatic: {
    enabled: process.env.APIMATIC_ENABLED === 'true',
    apiKey: process.env.APIMATIC_API_KEY || '',
  },
  zapier: {
    // Optional "Webhooks by Zapier" Catch Hook URL; fires only after verified capture
    webhookUrl: process.env.ZAPIER_WEBHOOK_URL || '',
  },
  elastic: {
    // Optional Elasticsearch cluster for hybrid (BM25 + kNN) product search
    host: process.env.ELASTIC_HOST || '',
    apiKey: process.env.ELASTIC_API_KEY || '',
    embeddingDims: parseInt(process.env.ELASTIC_EMBEDDING_DIMS || '768', 10),
    // Gemini embedding model used for the semantic half of hybrid search
    embeddingModel: process.env.ELASTIC_EMBEDDING_MODEL || 'text-embedding-004',
  },
  kernel: {
    // Optional Kernel (onkernel.com) cloud-browser key for read-only product research
    apiKey: process.env.KERNEL_API_KEY || '',
  },
};

export const isProd = env.nodeEnv === 'production';
