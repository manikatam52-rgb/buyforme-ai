// Vercel serverless entrypoint: mounts the compiled Express app (server/dist/index.js).
// server/src/index.ts exports `app` and skips app.listen when running on Vercel (VERCEL=1).
const path = require('path');

let app;
try {
  const appModule = require(path.join(__dirname, '..', 'server', 'dist', 'index.js'));
  app = appModule.app || appModule.default || appModule;
} catch (err) {
  console.error('Failed to load compiled server from server/dist/index.js:', err);
  throw err;
}

module.exports = app;
