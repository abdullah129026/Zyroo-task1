const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const ChatSession = require('../models/ChatSession');
const { getPlan } = require('../config/plans');

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30-day billing window

/**
 * Roll the billing period forward when it has expired, zeroing counters.
 * Called from the quota check so a late/missed cron run never wrongly
 * blocks a user whose period already ended.
 *
 * Works on any "quota subject" with the shared shape (usage counters +
 * currentPeriodStart/End): a User, or a Workspace's shared pool.
 */
async function ensureCurrentPeriod(subject) {
  const now = new Date();
  if (!subject.currentPeriodEnd || subject.currentPeriodEnd <= now) {
    subject.usage.documentsUploaded = 0;
    subject.usage.messagesSent = 0;
    subject.usage.storageUsed = 0;
    subject.currentPeriodStart = now;
    subject.currentPeriodEnd = new Date(now.getTime() + PERIOD_MS);
    await subject.save();
  }
  return subject;
}

/**
 * Resolve which quota pool a request draws from.
 *
 * Personal by default: the requesting user's own plan and counters.
 * Workspace pool (Team plan limits) when:
 *  - a document upload was scoped to a workspace (req.workspace, set by
 *    resolveUploadWorkspace), or
 *  - a chat message targets a workspace-scoped session.
 *
 * @returns {Promise<{subject: object, plan: object}|null>} null when the
 *   personal user record does not exist.
 */
async function resolveQuotaSubject(req, kind) {
  if (kind === 'documents' && req.workspace) {
    const workspace = await ensureCurrentPeriod(req.workspace);
    return { subject: workspace, plan: getPlan('team') };
  }

  if (kind === 'messages' && req.params && req.params.id) {
    const sessionId = req.params.id;
    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      const session = await ChatSession.findById(sessionId).select('workspace');
      if (session && session.workspace) {
        const workspace = await Workspace.findById(session.workspace);
        if (workspace) {
          const rolled = await ensureCurrentPeriod(workspace);
          return { subject: rolled, plan: getPlan('team') };
        }
      }
    }
  }

  const user = await User.findById(req.user.userId);
  if (!user) return null;
  const rolled = await ensureCurrentPeriod(user);
  return { subject: rolled, plan: getPlan(rolled.plan) };
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
      const resolved = await resolveQuotaSubject(req, kind);
      if (!resolved) {
        return res.status(401).json({
          statusCode: 401,
          message: 'User not found',
        });
      }
      const { subject, plan } = resolved;
      req.plan = plan;

      if (kind === 'documents') {
        if (subject.usage.documentsUploaded >= plan.limits.maxDocuments) {
          if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(403).json({
            statusCode: 403,
            message: `Document limit reached on the ${plan.name} plan (${plan.limits.maxDocuments} per billing period). Upgrade to upload more.`,
          });
        }

        const incomingBytes = req.file ? req.file.size : 0;
        if (subject.usage.storageUsed + incomingBytes > plan.limits.maxStorageBytes) {
          if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(403).json({
            statusCode: 403,
            message: `Storage limit reached on the ${plan.name} plan. Upgrade for more space.`,
          });
        }
      }

      if (kind === 'messages') {
        if (subject.usage.messagesSent >= plan.limits.maxMessages) {
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

module.exports = { requireQuota, ensureCurrentPeriod, PERIOD_MS };
