# Cortex AI — Document RAG Chat Platform

A complete SaaS backend built over the 8-week Cortex AI backend
internship: upload documents, ask questions and get cited answers from
your own files, on subscription plans with real quotas, in shared team
workspaces, under admin oversight. Tested, hardened, documented and
deployable.

**Live API:** _added here when the production deploy lands_
**API docs (on any running instance):** `/api/docs` · `/api/docs.json`
**Full backend README:** [backend-system/README.md](backend-system/README.md)

## Built week by week

1. **Foundation** — Express + MongoDB server, health checks, clean errors
2. **Auth** — register/login, bcrypt passwords, JWT sessions
3. **Document ingestion** — PDF/DOCX/TXT upload, text extraction, chunking
4. **Embeddings + semantic search** — Gemini embeddings, cosine retrieval
5. **RAG chat API** — sessions, cited answers, SSE streaming, injection guardrails
6. **Billing** — Free/Pro/Team plans, Stripe Checkout + webhooks, usage quotas
7. **Team workspaces + admin** — shared documents, a shared quota pool,
   member invites, admin user/workspace management and analytics
8. **Proof** — 30 automated tests, security hardening (helmet, rate
   limits, sanitization, input caps), Swagger/OpenAPI docs, Render
   deployment blueprint

## Run it

```bash
cd backend-system
npm install
cp .env.example .env   # MongoDB URI, JWT secret, Gemini API key
npm run dev
npm test               # 30 unit + integration tests
```

## Deploy

`render.yaml` at the repo root is a Render blueprint backed by a
MongoDB Atlas free cluster (which also stores the embeddings). Steps
are in the Deployment section of the backend README.
