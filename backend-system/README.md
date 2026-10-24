# Cortex AI Backend

A document-grounded RAG chat platform, built week by week as the Cortex
AI backend internship project: register, upload documents, ask questions
and get cited answers from your own files, on subscription plans with
real usage quotas, in shared team workspaces, under admin oversight.

**Live API:** _deployment URL is added here when the production deploy
lands (see Deployment below)._
Interactive docs on any running instance: `/api/docs`
Raw OpenAPI spec: `/api/docs.json`

---

## What it does

- **Auth** — register/login with bcrypt-hashed passwords and JWTs.
  Accounts carry a role (`user` / `admin`) and a status
  (`active` / `suspended`).
- **Document ingestion** — upload PDF, DOCX or TXT; text is extracted,
  split into overlapping chunks, and embedded with Google Gemini.
  Embeddings are stored on the chunks in MongoDB and retrieval scores
  them in-app, so the database doubles as the vector store.
- **Semantic search** — top-k chunks by cosine similarity over the
  caller's documents.
- **RAG chat** — chat sessions (optionally scoped to specific documents)
  answer from retrieved chunks, always with cited sources, over JSON or
  SSE streaming. Retrieved text is delimited as untrusted data and
  screened for prompt-injection phrasings; the model is instructed to
  never follow instructions found inside documents.
- **Billing** — Free / Pro / Team plans (single source of truth in
  `config/plans.js`), Stripe Checkout upgrades, signature-verified
  Stripe webhooks, per-period usage quotas enforced by middleware, a
  nightly rollover job plus a lazy rollover in the quota check itself.
- **Team workspaces** — a Team plan owner creates a workspace and
  invites members by email. Documents and chat sessions can be shared
  into it; all workspace activity draws from ONE shared usage pool at
  Team limits. Membership and plan checks run on every workspace route.
- **Admin** — admin-only endpoints list users and workspaces, suspend
  or reactivate accounts, and report last-30-days analytics (daily
  active users, messages per day, plan distribution, active vs
  cancelled subscriptions). The first admin is bootstrapped from the
  `ADMIN_EMAILS` env var; there is no seeded admin account.

## Architecture

```
client
  |
  v
Express app (app.js)
  helmet -> rate limits -> CORS -> JSON body -> mongo-sanitize
  |
  +-- /api/webhooks/stripe   (raw body, signature verified, mounted first)
  +-- /api/docs              (Swagger UI)   /api/docs.json (OpenAPI 3)
  +-- /api/auth              register, login, me
  +-- /api/documents         upload (multer), list, get, delete, stats
  +-- /api/search            semantic search, embedding retry
  +-- /api/chat/sessions     sessions, messages (JSON + SSE stream)
  +-- /api/billing           plans, me, checkout, cancel
  +-- /api/workspaces        CRUD, invite, members, shared docs/sessions
  +-- /api/admin             users, workspaces, suspend, analytics
  |
middleware: authenticate (JWT + suspension check), requireQuota
  (personal or workspace pool), workspace membership/owner, requireAdmin
  |
services: textExtraction -> chunking -> embeddings (Gemini)
          retrieval (cosine over stored chunk embeddings)
          rag (prompt build, injection screen, citations) -> llm (Gemini)
  |
MongoDB (Mongoose): User, Document, Chunk, ChatSession, ChatMessage,
Workspace. Nightly cron rolls billing periods for users and workspaces.
```

Quota model: every metered subject (a user, or a workspace) has usage
counters and a 30-day period. Checks happen before the work, accounting
increments after it succeeds, and rollovers happen both nightly (cron)
and lazily inside the quota middleware, so the two never fight.

## Tech stack

Node.js 18+, Express 4, Mongoose 7 / MongoDB, Google Gemini
(embeddings + chat), Stripe, multer, helmet, express-rate-limit,
express-mongo-sanitize, swagger-ui-express. Tests use the built-in
`node:test` runner with supertest and mongodb-memory-server.

## Setup

Prerequisites: Node.js 18+, a MongoDB database (MongoDB Atlas free tier
or local), a Google Gemini API key. Stripe keys are only needed for real
billing flows.

```bash
cd backend-system
npm install
cp .env.example .env   # fill in the values below
npm run dev            # or: npm start
```

The server runs on `http://localhost:3001` by default; check
`GET /api/health` and open `http://localhost:3001/api/docs`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | no (3001) | Listen port |
| `NODE_ENV` | no | `production` enables the JWT fail-fast check |
| `CORS_ORIGIN` | no | Allowed frontend origins, comma-separated or `*` |
| `MONGODB_URI` | yes | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | yes | Signs JWTs. Refuses to boot in production when unset or left at the dev fallback |
| `GOOGLE_GEMINI_API_KEY` | yes | Embeddings and chat completions |
| `GEMINI_CHAT_MODEL` | no | Chat model override (default `gemini-2.0-flash`) |
| `STRIPE_SECRET_KEY` | for billing | Stripe API key (test mode is fine) |
| `STRIPE_WEBHOOK_SECRET` | for billing | Verifies webhook signatures |
| `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM` | for billing | Price ids for checkout |
| `FRONTEND_URL` | for billing | Checkout success/cancel redirect base |
| `ADMIN_EMAILS` | no | Comma-separated emails promoted to admin at register/login |
| `UPLOAD_DIR` | no | Upload destination (default `./uploads`, created automatically) |
| `MAX_UPLOAD_BYTES` | no | Per-file upload cap (default 25 MB) |
| `CHAT_MAX_MESSAGE_CHARS` | no | Chat message length cap (default 4000) |
| `SEARCH_MAX_QUERY_CHARS` | no | Search query length cap (default 1000) |
| `RAG_MAX_CONTEXT_TOKENS` | no | Retrieved-context budget per prompt (default 6000) |
| `DISABLE_RATE_LIMITS` | tests only | `true` skips rate limiters. Never in production |

All secrets live in `.env` / the host's environment. Nothing is
hardcoded; `.env` is git-ignored.

## Tests

```bash
npm test
```

30 tests: unit tests for chunking, plan/quota calculations and the
usage-reset rollover, the RAG prompt suite, and an end-to-end integration
suite against an in-memory MongoDB (Gemini stubbed at the module
boundary, so no key or network is needed) covering the full flow
register → upload → embedded → cited answer, the free-plan quota block,
workspace sharing and removal, admin gating and suspension, and Stripe
webhook signature rejection.

## Security notes

- Passwords bcrypt-hashed; JWTs verified on every protected route, and
  suspended accounts are rejected even with a valid token.
- Prompt injection: retrieved document text is wrapped in
  `<retrieved-context>` delimiters, the system prompt forbids treating
  it as instructions, and a heuristic scan logs suspicious chunks.
  Input length caps bound per-call LLM cost on chat and search.
- helmet headers, three-tier rate limiting (global / auth / LLM-backed
  routes), Mongo operator sanitization on all request input, upload
  type + size restrictions, strict Stripe webhook signature
  verification over the raw body.
- Every Gemini call logs its token usage (`[LLM] ... totalTokens=...`),
  so LLM spend is visible and monitorable in the host logs.

## Deployment

The repo root carries a `render.yaml` blueprint: Render creates the web
service from `backend-system/`, health-checks `/api/health`, generates
`JWT_SECRET`, and prompts for the remaining secrets in the dashboard.

1. Create a MongoDB Atlas free (M0) cluster and copy its connection
   string into `MONGODB_URI`. (Embeddings live in the same database, so
   Atlas is also the hosted vector store.)
2. In Render: New → Blueprint → this repo → fill the prompted secrets
   (Atlas URI, Gemini key, Stripe keys, your admin email).
3. Verify: `GET /api/health` returns healthy, register a user, upload a
   document, ask a question, and watch the `[LLM]` token lines appear in
   the Render logs. Point Stripe's webhook endpoint at
   `/api/webhooks/stripe` and save its signing secret.

On the free tier the service sleeps when idle, so the first request
after a quiet period takes up to a minute. That is expected.

## Docs

- Interactive: `/api/docs` (Swagger UI) and `/api/docs.json`
- Hand-written reference: `API_REFERENCE.md` in this folder
- Postman collection: `Cortex_AI_Auth_Collection.postman_collection.json`
