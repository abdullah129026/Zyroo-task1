const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Document = require('../models/Document');
const ChatSession = require('../models/ChatSession');

/**
 * Team workspaces (Weeks 7-8).
 * Membership/owner enforcement lives in middleware/workspace.js; by the
 * time these handlers run (except create/list), req.workspace is loaded
 * and the caller is known to be a member (or the owner, where required).
 */

function serializeWorkspace(workspace) {
  const obj = workspace.toObject();
  obj.memberCount = workspace.members.length;
  return obj;
}

/**
 * Create a workspace. Only Team plan users can own one: the shared quota
 * pool is drawn from the Team plan.
 * POST /api/workspaces
 */
async function createWorkspace(req, res) {
  try {
    const { userId } = req.user;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ statusCode: 400, message: 'Workspace name is required' });
    }

    const owner = await User.findById(userId);
    if (!owner) {
      return res.status(401).json({ statusCode: 401, message: 'User not found' });
    }
    if (owner.plan !== 'team') {
      return res.status(403).json({
        statusCode: 403,
        message: 'Workspaces require the Team plan. Upgrade to create one.',
      });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      owner: userId,
      members: [{ user: userId, role: 'owner' }],
    });

    return res.status(201).json({
      statusCode: 201,
      data: serializeWorkspace(workspace),
      message: 'Workspace created successfully',
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to create workspace', error: error.message });
  }
}

/**
 * List the workspaces the caller belongs to (as owner or member).
 * GET /api/workspaces
 */
async function listMyWorkspaces(req, res) {
  try {
    const { userId } = req.user;
    const workspaces = await Workspace.find({ 'members.user': userId })
      .sort({ updatedAt: -1 })
      .lean();
    return res.status(200).json({
      statusCode: 200,
      data: { workspaces: workspaces.map((w) => ({ ...w, memberCount: w.members.length })), total: workspaces.length },
      message: 'Workspaces retrieved successfully',
    });
  } catch (error) {
    console.error('List workspaces error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to list workspaces', error: error.message });
  }
}

/**
 * Invite a member by email (owner only). The invitee must already have
 * an account: there is no outbound email system, so inviting an
 * unregistered address returns 404 instead of a dead pending invite.
 * POST /api/workspaces/:id/invite
 */
async function inviteMember(req, res) {
  try {
    const workspace = req.workspace;
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ statusCode: 400, message: 'An email is required' });
    }

    const invitee = await User.findOne({ email: email.trim().toLowerCase() });
    if (!invitee) {
      return res.status(404).json({
        statusCode: 404,
        message: 'No registered user with that email. They need an account before they can be invited.',
      });
    }

    if (workspace.memberOf(invitee._id)) {
      return res.status(409).json({ statusCode: 409, message: 'That user is already a member of this workspace' });
    }

    workspace.members.push({ user: invitee._id, role: 'member' });
    await workspace.save();

    return res.status(200).json({
      statusCode: 200,
      data: serializeWorkspace(workspace),
      message: 'Member invited successfully',
    });
  } catch (error) {
    console.error('Invite member error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to invite member', error: error.message });
  }
}

/**
 * Remove a member (owner, or a member removing themselves = leaving).
 * The owner can never be removed; transfer of ownership is out of scope.
 * DELETE /api/workspaces/:id/members/:userId
 */
async function removeMember(req, res) {
  try {
    const workspace = req.workspace;
    const { userId: targetId } = req.params;
    const requesterId = req.user.userId;

    if (workspace.isOwner(targetId)) {
      return res.status(400).json({ statusCode: 400, message: 'The workspace owner cannot be removed' });
    }

    const isSelf = targetId.toString() === requesterId.toString();
    if (!workspace.isOwner(requesterId) && !isSelf) {
      return res.status(403).json({ statusCode: 403, message: 'Only the workspace owner can remove other members' });
    }

    if (!workspace.memberOf(targetId)) {
      return res.status(404).json({ statusCode: 404, message: 'That user is not a member of this workspace' });
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== targetId.toString());
    await workspace.save();

    return res.status(200).json({
      statusCode: 200,
      data: serializeWorkspace(workspace),
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to remove member', error: error.message });
  }
}

/**
 * Shared documents of the workspace (members only).
 * GET /api/workspaces/:id/documents
 */
async function listWorkspaceDocuments(req, res) {
  try {
    const documents = await Document.find({ workspace: req.workspace._id })
      .select('_id owner filename fileType status pageCount chunkCount embeddedChunkCount fileSize uploadedAt')
      .sort({ uploadedAt: -1 });
    return res.status(200).json({
      statusCode: 200,
      data: documents,
      message: 'Workspace documents retrieved successfully',
    });
  } catch (error) {
    console.error('List workspace documents error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to retrieve workspace documents', error: error.message });
  }
}

/**
 * Shared chat sessions of the workspace (members only).
 * GET /api/workspaces/:id/chat-sessions
 */
async function listWorkspaceChatSessions(req, res) {
  try {
    const sessions = await ChatSession.find({ workspace: req.workspace._id })
      .sort({ updatedAt: -1 })
      .lean();
    return res.status(200).json({
      statusCode: 200,
      data: { sessions, total: sessions.length },
      message: 'Workspace chat sessions retrieved successfully',
    });
  } catch (error) {
    console.error('List workspace chat sessions error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to retrieve workspace chat sessions', error: error.message });
  }
}

module.exports = {
  createWorkspace,
  listMyWorkspaces,
  inviteMember,
  removeMember,
  listWorkspaceDocuments,
  listWorkspaceChatSessions,
};
