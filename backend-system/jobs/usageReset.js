const cron = require('node-cron');
const User = require('../models/User');
const Workspace = require('../models/Workspace');

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30-day billing window

/**
 * The update pipeline that rolls one billing period forward: zero the
 * usage counters and open a fresh 30-day window starting at `now`.
 * Shared by the nightly job for both quota subjects (users and
 * workspace pools), and exported for unit tests.
 */
function buildPeriodResetUpdate(now) {
  return [
    {
      $set: {
        'usage.documentsUploaded': 0,
        'usage.messagesSent': 0,
        'usage.storageUsed': 0,
        currentPeriodStart: now,
        currentPeriodEnd: { $add: [now, PERIOD_MS] },
      },
    },
  ];
}

/**
 * Nightly job: roll every expired billing period forward and zero the
 * usage counters. Subjects past their period end get a fresh window even
 * if the quota middleware's lazy rollover already handled them; the two
 * paths write the same shape, so they never fight.
 */
function startUsageResetJob() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const filter = { currentPeriodEnd: { $lte: now } };
      const [users, workspaces] = await Promise.all([
        User.updateMany(filter, buildPeriodResetUpdate(now)),
        Workspace.updateMany(filter, buildPeriodResetUpdate(now)),
      ]);
      console.log(
        `[CRON] Usage reset: ${users.modifiedCount} user(s), ${workspaces.modifiedCount} workspace(s) rolled to a new billing period`
      );
    } catch (err) {
      console.error('[CRON] Usage reset failed:', err);
    }
  });

  console.log('[CRON] Usage reset job scheduled (daily at midnight)');
}

module.exports = { startUsageResetJob, buildPeriodResetUpdate, PERIOD_MS };
