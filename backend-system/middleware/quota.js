const fs = require('fs');
const User = require('../models/User');
const { getPlan } = require('../config/plans');

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30-day billing window

/**
 * Roll the billing period forward when it has expired, zeroing counters.
 * Called from the quota check so a late/missed cron run never wrongly
 * blocks a user whose period already ended.
 */
async function ensureCurrentPeriod(user) {
  const now = new Date();
  if (!user.currentPeriodEnd || user.currentPeriodEnd <= now) {
    user.usage.documentsUploaded = 0;
    user.usage.messagesSent = 0;
    user.usage.storageUsed = 0;
    user.currentPeriodStart = now;
    user.currentPeriodEnd = new Date(now.getTime() + PERIOD_MS);
    await user.save();
  }
  return user;
}

/**
 * Usage quota middleware.
 *
 * requireQuota('documents') — blocks uploads once the plan's document or
 *   storage limit for the current period is reached. If multer already
 *   wrote the file, it is removed before rejecting.
 * requireQuota('messages') — blocks search/chat once the plan's message
 *   limit for the current period is reached.
 *
 * Attaches the resolved plan to req.plan for downstream handlers.
 */
function requireQuota(kind) {
  return async (req, res, next) => {
    try {
      const { userId } = req.user;

      let user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          statusCode: 401,
          message: 'User not found',
        });
      }

      user = await ensureCurrentPeriod(user);
      const plan = getPlan(user.plan);
      req.plan = plan;

      if (kind === 'documents') {
        if (user.usage.documentsUploaded >= plan.limits.maxDocuments) {
          if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(403).json({
            statusCode: 403,
            message: `Document limit reached on the ${plan.name} plan (${plan.limits.maxDocuments} per billing period). Upgrade to upload more.`,
          });
        }

        const incomingBytes = req.file ? req.file.size : 0;
        if (user.usage.storageUsed + incomingBytes > plan.limits.maxStorageBytes) {
          if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(403).json({
            statusCode: 403,
            message: `Storage limit reached on the ${plan.name} plan. Upgrade for more space.`,
          });
        }
      }

      if (kind === 'messages') {
        if (user.usage.messagesSent >= plan.limits.maxMessages) {
          return res.status(403).json({
            statusCode: 403,
            message: `Message limit reached on the ${plan.name} plan (${plan.limits.maxMessages} per billing period). Upgrade to keep chatting.`,
          });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireQuota, ensureCurrentPeriod };
