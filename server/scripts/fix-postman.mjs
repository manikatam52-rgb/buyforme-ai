// Adds the "Optional Integrations" folder to the Postman collection programmatically.
import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../../docs/BuyForMe-AI.postman_collection.json', import.meta.url);
const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const collection = JSON.parse(raw);

if (!collection.item.some((f) => f.name === 'Optional Integrations')) {
  collection.item.push({
    name: 'Optional Integrations',
    item: [
      {
        name: 'Integration status (honest)',
        request: {
          method: 'GET',
          url: '{{baseUrl}}/integrations',
          description:
            'Reports which optional sponsor integrations are configured. Unconfigured ones are labelled, never faked.',
        },
      },
      {
        name: 'Elastic — index catalogue',
        request: {
          method: 'POST',
          url: '{{baseUrl}}/search/elastic/index',
          description: 'Re-indexes the Channel3/mock catalogue into Elasticsearch. Requires ELASTIC_HOST; 503 otherwise.',
        },
      },
      {
        name: 'Elastic — hybrid search',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: { mode: 'raw', raw: '{\n  "q": "lightweight laptop for coding",\n  "maxPrice": 1200,\n  "limit": 10\n}' },
          url: '{{baseUrl}}/search/elastic',
          description: 'Hybrid lexical + semantic (kNN) search. Falls back to lexical-only if embeddings are unavailable.',
        },
      },
      {
        name: 'Kernel — research product URL',
        request: {
          method: 'POST',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: { mode: 'raw', raw: '{\n  "url": "https://www.example.com/products/thing"\n}' },
          url: '{{baseUrl}}/research/url',
          description: 'Read-only page research via Kernel cloud browser (or static fetch fallback). Payment/auth URLs are refused with 400.',
        },
      },
      {
        name: 'Bryntum — delivery schedule feed',
        request: {
          method: 'GET',
          url: '{{baseUrl}}/schedule/delivery',
          description:
            'Bryntum Calendar/Scheduler-shaped events for completed captures (simulated 2-5 business day windows). 404 until a capture exists.',
        },
      },
    ],
  });
  writeFileSync(path, JSON.stringify(collection, null, 2) + '\n');
  console.log('Added Optional Integrations folder');
} else {
  console.log('Folder already present');
}
console.log('Folders:', collection.item.map((f) => f.name).join(' | '));
