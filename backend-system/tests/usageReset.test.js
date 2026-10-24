const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { buildPeriodResetUpdate, PERIOD_MS } = require('../jobs/usageReset');

describe('buildPeriodResetUpdate (nightly usage reset)', () => {
  it('builds a pipeline update that zeroes every usage counter', () => {
    const now = new Date('2026-10-24T00:00:00.000Z');
    const update = buildPeriodResetUpdate(now);
    assert.ok(Array.isArray(update));
    const set = update[0].$set;
    assert.equal(set['usage.documentsUploaded'], 0);
    assert.equal(set['usage.messagesSent'], 0);
    assert.equal(set['usage.storageUsed'], 0);
  });

  it('opens the new period at `now` and ends it one PERIOD_MS later', () => {
    const now = new Date('2026-10-24T00:00:00.000Z');
    const set = buildPeriodResetUpdate(now)[0].$set;
    assert.equal(set.currentPeriodStart, now);
    assert.deepEqual(set.currentPeriodEnd, { $add: [now, PERIOD_MS] });
    assert.equal(PERIOD_MS, 30 * 24 * 60 * 60 * 1000);
  });
});
