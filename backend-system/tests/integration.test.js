/**
 * End-to-end integration tests (Weeks 7-8).
 *
 * Boots the real Express app against an in-memory MongoDB and walks the
 * highest-risk flows:
 *   register -> upload -> embedded -> chat question -> cited answer
 *   free-plan user blocked at the message quota
 *   team workspaces: create gate, invite, shared docs/chat, removal
 *   admin: role gate, user list, analytics, suspend/reactivate
 *   Stripe webhook: forged signature rejected
 *
 * Gemini is stubbed at the module boundary (deterministic bag-of-words
 * embeddings, canned chat reply) so the suite needs no API key and no
 * network. Stubbing happens BEFORE the app is required, because the
 * controllers capture these functions at load time.
 */
process.env.JWT_SECRET = 'integration-test-secret';
process.env.DISABLE_RATE_LIMITS = 'true';
process.env.ADMIN_EMAILS = 'admin@test.dev';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy';

const fs = require('fs');
const os = require('os');
const path = require('path');
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'zyroo-test-uploads-'));

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

// --- Gemini stubs (must land before require('../app')) -------------------
const embeddings = require('../services/embeddings');
embeddings.generateEmbedding = async (text) => {
  const vector = new Array(64).fill(0);
  for (const word of String(text).toLowerCase().split(/[^a-z0-9]+/)) {
    if (!word) continue;
    let hash = 0;
    for (const ch of word) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    vector[hash % 64] += 1;
  }
  const norm = Math.hypot(...vector) || 1;
  return vector.map((v) => v / norm);
};

const llm = require('../services/llm');
llm.generateChatCompletion = async () =>
  'According to the document, the refund window is 30 days from purchase.';
llm.streamChatCompletion = async (prompt, onToken) => {
  const text = 'According to the document, the refund window is 30 days from purchase.';
  await onToken(text);
  return text;
};

const app = require('../app');
const User = require('../models/User');
const Workspace = require('../models/Workspace');

const DOC_TEXT = [
  'The refund policy allows returns within 30 days of purchase.',
  'Customers must keep the original receipt to get a refund.',
  'Refunds are issued to the original payment method within five business days.',
  'Digital products can be refunded within 14 days if they were not downloaded.',
].join(' ');

let mongo;
const accounts = {}; // name -> { id, email, token }

async function registerAndLogin(name, email) {
  const password = 'secret123';
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password, passwordConfirm: password });
  assert.equal(reg.status, 201, `register ${email}: ${JSON.stringify(reg.body)}`);
  const login = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(login.status, 200, `login ${email}: ${JSON.stringify(login.body)}`);
  accounts[name] = { id: reg.body.data.user._id, email, token: login.body.data.token };
  return accounts[name];
}

async function uploadAndWaitReady(token, filename, workspaceId) {
  let req = request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${token}`);
  if (workspaceId) req = req.field('workspaceId', workspaceId);
  const res = await req.attach('file', Buffer.from(DOC_TEXT), filename);
  assert.equal(res.status, 201, `upload: ${JSON.stringify(res.body)}`);
  const docId = res.body.data.id;

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const got = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(got.status, 200);
    if (got.body.data.status === 'ready') return docId;
    if (got.body.data.status === 'failed') throw new Error('document processing failed');
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('document did not become ready in time');
}

describe('integration: full platform flows', { timeout: 180000 }, () => {
  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('register -> upload -> embedded -> ask -> cited answer', async () => {
    const owner = await registerAndLogin('Owner', 'owner@test.dev');
    const docId = await uploadAndWaitReady(owner.token, 'policy.txt');

    const session = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ documentIds: [docId] });
    assert.equal(session.status, 201);
    const sessionId = session.body.data._id;

    const chat = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ content: 'What is the refund window?' });
    assert.equal(chat.status, 200, JSON.stringify(chat.body));
    assert.match(chat.body.data.reply, /refund/i);
    assert.ok(chat.body.data.chunksUsed >= 1, 'expected at least one chunk used');
    assert.ok(chat.body.data.sources.length >= 1, 'expected a cited source');
    assert.equal(String(chat.body.data.sources[0].document), String(docId));
  });

  it('rejects an over-long chat message', async () => {
    const owner = accounts.Owner;
    const session = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({});
    const chat = await request(app)
      .post(`/api/chat/sessions/${session.body.data._id}/messages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ content: 'x'.repeat(4001) });
    assert.equal(chat.status, 400);
  });

  it('blocks a free-plan user once the message quota is hit', async () => {
    const free = await registerAndLogin('Free', 'free@test.dev');
    // Simulate a period already in progress with the quota exhausted,
    // so the lazy period rollover does not reset the counters
    await User.updateOne(
      { _id: free.id },
      {
        $set: {
          'usage.messagesSent': 50, // free plan limit
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 24 * 3600 * 1000),
        },
      }
    );
    const session = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${free.token}`)
      .send({});
    assert.equal(session.status, 201);
    const chat = await request(app)
      .post(`/api/chat/sessions/${session.body.data._id}/messages`)
      .set('Authorization', `Bearer ${free.token}`)
      .send({ content: 'hello?' });
    assert.equal(chat.status, 403);
    assert.match(chat.body.message, /Message limit reached/);
  });

  it('workspaces: team gate, invite, shared docs and chat, removal', async () => {
    const owner = accounts.Owner;
    const member = await registerAndLogin('Member', 'member@test.dev');
    const outsider = await registerAndLogin('Outsider', 'outsider@test.dev');

    // Free plan cannot create a workspace
    const denied = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Team Space' });
    assert.equal(denied.status, 403);

    await User.updateOne({ _id: owner.id }, { $set: { plan: 'team' } });
    const created = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Team Space' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const workspaceId = created.body.data._id;

    // Invite: unregistered email 404, registered member 200, duplicate 409
    const ghost = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'ghost@test.dev' });
    assert.equal(ghost.status, 404);

    const invited = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'member@test.dev' });
    assert.equal(invited.status, 200);
    assert.equal(invited.body.data.memberCount, 2);

    const dupe = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'member@test.dev' });
    assert.equal(dupe.status, 409);

    // Member cannot invite (owner-only)
    const memberInvite = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ email: 'outsider@test.dev' });
    assert.equal(memberInvite.status, 403);

    // Shared document: member uploads into the workspace
    const wsDocId = await uploadAndWaitReady(member.token, 'shared-policy.txt', workspaceId);
    const ownerList = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${owner.token}`);
    assert.equal(ownerList.status, 200);
    assert.ok(ownerList.body.data.some((d) => String(d._id) === String(wsDocId)));

    // Outsider is shut out of workspace resources
    const outsiderList = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${outsider.token}`);
    assert.equal(outsiderList.status, 403);

    // Shared chat: member creates a workspace session and asks a question
    const wsSession = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ workspaceId, documentIds: [wsDocId] });
    assert.equal(wsSession.status, 201, JSON.stringify(wsSession.body));
    const wsSessionId = wsSession.body.data._id;

    const wsChat = await request(app)
      .post(`/api/chat/sessions/${wsSessionId}/messages`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ content: 'What is the refund window?' });
    assert.equal(wsChat.status, 200, JSON.stringify(wsChat.body));
    assert.ok(wsChat.body.data.sources.length >= 1);

    // The turn was charged to the shared workspace pool, not the member
    const workspace = await Workspace.findById(workspaceId).lean();
    assert.equal(workspace.usage.messagesSent, 1);
    assert.equal(workspace.usage.documentsUploaded, 1);

    // Outsider cannot post into the workspace session
    const outsiderChat = await request(app)
      .post(`/api/chat/sessions/${wsSessionId}/messages`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ content: 'let me in' });
    assert.equal(outsiderChat.status, 404);

    // Removal: owner removes the member, access ends immediately
    const removed = await request(app)
      .delete(`/api/workspaces/${workspaceId}/members/${member.id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    assert.equal(removed.status, 200);
    const afterRemoval = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${member.token}`);
    assert.equal(afterRemoval.status, 403);
  });

  it('admin: role gate, user list, analytics, suspend and reactivate', async () => {
    const admin = await registerAndLogin('Admin', 'admin@test.dev');
    const owner = accounts.Owner;
    const member = accounts.Member;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${admin.token}`);
    assert.equal(me.body.data.user.role, 'admin', 'ADMIN_EMAILS bootstrap should promote the admin');

    // Non-admin is refused
    const forbidden = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${owner.token}`);
    assert.equal(forbidden.status, 403);

    const users = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${admin.token}`);
    assert.equal(users.status, 200);
    assert.ok(users.body.data.total >= 4);

    const analytics = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${admin.token}`);
    assert.equal(analytics.status, 200, JSON.stringify(analytics.body));
    assert.equal(analytics.body.data.planDistribution.team, 1);
    const totalMessages = analytics.body.data.messagesPerDay.reduce((s, d) => s + d.messages, 0);
    assert.ok(totalMessages >= 2, `expected chat turns in analytics, got ${totalMessages}`);
    assert.equal(analytics.body.data.subscriptions.active, 0);
    assert.equal(analytics.body.data.subscriptions.cancelled, 0);

    // Suspend the member: login and existing tokens both stop working
    const suspended = await request(app)
      .patch(`/api/admin/users/${member.id}/suspend`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ suspended: true });
    assert.equal(suspended.status, 200);
    assert.equal(suspended.body.data.user.status, 'suspended');

    const loginBlocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@test.dev', password: 'secret123' });
    assert.equal(loginBlocked.status, 403);

    const tokenBlocked = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${member.token}`);
    assert.equal(tokenBlocked.status, 403);

    // Reactivate: login works again
    const reactivated = await request(app)
      .patch(`/api/admin/users/${member.id}/suspend`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ suspended: false });
    assert.equal(reactivated.body.data.user.status, 'active');
    const loginOk = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@test.dev', password: 'secret123' });
    assert.equal(loginOk.status, 200);
  });

  it('rejects a Stripe webhook with a forged signature', async () => {
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=forged')
      .send('{"type":"checkout.session.completed"}');
    assert.equal(res.status, 400);
  });
});
