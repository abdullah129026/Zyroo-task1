/**
 * OpenAPI 3 spec for the whole platform (Weeks 7-8 documentation).
 * Served as interactive Swagger UI at /api/docs and as JSON at
 * /api/docs.json. Every operation states its auth requirement in its
 * description: "JWT" means an Authorization: Bearer <token> header from
 * /api/auth/login; the Stripe webhook is the only non-JWT endpoint and
 * authenticates via the Stripe-Signature header instead.
 */

const ok = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
});
const err = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
});
const jwt = [{ bearerAuth: [] }];
const idParam = (name, description) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string' },
});
const jsonBody = (schema) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Cortex AI API',
    version: '2.0.0',
    description:
      'Document-grounded RAG chat platform: auth, document ingestion, semantic search, ' +
      'RAG chat with citations, Stripe billing with plan quotas, team workspaces, and ' +
      'admin analytics. Auth: JWT Bearer token unless an endpoint says otherwise.',
  },
  servers: [
    { url: '/api', description: 'Current host' },
    { url: 'http://localhost:3001/api', description: 'Local development' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Documents' },
    { name: 'Search' },
    { name: 'Chat' },
    { name: 'Billing' },
    { name: 'Workspaces' },
    { name: 'Admin' },
    { name: 'Webhooks' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer' },
          data: { type: 'object', nullable: true },
          message: { type: 'string' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer' },
          data: { type: 'object', nullable: true },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health',
        description: 'Auth: none.',
        responses: { 200: ok('Service and database status') },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Auth: none. Rate limited.',
        requestBody: jsonBody({
          type: 'object',
          required: ['name', 'email', 'password', 'passwordConfirm'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            passwordConfirm: { type: 'string' },
          },
        }),
        responses: { 201: ok('User registered'), 400: err('Validation failed'), 409: err('Email already registered') },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        description: 'Auth: none. Rate limited. Suspended accounts are rejected with 403.',
        requestBody: jsonBody({
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
        }),
        responses: { 200: ok('Login successful, returns user + token'), 401: err('Invalid credentials'), 403: err('Account suspended') },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user profile',
        description: 'Auth: JWT.',
        security: jwt,
        responses: { 200: ok('Current user'), 401: err('Missing or invalid token'), 403: err('Account suspended') },
      },
    },
    '/documents': {
      post: {
        tags: ['Documents'],
        summary: 'Upload a document (PDF, DOCX, TXT)',
        description:
          'Auth: JWT. Multipart form: file (required), workspaceId (optional form field; ' +
          'shares the document with that workspace and meters the workspace pool). ' +
          'Metered against the document quota.',
        security: jwt,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  workspaceId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: ok('Uploaded, processing started'), 400: err('No file or bad type'), 403: err('Quota reached or not a workspace member') },
      },
      get: {
        tags: ['Documents'],
        summary: "List the caller's documents",
        description: 'Auth: JWT.',
        security: jwt,
        responses: { 200: ok('Document list') },
      },
    },
    '/documents/stats': {
      get: {
        tags: ['Documents'],
        summary: 'Document processing statistics',
        description: 'Auth: JWT.',
        security: jwt,
        responses: { 200: ok('Totals by status, chunks and size') },
      },
    },
    '/documents/{id}': {
      get: {
        tags: ['Documents'],
        summary: 'Get one document with its chunks',
        description: 'Auth: JWT. Owner, or any member of the workspace the document is shared into.',
        security: jwt,
        parameters: [idParam('id', 'Document id')],
        responses: { 200: ok('Document with chunks'), 404: err('Not found or not accessible') },
      },
      delete: {
        tags: ['Documents'],
        summary: 'Delete a document and its chunks',
        description: 'Auth: JWT. Document owner, or the owner of the workspace it is shared into.',
        security: jwt,
        parameters: [idParam('id', 'Document id')],
        responses: { 200: ok('Deleted'), 404: err('Not found or not permitted') },
      },
    },
    '/search': {
      post: {
        tags: ['Search'],
        summary: 'Semantic search over the caller\'s documents',
        description: 'Auth: JWT. Rate limited (LLM-backed). Metered against the message quota. Query max 1000 chars.',
        security: jwt,
        requestBody: jsonBody({
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', maxLength: 1000 },
            documentId: { type: 'string' },
            topK: { type: 'integer', default: 5 },
          },
        }),
        responses: { 200: ok('Ranked chunks with similarity scores'), 400: err('Bad query'), 403: err('Message quota reached') },
      },
    },
    '/search/retry/{chunkId}': {
      post: {
        tags: ['Search'],
        summary: 'Retry a failed chunk embedding',
        description: 'Auth: JWT.',
        security: jwt,
        parameters: [idParam('chunkId', 'Chunk id')],
        responses: { 200: ok('Retry queued or completed'), 404: err('Chunk not found') },
      },
    },
    '/chat/sessions': {
      post: {
        tags: ['Chat'],
        summary: 'Create a chat session',
        description:
          'Auth: JWT. Optional documentIds scope retrieval to those documents; optional ' +
          'workspaceId makes it a shared workspace session (members can access it, the ' +
          'workspace pool is metered).',
        security: jwt,
        requestBody: jsonBody({
          type: 'object',
          properties: {
            title: { type: 'string' },
            documentIds: { type: 'array', items: { type: 'string' } },
            workspaceId: { type: 'string' },
          },
        }),
        responses: { 201: ok('Session created'), 400: err('Bad ids'), 404: err('Document or workspace not found') },
      },
      get: {
        tags: ['Chat'],
        summary: "List the caller's chat sessions (own + their workspaces')",
        description: 'Auth: JWT.',
        security: jwt,
        responses: { 200: ok('Session list') },
      },
    },
    '/chat/sessions/{id}': {
      delete: {
        tags: ['Chat'],
        summary: 'Delete a session and its messages',
        description: 'Auth: JWT. Session owner, or the owner of its workspace.',
        security: jwt,
        parameters: [idParam('id', 'Session id')],
        responses: { 200: ok('Deleted'), 404: err('Not found or not permitted') },
      },
    },
    '/chat/sessions/{id}/messages': {
      post: {
        tags: ['Chat'],
        summary: 'Send a message, get the RAG reply with citations',
        description:
          'Auth: JWT. Rate limited (LLM-backed) and metered against the message quota ' +
          '(workspace pool for workspace sessions). Message max 4000 chars. Retrieved ' +
          'document text is treated as untrusted data, never as instructions.',
        security: jwt,
        parameters: [idParam('id', 'Session id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['content'],
          properties: { content: { type: 'string', maxLength: 4000 }, topK: { type: 'integer', default: 5 } },
        }),
        responses: { 200: ok('Reply with sources'), 400: err('Empty or over-long message'), 403: err('Message quota reached'), 404: err('Session not found') },
      },
      get: {
        tags: ['Chat'],
        summary: 'Message history of a session',
        description: 'Auth: JWT. Session owner or a member of its workspace.',
        security: jwt,
        parameters: [
          idParam('id', 'Session id'),
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
        ],
        responses: { 200: ok('Messages in order'), 404: err('Session not found') },
      },
    },
    '/chat/sessions/{id}/messages/stream': {
      post: {
        tags: ['Chat'],
        summary: 'Send a message, stream the reply via SSE',
        description:
          'Auth: JWT. Same metering and limits as the non-streaming endpoint. Events: ' +
          'data: {"token": "..."} then data: {"done": true, "sources": [...], "chunksUsed": n}.',
        security: jwt,
        parameters: [idParam('id', 'Session id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['content'],
          properties: { content: { type: 'string', maxLength: 4000 }, topK: { type: 'integer', default: 5 } },
        }),
        responses: { 200: ok('SSE stream'), 400: err('Empty or over-long message'), 403: err('Message quota reached'), 404: err('Session not found') },
      },
    },
    '/billing/plans': {
      get: {
        tags: ['Billing'],
        summary: 'Public plan catalog with limits',
        description: 'Auth: none.',
        responses: { 200: ok('Free, Pro and Team plans') },
      },
    },
    '/billing/me': {
      get: {
        tags: ['Billing'],
        summary: 'Current plan, subscription status and usage',
        description: 'Auth: JWT.',
        security: jwt,
        responses: { 200: ok('Billing state') },
      },
    },
    '/billing/checkout': {
      post: {
        tags: ['Billing'],
        summary: 'Create a Stripe Checkout session for an upgrade',
        description: 'Auth: JWT.',
        security: jwt,
        requestBody: jsonBody({
          type: 'object',
          required: ['planId'],
          properties: { planId: { type: 'string', enum: ['pro', 'team'] } },
        }),
        responses: { 200: ok('Checkout URL'), 400: err('Bad plan') },
      },
    },
    '/billing/cancel': {
      post: {
        tags: ['Billing'],
        summary: 'Cancel the active subscription',
        description: 'Auth: JWT.',
        security: jwt,
        responses: { 200: ok('Subscription cancelled'), 400: err('No active subscription') },
      },
    },
    '/workspaces': {
      post: {
        tags: ['Workspaces'],
        summary: 'Create a workspace',
        description: 'Auth: JWT. Team plan owners only; the shared quota pool uses Team limits.',
        security: jwt,
        requestBody: jsonBody({
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', maxLength: 80 } },
        }),
        responses: { 201: ok('Workspace created'), 400: err('Name required'), 403: err('Team plan required') },
      },
      get: {
        tags: ['Workspaces'],
        summary: 'List workspaces the caller belongs to',
        description: 'Auth: JWT.',
        security: jwt,
        responses: { 200: ok('Workspace list with member counts and shared usage') },
      },
    },
    '/workspaces/{id}/invite': {
      post: {
        tags: ['Workspaces'],
        summary: 'Invite a member by email',
        description: 'Auth: JWT, workspace owner only. The invitee must already have an account (404 otherwise).',
        security: jwt,
        parameters: [idParam('id', 'Workspace id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        }),
        responses: { 200: ok('Member added'), 403: err('Not the owner'), 404: err('No registered user with that email'), 409: err('Already a member') },
      },
    },
    '/workspaces/{id}/members/{userId}': {
      delete: {
        tags: ['Workspaces'],
        summary: 'Remove a member',
        description: 'Auth: JWT. The workspace owner can remove anyone; a member can remove themselves. The owner cannot be removed.',
        security: jwt,
        parameters: [idParam('id', 'Workspace id'), idParam('userId', 'Member user id')],
        responses: { 200: ok('Member removed'), 400: err('Cannot remove the owner'), 403: err('Not permitted'), 404: err('Not a member') },
      },
    },
    '/workspaces/{id}/documents': {
      get: {
        tags: ['Workspaces'],
        summary: "List the workspace's shared documents",
        description: 'Auth: JWT, members only, and only while the owner is on the Team plan.',
        security: jwt,
        parameters: [idParam('id', 'Workspace id')],
        responses: { 200: ok('Document list'), 403: err('Not a member, or workspace inactive') },
      },
    },
    '/workspaces/{id}/chat-sessions': {
      get: {
        tags: ['Workspaces'],
        summary: "List the workspace's shared chat sessions",
        description: 'Auth: JWT, members only.',
        security: jwt,
        parameters: [idParam('id', 'Workspace id')],
        responses: { 200: ok('Session list'), 403: err('Not a member, or workspace inactive') },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users (admin only)',
        description: 'Auth: JWT with the admin role. Includes plan, status and usage per user.',
        security: jwt,
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } }],
        responses: { 200: ok('User list'), 403: err('Admin access required') },
      },
    },
    '/admin/workspaces': {
      get: {
        tags: ['Admin'],
        summary: 'List all workspaces (admin only)',
        description: 'Auth: JWT with the admin role.',
        security: jwt,
        responses: { 200: ok('Workspace list with owners and member counts'), 403: err('Admin access required') },
      },
    },
    '/admin/users/{id}/suspend': {
      patch: {
        tags: ['Admin'],
        summary: 'Suspend or reactivate a user (admin only)',
        description:
          'Auth: JWT with the admin role. Body { suspended: true } suspends, ' +
          '{ suspended: false } reactivates; omitting it toggles. Suspended users ' +
          'cannot log in and their tokens are rejected. An admin cannot suspend themselves.',
        security: jwt,
        parameters: [idParam('id', 'User id')],
        requestBody: jsonBody({
          type: 'object',
          properties: { suspended: { type: 'boolean' } },
        }),
        responses: { 200: ok('Updated user'), 400: err('Cannot suspend yourself'), 403: err('Admin access required'), 404: err('User not found') },
      },
    },
    '/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Platform analytics, last 30 days (admin only)',
        description:
          'Auth: JWT with the admin role. Returns daily active users, messages sent per day, ' +
          'plan distribution, and active vs cancelled subscription counts.',
        security: jwt,
        responses: { 200: ok('Analytics'), 403: err('Admin access required') },
      },
    },
    '/webhooks/stripe': {
      post: {
        tags: ['Webhooks'],
        summary: 'Stripe webhook receiver',
        description:
          'Auth: Stripe-Signature header, verified against STRIPE_WEBHOOK_SECRET over the raw ' +
          'request body (no JWT). Handles checkout.session.completed, ' +
          'customer.subscription.updated and customer.subscription.deleted.',
        parameters: [
          { name: 'stripe-signature', in: 'header', required: true, schema: { type: 'string' }, description: 'Stripe signature header' },
        ],
        responses: { 200: ok('Event processed'), 400: err('Signature verification failed') },
      },
    },
  },
};

module.exports = spec;
