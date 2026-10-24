# API Reference

## Base URL
```
http://localhost:3001/api
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "passwordConfirm": "SecurePass123"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  },
  "message": "User registered successfully"
}
```

**Errors:**
- 400: Missing fields, password mismatch, short password
- 409: Email already registered
- 500: Server error

---

### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Errors:**
- 400: Missing email or password
- 401: Invalid credentials
- 500: Server error

---

### GET /auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "User retrieved successfully"
}
```

**Errors:**
- 401: Missing or invalid token
- 404: User not found
- 500: Server error

---

## Document Endpoints

### POST /documents
Upload a document for processing.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
- `file`: PDF, DOCX, or TXT file (max 25MB)

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "document_id",
    "filename": "sample.pdf",
    "fileType": "pdf",
    "status": "processing",
    "uploadedAt": "2024-01-01T12:00:00Z"
  },
  "message": "Document uploaded successfully and is being processed"
}
```

**Errors:**
- 400: No file, invalid file type, file too large
- 401: Missing or invalid token
- 500: Upload error

---

### GET /documents
List all documents for the user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "document_id",
      "filename": "sample.pdf",
      "fileType": "pdf",
      "status": "ready",
      "pageCount": 5,
      "chunkCount": 12,
      "embeddedChunkCount": 12,
      "uploadedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "message": "Documents retrieved successfully"
}
```

**Errors:**
- 401: Missing or invalid token
- 500: Server error

---

### GET /documents/stats
Get document processing statistics.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "totalDocuments": 3,
    "processingCount": 0,
    "readyCount": 3,
    "failedCount": 0,
    "totalChunks": 28,
    "embeddedChunks": 28,
    "totalSize": 2457600
  },
  "message": "Document statistics retrieved successfully"
}
```

**Errors:**
- 401: Missing or invalid token
- 500: Server error

---

### GET /documents/:id
Get document details with chunks.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "document_id",
    "filename": "sample.pdf",
    "fileType": "pdf",
    "status": "ready",
    "pageCount": 5,
    "chunkCount": 12,
    "embeddedChunkCount": 12,
    "chunks": [
      {
        "_id": "chunk_id",
        "chunkIndex": 0,
        "text": "Document text...",
        "tokenCount": 487,
        "embeddingStatus": "completed"
      }
    ],
    "uploadedAt": "2024-01-01T12:00:00Z"
  },
  "message": "Document retrieved successfully"
}
```

**Errors:**
- 401: Missing or invalid token
- 404: Document not found
- 500: Server error

---

### DELETE /documents/:id
Delete a document and cascade-delete chunks.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Document deleted successfully"
}
```

**Errors:**
- 401: Missing or invalid token
- 404: Document not found
- 500: Server error

---

## Search Endpoints

### POST /search
Perform semantic search across documents.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request (all documents):**
```json
{
  "query": "What is machine learning?",
  "topK": 5
}
```

**Request (specific document):**
```json
{
  "query": "What is machine learning?",
  "documentId": "specific_document_id",
  "topK": 5
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "query": "What is machine learning?",
    "results": [
      {
        "_id": "chunk_id",
        "chunkIndex": 0,
        "text": "Machine learning is a subset of artificial intelligence...",
        "tokenCount": 487,
        "document": {
          "_id": "document_id",
          "filename": "AI_Guide.pdf"
        },
        "similarity": 0.92
      }
    ],
    "totalResults": 1,
    "documentId": null
  },
  "message": "Search completed successfully"
}
```

**Parameters:**
- `query` (required): Search query string
- `topK` (optional): Number of results (default: 5)
- `documentId` (optional): Search within specific document

**Errors:**
- 400: Missing query, invalid query type
- 401: Missing or invalid token
- 404: Document not found (if documentId provided)
- 500: Search error

---

### POST /search/retry/:chunkId
Retry embedding for a failed chunk.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Chunk embedding retried successfully"
}
```

**Errors:**
- 400: Max retries exceeded
- 401: Missing or invalid token
- 403: Unauthorized (not document owner)
- 404: Chunk not found
- 500: Retry error

---

## Health Check

### GET /health
Check server and database status.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "database": "connected"
  }
}
```

---

## Billing Endpoints

### GET /billing/plans
Public. List subscription tiers with their limits.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "free",
      "name": "Free",
      "priceMonthly": 0,
      "limits": { "maxDocuments": 5, "maxMessages": 50, "maxStorageBytes": 52428800 }
    },
    {
      "id": "pro",
      "name": "Pro",
      "priceMonthly": 12,
      "limits": { "maxDocuments": 100, "maxMessages": 2000, "maxStorageBytes": 5368709120 }
    },
    {
      "id": "team",
      "name": "Team",
      "priceMonthly": 49,
      "limits": { "maxDocuments": 1000, "maxMessages": 20000, "maxStorageBytes": 53687091200 }
    }
  ],
  "message": "Plans retrieved successfully"
}
```

### GET /billing/me
Auth required. Current plan, subscription status, usage and billing period.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "plan": "pro",
    "planName": "Pro",
    "subscriptionStatus": "active",
    "usage": { "documentsUploaded": 3, "messagesSent": 41, "storageUsed": 12582912 },
    "limits": { "maxDocuments": 100, "maxMessages": 2000, "maxStorageBytes": 5368709120 },
    "currentPeriodStart": "2026-10-01T00:00:00Z",
    "currentPeriodEnd": "2026-10-31T00:00:00Z"
  },
  "message": "Billing status retrieved successfully"
}
```

### POST /billing/checkout
Auth required. Create a Stripe Checkout session to upgrade.

**Request:**
```json
{ "planId": "pro" }
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "url": "https://checkout.stripe.com/...", "sessionId": "cs_..." },
  "message": "Checkout session created"
}
```

### POST /billing/cancel
Auth required. Cancel the active Stripe subscription immediately.
The `customer.subscription.deleted` webhook moves the user back to Free.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Subscription cancelled. Your plan will revert to Free once Stripe confirms."
}
```

### POST /webhooks/stripe
Stripe webhook receiver. Verifies the `stripe-signature` header against the
raw request body, then syncs the user on `checkout.session.completed`,
`customer.subscription.updated`, and `customer.subscription.deleted`.

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error description"
}
```

**Status Codes:**
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

---

## Authentication

All protected endpoints require Bearer token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token is valid for 7 days from login. Expired tokens return 401.

---

## Document Status

- `processing`: File uploaded, being processed
- `ready`: All chunks embedded, ready for search
- `failed`: Error during processing

Check status via `GET /documents` or `GET /documents/:id`

---

## Chunk Embedding Status

- `pending`: Chunk created, waiting for embedding
- `completed`: Successfully embedded
- `failed`: Embedding failed, available for retry

Retry failed chunks via `POST /search/retry/:chunkId`

---

## Rate Limiting

No built-in rate limiting. Gemini API has rate limits:
- Standard: 60 requests per minute
- If hitting limits, exponential backoff automatic retry activates

---

## Response Time

| Operation | Time |
|-----------|------|
| User registration | <100ms |
| Login | <150ms |
| Document upload | <500ms |
| Text extraction | 2-10s |
| Chunking | <1s |
| Embedding generation | 10-30s |
| Semantic search | <500ms |
| Get statistics | <200ms |

---

## Examples

### Complete Authentication Flow
```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"User","email":"user@example.com","password":"Pass123","passwordConfirm":"Pass123"}'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123"}'

# Save token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get current user
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Complete Document Processing Flow
```bash
TOKEN="your_token_here"

# 1. Upload document
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample.pdf"

# Save document ID from response
DOC_ID="document_id_here"

# 2. Wait 30-60 seconds for processing

# 3. Check status
curl -X GET http://localhost:3001/api/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN"

# 4. Search
curl -X POST http://localhost:3001/api/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"search term","topK":5}'
```

## Chat Endpoints

RAG-powered chat. Every reply is grounded in retrieved document chunks and
returned with its cited sources. Sending a message counts against the plan's
message quota, same as search.

### POST /chat/sessions
Create a chat session.

**Headers:**
```
Authorization: <redacted>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Refund policy Q&A",
  "documentIds": ["671a1b2c3d4e5f60718293a4"]
}
```
`documentIds` is optional. When set, retrieval is scoped to those documents
(each id must belong to the user). Omit it to search all of the user's
documents.

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "671a1b2c3d4e5f60718293b5",
    "owner": "671a1b2c3d4e5f60718293a0",
    "title": "Refund policy Q&A",
    "documentIds": ["671a1b2c3d4e5f60718293a4"],
    "createdAt": "2026-10-17T07:00:00Z",
    "updatedAt": "2026-10-17T07:00:00Z"
  },
  "message": "Chat session created successfully"
}
```

### GET /chat/sessions
Auth required. List the user's sessions, most recently active first.

### DELETE /chat/sessions/:id
Auth required. Delete a session and all of its messages.

### POST /chat/sessions/:id/messages
Send a message and get the AI's reply. The backend embeds the message,
retrieves the top-k chunks via the same ranking as `/search`, builds a
prompt with the chunks as delimited untrusted context, calls the LLM and
stores the reply with its cited sources.

**Request:**
```json
{
  "content": "What is the refund window?",
  "topK": 5
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "reply": "The refund window is 30 days from purchase.",
    "sources": [
      {
        "chunk": "671a1b2c3d4e5f60718293c1",
        "document": "671a1b2c3d4e5f60718293a4",
        "score": 0.87,
        "chunkIndex": 3,
        "documentName": "policy.pdf"
      }
    ],
    "chunksUsed": 2,
    "message": { "_id": "671a1b2c3d4e5f60718293d2", "role": "assistant", "...": "..." },
    "sessionId": "671a1b2c3d4e5f60718293b5"
  },
  "message": "Reply generated successfully"
}
```

### POST /chat/sessions/:id/messages/stream
Same as above, but the reply streams token-by-token via Server-Sent Events.

**Response:** `Content-Type: text/event-stream`
```
data: {"token": "The refund"}

data: {"token": " window is"}

data: {"done": true, "sources": [...], "chunksUsed": 2}
```
On failure mid-stream: `data: {"error": "..."}`.

### GET /chat/sessions/:id/messages
Auth required. Full message history, oldest first. Optional `?limit` (default
100, max 500).

**Example:**
```bash
curl -X POST http://localhost:3001/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Refund policy Q&A"}'

curl -X POST http://localhost:3001/api/chat/sessions/<id>/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"What is the refund window?"}'
```

**Environment:**
- `GEMINI_CHAT_MODEL` — chat model (default `gemini-2.0-flash`)
- `GEMINI_MAX_OUTPUT_TOKENS` — reply length cap (default `1024`)
- `RAG_MAX_CONTEXT_TOKENS` — retrieved-context budget per prompt (default `6000`)

**Guardrails:** retrieved chunks are wrapped in `<retrieved-context>` blocks
and the system prompt instructs the model to treat them as untrusted data
that must never override instructions. A basic heuristic scan logs a warning
when a chunk contains common instruction-override phrasings.

---

## Workspace Endpoints (Weeks 7-8)

All workspace endpoints need a JWT. A workspace is owned by a Team plan
user; members share its documents and chat sessions, and all workspace
activity is metered against one shared usage pool at Team plan limits.
Workspace resources stop being accessible if the owner leaves the Team
plan.

### POST /workspaces
Create a workspace. Caller must be on the Team plan (403 otherwise).

**Request:** `{ "name": "Team Space" }`
**Response (201):** the workspace, with `members` (owner included, role
`owner`), the shared `usage` counters, and `memberCount`.

### GET /workspaces
List every workspace the caller belongs to, as owner or member.

### POST /workspaces/:id/invite
Invite a member by email. Owner only. The invitee must already have an
account: unregistered emails return 404, existing members 409.

**Request:** `{ "email": "teammate@example.com" }`

### DELETE /workspaces/:id/members/:userId
Remove a member. The owner can remove anyone; a member can remove
themselves (leave). The owner cannot be removed (400).

### GET /workspaces/:id/documents
List the workspace's shared documents. Members only (403 otherwise).

### GET /workspaces/:id/chat-sessions
List the workspace's shared chat sessions. Members only.

### Sharing documents and chats
- Upload with the optional `workspaceId` form field on `POST /documents`
  to share a document into a workspace (membership checked, workspace
  pool metered).
- Create a session with `{ "workspaceId": "..." }` on
  `POST /chat/sessions` to make it a shared session: members can read and
  post, retrieval covers the workspace's documents, and each turn charges
  the shared pool instead of the sender's personal quota.

---

## Admin Endpoints (Weeks 7-8)

All admin endpoints need a JWT whose user has the `admin` role. Admin is
bootstrapped from the `ADMIN_EMAILS` env var (applied at register/login);
there is no seeded admin account. Non-admins get 403.

### GET /admin/users
All users with plan, status, subscription status and usage.
Query: `?limit=` (default 100, max 500).

### GET /admin/workspaces
All workspaces with owner details and member counts.

### PATCH /admin/users/:id/suspend
Suspend or reactivate an account.
**Request:** `{ "suspended": true }` suspends, `{ "suspended": false }`
reactivates; omitting the field toggles the current status. Suspended
users cannot log in and their existing tokens are rejected. An admin
cannot suspend their own account.

### GET /admin/analytics
Platform analytics for the last 30 days:
```json
{
  "windowDays": 30,
  "messagesPerDay": [{ "date": "2026-10-24", "messages": 12 }],
  "dailyActiveUsers": [{ "date": "2026-10-24", "activeUsers": 3 }],
  "planDistribution": { "free": 40, "pro": 5, "team": 2 },
  "subscriptions": { "byStatus": { "none": 42, "active": 4, "canceled": 1 }, "active": 4, "cancelled": 1 }
}
```

---

## API Documentation (Swagger)

Interactive docs are served by the API itself:

- Swagger UI: `GET /api/docs`
- Raw OpenAPI 3 JSON: `GET /api/docs.json`

Every operation in the spec states whether it needs a JWT; the only
non-JWT write endpoint is `POST /api/webhooks/stripe`, which is
authenticated by the `Stripe-Signature` header instead.
