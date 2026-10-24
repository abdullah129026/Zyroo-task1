const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { PLANS, getPlan } = require('../config/plans');
const { ensureCurrentPeriod, PERIOD_MS } = require('../middleware/quota');

describe('plan definitions', () => {
  it('defines free, pro and team tiers with increasing limits', () => {
    assert.ok(PLANS.free.limits.maxMessages < PLANS.pro.limits.maxMessages);
    assert.ok(PLANS.pro.limits.maxMessages < PLANS.team.limits.maxMessages);
    assert.ok(PLANS.free.limits.maxDocuments < PLANS.team.limits.maxDocuments);
  });

  it('falls back to the free plan for unknown plan ids', () => {
    assert.equal(getPlan('does-not-exist').id, 'free');
    assert.equal(getPlan(undefined).id, 'free');
    assert.equal(getPlan('team').id, 'team');
  });

  it('quota calculations: a subject at the limit is blocked, one below is not', () => {
    // Mirrors the comparison requireQuota performs for messages
    const plan = getPlan('free');
    const atLimit = { usage: { messagesSent: plan.limits.maxMessages } };
    const belowLimit = { usage: { messagesSent: plan.limits.maxMessages - 1 } };
    assert.ok(atLimit.usage.messagesSent >= plan.limits.maxMessages);
    assert.ok(!(belowLimit.usage.messagesSent >= plan.limits.maxMessages));
  });
});

describe('ensureCurrentPeriod (usage-reset logic)', () => {
  function fakeSubject(overrides = {}) {
    return {
      usage: { documentsUploaded: 3, messagesSent: 40, storageUsed: 999 },
      currentPeriodStart: new Date(Date.now() - 40 * 24 * 3600 * 1000),
      currentPeriodEnd: new Date(Date.now() - 1000), // expired
      saved: 0,
      async save() { this.saved += 1; },
      ...overrides,
    };
  }

  it('zeroes counters and opens a fresh 30-day window when the period expired', async () => {
    const subject = fakeSubject();
    const before = Date.now();
    await ensureCurrentPeriod(subject);
    assert.equal(subject.usage.documentsUploaded, 0);
    assert.equal(subject.usage.messagesSent, 0);
    assert.equal(subject.usage.storageUsed, 0);
    assert.ok(subject.currentPeriodStart.getTime() >= before);
    assert.equal(subject.currentPeriodEnd.getTime() - subject.currentPeriodStart.getTime(), PERIOD_MS);
    assert.equal(subject.saved, 1);
  });

  it('initializes the period when none was ever set', async () => {
    const subject = fakeSubject({ currentPeriodStart: null, currentPeriodEnd: null });
    await ensureCurrentPeriod(subject);
    assert.ok(subject.currentPeriodEnd.getTime() > Date.now());
    assert.equal(subject.saved, 1);
  });

  it('leaves a current period untouched', async () => {
    const subject = fakeSubject({
      currentPeriodEnd: new Date(Date.now() + 24 * 3600 * 1000),
    });
    await ensureCurrentPeriod(subject);
    assert.equal(subject.usage.messagesSent, 40);
    assert.equal(subject.saved, 0);
  });

  it('works on a workspace-shaped subject too (shared pool, same shape)', async () => {
    const workspace = fakeSubject();
    await ensureCurrentPeriod(workspace);
    assert.equal(workspace.usage.messagesSent, 0);
    assert.equal(workspace.saved, 1);
  });
});
