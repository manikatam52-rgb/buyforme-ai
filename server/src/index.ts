import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import routes from './routes';
import { env, isProd } from './config/env';
import { errorHandler, HttpError } from './middleware/errorHandler';
import { log } from './utils/logger';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '256kb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    env: env.nodeEnv,
    paypalConfigured: Boolean(env.paypal.clientId && env.paypal.clientSecret),
    productSource: env.products.source,
    integrations: {
      zapier: Boolean(env.zapier.webhookUrl),
      elastic: Boolean(env.elastic.host),
      kernel: Boolean(env.kernel.apiKey),
      apimatic: env.apimatic.enabled && Boolean(env.apimatic.apiKey),
    },
  })
);

app.use('/api', routes);

// 404
app.use((_req, _res, next) => next(new HttpError(404, 'Route not found')));
app.use(errorHandler);

process.on('unhandledRejection', (reason: any) =>
  log.error('Unhandled rejection:', reason?.message ?? reason)
);
process.on('uncaughtException', (e) => log.error('Uncaught exception:', e.message));

async function start() {
  mongoose.set('bufferTimeoutMS', 5000); // fail fast instead of hanging
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    log.info('MongoDB connected');
  } catch (e: any) {
    log.error('MongoDB connection failed:', e.message);
    log.warn('Continuing without DB — persistence-backed endpoints will return 503.');
  }

  app.listen(env.port, () => log.info(`API listening on http://localhost:${env.port}`));
}

if (process.env.VERCEL === '1') {
  // Serverless (Vercel): Vercel mounts `app` itself — never bind a port.
  // Kick off the DB connection on cold start; queries buffer until ready.
  mongoose.set('bufferTimeoutMS', 5000);
  mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 }).catch((e: any) =>
    log.error('MongoDB connection failed:', e?.message ?? e)
  );
} else {
  start();
}
