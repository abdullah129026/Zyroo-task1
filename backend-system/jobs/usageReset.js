const cron = require('node-cron');
const User = require('../models/User');

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30-day billing window

/**
 * Nightly job: roll every expired billing period forward and zero the
 * usage counters. Users past their period end get a fresh window even if
 * the quota middleware's lazy rollover already handled them — the two
 * paths write the same shape, so they never fight.
 */
function startUsageResetJob() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const result = await User.updateMany(
        { currentPeriodEnd: { $lte: now } },
        [
          {
            $set: {
              'usage.documentsUploaded': 0,
              'usage.messagesSent': 0,
              'usage.storageUsed': 0,
              currentPeriodStart: now,
              currentPeriodEnd: { $add: [now, PERIOD_MS] },
            },
          },
        ]
      );
      console.log(`[CRON] Usage reset: ${result.modifiedCount} user(s) rolled to a new billing period`);
    } catch (err) {
      console.error('[CRON] Usage reset failed:', err);
    }
  });

  console.log('[CRON] Usage reset job scheduled (daily at midnight)');
}

module.exports = { startUsageResetJob };
