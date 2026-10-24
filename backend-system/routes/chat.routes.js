const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireQuota } = require('../middleware/quota');
const { llmLimiter } = require('../middleware/rateLimit');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

// All chat endpoints require authentication
router.use(authenticate);

/**
 * POST /api/chat/sessions
 * Create a chat session
 */
router.post('/', chatController.createSession);

/**
 * GET /api/chat/sessions
 * List the user's chat sessions
 */
router.get('/', chatController.listSessions);

/**
 * DELETE /api/chat/sessions/:id
 * Delete a chat session and its messages
 */
router.delete('/:id', chatController.deleteSession);

/**
 * POST /api/chat/sessions/:id/messages
 * Send a message, get the RAG-powered reply (metered against the plan's message quota)
 */
router.post('/:id/messages', llmLimiter, requireQuota('messages'), chatController.sendMessage);

/**
 * POST /api/chat/sessions/:id/messages/stream
 * Stream the RAG-powered reply token-by-token via SSE (metered against the plan's message quota)
 */
router.post('/:id/messages/stream', llmLimiter, requireQuota('messages'), chatController.sendMessageStream);

/**
 * GET /api/chat/sessions/:id/messages
 * Full message history of a session
 */
router.get('/:id/messages', chatController.getMessages);

module.exports = router;
