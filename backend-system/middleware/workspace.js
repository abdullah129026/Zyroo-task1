const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

/**
 * Workspace & admin access control (Weeks 7-8).
 *
 * requireWorkspaceMember / requireWorkspaceOwner load the workspace from
 * req.params.id once and attach it as req.workspace, so controllers and
 * the quota middleware never re-fetch it.
 */

async function loadWorkspace(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ statusCode: 404, message: 'Workspace not found' });
    return null;
  }
  const workspace = await Workspace.findById(id);
  if (!workspace) {
    res.status(404).json({ statusCode: 404, message: 'Workspace not found' });
    return null;
  }
  return workspace;
}

/**
 * A workspace only works while its owner's plan permits it: the shared
 * quota is drawn from the Team plan, so if the owner drops off Team the
 * workspace stops being accessible until they are back on it.
 */
async function ownerPlanPermits(workspace) {
  const owner = await User.findById(workspace.owner).select('plan');
  return Boolean(owner) && owner.plan === 'team';
}

async function requireWorkspaceMember(req, res, next) {
  try {
    const workspace = await loadWorkspace(req, res);
    if (!workspace) return;
    if (!workspace.memberOf(req.user.userId)) {
      return res.status(403).json({
        statusCode: 403,
        message: 'You are not a member of this workspace',
      });
    }
    if (!(await ownerPlanPermits(workspace))) {
      return res.status(403).json({
        statusCode: 403,
        message: 'The workspace owner is not on the Team plan, so this workspace is not active',
      });
    }
    req.workspace = workspace;
    next();
  } catch (err) {
    next(err);
  }
}

async function requireWorkspaceOwner(req, res, next) {
  try {
    const workspace = await loadWorkspace(req, res);
    if (!workspace) return;
    if (!workspace.isOwner(req.user.userId)) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Only the workspace owner can do this',
      });
    }
    req.workspace = workspace;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Admin gate for /api/admin routes. Role lives on the user record (JWTs
 * stay minimal), so this does one lookup per admin request.
 */
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select('role status');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        statusCode: 403,
        message: 'Admin access required',
      });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Upload scoping: when a document upload carries a workspaceId form field,
 * resolve the workspace and verify membership BEFORE the quota check, and
 * attach it as req.workspace. The quota middleware then meters the
 * workspace's shared pool instead of the uploader's personal quota.
 * Runs after multer, so req.body is populated.
 */
async function resolveUploadWorkspace(req, res, next) {
  try {
    const workspaceId = req.body && req.body.workspaceId;
    if (!workspaceId) return next();

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'workspaceId is not a valid id',
      });
    }
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Workspace not found',
      });
    }
    if (!workspace.memberOf(req.user.userId)) {
      return res.status(403).json({
        statusCode: 403,
        message: 'You are not a member of this workspace',
      });
    }
    if (!(await ownerPlanPermits(workspace))) {
      return res.status(403).json({
        statusCode: 403,
        message: 'The workspace owner is not on the Team plan, so this workspace is not active',
      });
    }
    req.workspace = workspace;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireWorkspaceMember,
  requireWorkspaceOwner,
  requireAdmin,
  resolveUploadWorkspace,
};
