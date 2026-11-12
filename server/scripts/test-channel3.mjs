// Ad-hoc smoke test for the Channel3 search integration (run: node scripts/test-channel3.mjs)
import 'dotenv/config';

const key = process.env.CHANNEL3_API_KEY;
if (!key) { console.error('CHANNEL3_API_KEY missing'); process.exit(1); }

const res = await fetch('https://api.trychannel3.com/v1/search', {
  method: 'POST',
  headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'wireless earbuds', limit: 3, config: { country: 'US', currency: 'USD' } }),
});
console.log('status:', res.status);
const json = await res.json().catch(() => null);
if (!json) { console.error('non-JSON response'); process.exit(1); }
const items = json.products ?? json.data ?? [];
console.log('products:', items.length);
for (const p of items.slice(0, 3)) {
  const offers = p.offers ?? [];
  console.log('-', p.id, '|', p.title, '| offers:', offers.length, '| first:', offers[0]?.domain, offers[0]?.price?.price ?? offers[0]?.price);
}
