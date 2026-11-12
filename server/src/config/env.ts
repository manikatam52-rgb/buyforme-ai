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
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  products: {
    source: (process.env.PRODUCT_SOURCE || 'mock') as 'mock' | 'channel3',
    channel3Key: process.env.CHANNEL3_API_KEY || '',
    channel3BaseUrl:
      process.env.CHANNEL3_BASE_URL || 'https://api.channel3.com',
  },
  apimatic: {
    enabled: process.env.APIMATIC_ENABLED === 'true',
    apiKey: process.env.APIMATIC_API_KEY || '',
  },
};

export const isProd = env.nodeEnv === 'production';
