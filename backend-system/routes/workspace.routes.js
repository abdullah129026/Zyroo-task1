const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  requireWorkspaceMember,
  requireWorkspaceOwner,
} = require('../middleware/workspace');
const workspaceController = require('../controllers/workspace.controller');

const router = express.Router();

// All workspace endpoints require authentication
router.use(authenticate);

/**
 * POST /api/workspaces — create a workspace (Team plan owners only)
 */
router.post('/', workspaceController.createWorkspace);

/**
 * GET /api/workspaces — workspaces the caller belongs to
 */
router.get('/', workspaceController.listMyWorkspaces);

/**
 * POST /api/workspaces/:id/invite — invite a member by email (owner only)
 */
router.post('/:id/invite', requireWorkspaceOwner, workspaceController.inviteMember);

/**
 * DELETE /api/workspaces/:id/members/:userId — remove a member
 * (owner, or the member themselves)
 */
router.delete('/:id/members/:userId', requireWorkspaceMember, workspaceController.removeMember);

/**
 * GET /api/workspaces/:id/documents — shared documents (members only)
 */
router.get('/:id/documents', requireWorkspaceMember, workspaceController.listWorkspaceDocuments);

/**
 * GET /api/workspaces/:id/chat-sessions — shared chat sessions (members only)
 */
router.get('/:id/chat-sessions', requireWorkspaceMember, workspaceController.listWorkspaceChatSessions);

module.exports = router;
