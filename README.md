# BuyForMe AI 🛍️🤖

> **Your AI. Your Budget. Your Smarter Shopping Experience.**

BuyForMe AI is an intelligent **Agentic Commerce** platform built for the PayPal AI Hackathon 2026. An AI-powered personal shopping agent understands natural-language requests, discovers products, compares prices with an interactive AG Grid, guards your budget, and facilitates **real PayPal Sandbox** checkout — with server-side order creation, capture, verification and transaction records in MongoDB Atlas.

**All payments run on PayPal Sandbox and are clearly labelled as simulated. No real money moves. The AI never executes a purchase without explicit user approval.**

---

## Problem Statement

Online shopping is fragmented: users bounce between tabs comparing specs, struggle to express what they actually want, overspend, and checkout flows fail silently. Existing "AI shopping" tools stop at chat — they cannot search, compare, cart and *pay* end-to-end.

## Solution

One agent handles the full journey:

1. **Understand** — natural language → structured intent (budget, category, specs) via Gemini structured JSON
2. **Discover** — matched products from a modular product service
3. **Compare** — AG Grid interactive comparison with AI-written verdicts (best overall / budget / value)
4. **Guard** — AI Budget Guardian reviews the cart vs your budget before checkout, suggests cheaper alternatives
5. **Pay** — PayPal Sandbox checkout: server-side order creation → popup approval → server-side capture → server-side verification → MongoDB transaction record
6. **Track** — dashboard with simulated spend, statuses and history

## Architecture

```
┌────────────────────── client (React + TS + Vite + Tailwind) ─────────────────────┐
│ Landing · Auth · AI Assistant · Discover · AG Grid Compare · Cart                │
│ Checkout (PayPal JS SDK buttons) · Confirmation · Dashboard · Transactions       │
└──────────────────────────────────┬───────────────────────────────────────────────┘
                                   │ REST (JWT bearer)
┌──────────────────────────────────▼────────────── server (Node + Express + TS) ───┐
│ routes → controllers → services                                                  │
│  · geminiAgent      — intent extraction, comparison, budget review (JSON schemas)│
│  · productDiscovery — Channel3 adapter OR clearly-labelled mock catalogue        │
│  · paypalService    — Checkout Server SDK: create / get / capture (idempotent)   │
│  · cartService      — totals, tax, shipping                                      │
│  · apimaticService  — optional grounded PayPal API docs context                  │
│ middleware: JWT auth · centralized errors · rate limiting (auth/AI/payments)     │
└───────────────┬──────────────────────────────────────┬───────────────────────────┘
                │                                       │
        MongoDB Atlas (users, carts,             PayPal Sandbox REST API
        transactions w/ unique capture           (OAuth client-credentials,
        index — duplicate-capture safe)           Orders v2, server-side capture)
```

## Features

| Feature | Details |
|---|---|
| AI Shopping Assistant | Natural-language requests → intent JSON → product matches → comparison → clarifying questions |
| Product Discovery | Images, prices, ratings, specs, merchants, add-to-cart; catalogue source always displayed |
| AI Comparison | AG Grid (sort/filter/lowest-price & best-pick highlighting) + Gemini verdicts |
| Smart Cart | Quantities, subtotal, tax & shipping, server-recomputed totals |
| PayPal Checkout | Full Orders v2 flow on Sandbox; amount recomputed server-side |
| Budget Guardian | Over-budget detection, cheaper alternatives, savings explanation, user confirmation |
| Security | JWT auth, input validation (zod-style checks), order ownership + amount verification, DB-level duplicate-capture protection, secret redaction in logs |

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide icons, AG Grid Community, PayPal JS SDK
- **Backend:** Node.js, Express, TypeScript, JWT, Helmet, rate limiting, Morgan logging
- **Database:** MongoDB Atlas + Mongoose
- **AI:** Google Gemini (`@google/generative-ai`) with structured JSON responses
- **Payments:** PayPal Checkout Server SDK + Sandbox REST API

## Sponsor Integrations (honest status)

| Sponsor | Status | Where |
|---|---|---|
| **PayPal Sandbox** | ✅ Fully integrated (primary) | `server/src/services/paypalService.ts`, checkout flow, transactions |
| **Channel3** | 🔶 Modular adapter | `PRODUCT_SOURCE=channel3` enables live discovery; default is a **clearly-labelled mock catalogue** — no fabricated live prices |
| **AG Grid** | ✅ Fully integrated | `/compare` — sorting, filtering, price/rating/spec columns, best-value highlighting |
| **APIMatic** | 🔶 Optional, off by default | `APIMATIC_ENABLED=true` fetches grounded PayPal API docs context (`GET /api/ai/api-intelligence`); not claimed as working unless configured |
| **Render** | ✅ Blueprint ready | `server/render.yaml` — health check, env vars, build/start commands |
| **Postman** | ✅ Complete collection | [`docs/BuyForMe-AI.postman_collection.json`](docs/BuyForMe-AI.postman_collection.json) + environment file, incl. auto-token capture, error scenarios and optional-integration endpoints |
| **Elastic** | 🔶 Optional hybrid search | `ELASTIC_HOST` enables lexical + semantic (kNN via Gemini embeddings) search: `POST /api/search/elastic`, `POST /api/search/elastic/index`; 503 + honest label when unconfigured |
| **Zapier** | 🔶 Optional automation | `ZAPIER_WEBHOOK_URL` (Webhooks-by-Zapier Catch Hook) fires `payment.captured` **only after** server-verified capture; failures never block checkout |
| **Kernel** | 🔶 Optional research | `KERNEL_API_KEY` enables read-only product-page research: `POST /api/research/url`; payment/auth URLs are refused server-side. Never automates approval |
| **Bryntum** | 🔶 Feed ready | `GET /api/schedule/delivery` emits Bryntum Calendar/Scheduler-shaped delivery events for completed captures (frontend renders the component) |
| **Astropods** | ❌ Not integrated (honest) | Astropods hosts whole agent deployments, not embeddable components; integrating it would move the PayPal-critical path off our server. Documented as a possible future deployment target |

## Getting Started

### Prerequisites
Node 18+, MongoDB Atlas cluster (or local MongoDB), PayPal developer account, Gemini API key.

### 1. PayPal Sandbox setup
1. Go to [developer.paypal.com/dashboard](https://developer.paypal.com/dashboard/applications/sandbox) → create an app
2. Copy the **Client ID** and **Client Secret** (sandbox)
3. Note a generated **Sandbox buyer account** (Business & Personal accounts come pre-made)

### 2. Backend

```bash
cd server
cp .env.example .env        # fill in your values
npm install
npm run dev                 # http://localhost:5000
```

Environment variables (all in `server/.env`):

| Variable | Purpose |
|---|---|
| `PORT`, `NODE_ENV`, `CLIENT_URL` | Server basics |
| `JWT_SECRET` | Token signing |
| `MONGODB_URI` | Atlas connection string |
| `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_CURRENCY` | Sandbox credentials — **server-only, never in frontend code** |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI agent (default `gemini-flash-lite-latest`; 1.5/2.0-flash are retired) |
| `PRODUCT_SOURCE`, `CHANNEL3_API_KEY`, `CHANNEL3_BASE_URL` | Product discovery (`mock` or `channel3`) |
| `CHANNEL3_COUNTRY`, `CHANNEL3_CURRENCY`, `CHANNEL3_MODE` | Channel3 locale + search mode (`default`/`agentic`) |
| `APIMATIC_ENABLED`, `APIMATIC_API_KEY` | Optional APIMatic integration |
| `ZAPIER_WEBHOOK_URL` | Optional Zapier Catch Hook — fires only after verified capture |
| `ELASTIC_HOST`, `ELASTIC_API_KEY`, `ELASTIC_EMBEDDING_DIMS`, `ELASTIC_EMBEDDING_MODEL` | Optional Elastic hybrid search |
| `KERNEL_API_KEY` | Optional Kernel cloud-browser research (read-only) |

### 3. Frontend

```bash
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api → :5000)
```

### 4. Run the demo flow
1. Register → set a monthly budget
2. Assistant: *"Find me the best laptop for coding under ₹60,000."*
3. Review the AI comparison → add a laptop to cart
4. Cart → **Run AI Budget Guardian** → Proceed to Checkout
5. Approve with your **Sandbox buyer account** in the PayPal popup
6. Server captures, verifies, records → confirmation + transaction history

## API Documentation

Full interactive reference: import `docs/BuyForMe-AI.postman_collection.json` into Postman (use the environment file alongside it). Summary:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | JWT auth |
| GET/PATCH | `/api/auth/me` · `/api/auth/preferences` | Profile & budget |
| POST | `/api/ai/chat` | Shopping assistant (intent + products + comparison) |
| POST | `/api/ai/compare` · `/api/ai/budget-review` | AI verdicts / Budget Guardian |
| GET | `/api/products` · `/api/products/:id` | Discovery |
| GET/POST/PATCH/DELETE | `/api/cart…` | Cart management |
| POST | `/api/orders/create` | Server-side PayPal order creation |
| POST | `/api/orders/:id/capture` | Verified, idempotent capture |
| GET | `/api/orders/:id` · `/api/transactions` | Status & history |
| GET | `/health`, `/api/paypal/config` | Health, public client config |

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). TL;DR: `server/render.yaml` is a Render Blueprint (health check at `/health`); the Vite client deploys as a static site pointed at the Render API.

## Screenshots

> _Placeholders — drop screenshots into `docs/screenshots/`:_
- Landing page · AI assistant conversation · AG Grid comparison · Cart with Budget Guardian · PayPal Sandbox approval · Confirmation · Dashboard

## Demo Video

> 🎥 _Add your demo video link here._

## Future Improvements

- Webhook-driven capture (webhooks + signature verification) alongside the synchronous capture
- Real Channel3 / merchant inventory breadth; price freshness timestamps
- Agent memory for multi-session shopping lists
- Streaming assistant responses; voice input
- Multi-currency conversion service feeding PayPal amount ordering

## Licence

MIT — see [LICENSE](LICENSE).
