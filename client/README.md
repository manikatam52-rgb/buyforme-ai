# BuyForMe AI frontend

Responsive React, TypeScript and Vite application for the BuyForMe AI agentic commerce demo. Tailwind CSS provides styling, React Router handles navigation, Axios provides the API client, and AG Grid powers product comparison.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

By default Vite proxies `/api` to `http://localhost:5000` (see `vite.config.ts`). Set `VITE_API_BASE_URL` in `.env.local` to the backend API base URL when using a separate deployment, for example `https://api.example.com/api`. Only public frontend configuration belongs in `VITE_*` variables. Never put PayPal secrets, Gemini keys, MongoDB credentials, or signing keys in this app.

Create a production bundle with `npm run build`; serve the generated `dist` directory with SPA fallback enabled.

## Frontend structure

- `src/pages` — landing, authentication, assistant, discovery, product details, comparison, cart, checkout/result, dashboard, and transactions.
- `src/components` — shared navigation and product cards.
- `src/context` and `src/hooks` — session and cart state.
- `src/lib/api.ts` — Axios client, token handling, shared types, and the single `API_ENDPOINTS` route map.

## Backend contract to align with Agent 1

These paths match the Express routes currently visible in the workspace. Keep route changes centralized in `src/lib/api.ts`. All endpoints are relative to the configured API base URL.

| Flow | Method and path | Frontend expectation |
| --- | --- | --- |
| Register / login | `POST /auth/register`, `POST /auth/login` | `{ token, user }`; register sends `{ name, email, password }`, login sends `{ email, password }` |
| Current user / budget | `GET /auth/me`, `PATCH /auth/preferences` | Current user JSON; budget update sends `{ monthlyBudget }` |
| AI assistant | `POST /ai/chat` | Sends `{ message, history }`; expects `{ reply, intent, products, comparison, catalogSource }` |
| AI comparison | `POST /ai/compare` | Sends `{ productIds }`; expects `{ comparison, products? }` |
| Budget review | `POST /ai/budget-review` | Sends `{ total, items, budget }`; expects `{ overBudget, message, suggestions? }` |
| Product search / detail | `GET /products?q=&category=&maxPrice=&minPrice=&limit=`, `GET /products/:id` | Search returns `{ products, catalogSource }`; detail returns a product |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId` | Cart calls expect `{ cart, totals }`; add sends product id, title, merchant, unit price, quantity and optional image |
| PayPal config / order | `GET /paypal/config`, `POST /orders/create`, `POST /orders/:id/capture` | Config exposes the public SDK client id, mode and currency; create expects `{ orderId }`; capture expects `{ transaction }` |
| Transactions | `GET /transactions` | Expects `{ transactions, totalSpent, currency }` |

Authenticated calls send the bearer token in `Authorization`. The PayPal JavaScript SDK is loaded with the public client id returned by the backend. Order creation and capture remain server-side; the browser does not calculate or submit an authoritative payment amount. Confirm response envelopes, optional fields, and error format with Agent 1 before the final integration. Any catalogue marked `mock` by the API is labelled as demo data in the UI.
