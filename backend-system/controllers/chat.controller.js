const mongoose = require('mongoose');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Document = require('../models/Document');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { answerWithRag, prepareRagPrompt } = require('../services/rag');
const { streamChatCompletion } = require('../services/llm');

const DEFAULT_TITLE = 'New chat';
const HISTORY_LIMIT = 8;
// Hard cap on one chat message: bounds per-call LLM cost and abuse.
const MAX_MESSAGE_CHARS = parseInt(process.env.CHAT_MAX_MESSAGE_CHARS, 10) || 4000;

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getOwnedSession(sessionId, userId) {
  if (!isValidObjectId(sessionId)) return null;
  return ChatSession.findOne({ _id: sessionId, owner: userId });
}

/**
 * Session access for workspace-era sessions: the owner always has
 * access; a workspace-scoped session is also accessible to every member
 * of that workspace.
 */
async function getAccessibleSession(sessionId, userId) {
  if (!isValidObjectId(sessionId)) return null;
  const session = await ChatSession.findById(sessionId);
  if (!session) return null;
  if (session.owner.toString() === userId.toString()) return session;
  if (session.workspace) {
    const membership = await Workspace.exists({
      _id: session.workspace,
      'members.user': userId,
    });
    if (membership) return session;
  }
  return null;
}

/**
 * Meter one chat turn: workspace sessions draw from the workspace's
 * shared pool, personal sessions from the user's own quota.
 */
async function chargeMessageUsage(session, userId) {
  if (session.workspace) {
    await Workspace.findByIdAndUpdate(session.workspace, {
      $inc: { 'usage.messagesSent': 1 },
    });
  } else {
    await User.findByIdAndUpdate(userId, { $inc: { 'usage.messagesSent': 1 } });
  }
}

/**
 * Shared validation for the two send paths (JSON + SSE stream).
 * Returns an error message, or null when the content is acceptable.
 */
function validateMessageContent(content) {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return 'Message content is required';
  }
  if (content.trim().length > MAX_MESSAGE_CHARS) {
    return `Message is too long (max ${MAX_MESSAGE_CHARS} characters)`;
  }
  return null;
}

/**
 * Create a chat session
 * POST /api/chat/sessions
 * @param {string} title - Optional session title
 * @param {Array<string>} documentIds - Optional scope; every id must belong to the user
 */
async function createSession(req, res) {
  try {
    const { userId } = req.user;
    const { title, documentIds, workspaceId } = req.body;

    // Optional workspace scope: caller must be a member of the workspace
    let workspace = null;
    if (workspaceId !== undefined && workspaceId !== null) {
      if (!isValidObjectId(workspaceId)) {
        return res.status(400).json({ statusCode: 400, message: 'workspaceId is not a valid id' });
      }
      workspace = await Workspace.findById(workspaceId);
      if (!workspace || !workspace.memberOf(userId)) {
        return res.status(404).json({ statusCode: 404, message: 'Workspace not found' });
      }
    }

    let scopedIds = [];
    if (documentIds !== undefined) {
      if (!Array.isArray(documentIds)) {
        return res.status(400).json({ statusCode: 400, message: 'documentIds must be an array' });
      }
      const invalid = documentIds.filter((id) => !isValidObjectId(id));
      if (invalid.length > 0) {
        return res.status(400).json({ statusCode: 400, message: 'documentIds contains invalid ids' });
      }
      // Accessible documents: the caller's own, plus the workspace's
      // shared documents when the session is workspace-scoped
      const accessFilter = workspace
        ? { $or: [{ owner: userId }, { workspace: workspace._id }] }
        : { owner: userId };
      const accessible = await Document.find({ _id: { $in: documentIds }, ...accessFilter }).select('_id');
      if (accessible.length !== documentIds.length) {
        return res.status(404).json({ statusCode: 404, message: 'One or more documents were not found' });
      }
      scopedIds = documentIds;
    }

    const session = await ChatSession.create({
      owner: userId,
      workspace: workspace ? workspace._id : null,
      title: typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : DEFAULT_TITLE,
      documentIds: scopedIds,
    });

    return res.status(201).json({
      statusCode: 201,
      data: session,
      message: 'Chat session created successfully',
    });
  } catch (error) {
    console.error('Create session error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to create chat session', error: error.message });
  }
}

/**
 * List the user's chat sessions, most recently active first
 * GET /api/chat/sessions
 */
async function listSessions(req, res) {
  try {
    const { userId } = req.user;
    const myWorkspaces = await Workspace.find({ 'members.user': userId }).select('_id').lean();
    const workspaceIds = myWorkspaces.map((w) => w._id);
    const sessions = await ChatSession.find({
      $or: [{ owner: userId }, { workspace: { $in: workspaceIds } }],
    }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({
      statusCode: 200,
      data: { sessions, total: sessions.length },
      message: 'Chat sessions retrieved successfully',
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to list chat sessions', error: error.message });
  }
}

/**
 * Delete a chat session and all its messages
 * DELETE /api/chat/sessions/:id
 */
async function deleteSession(req, res) {
  try {
    const { userId } = req.user;
    // Deleting is owner-level: the session owner, or the owner of the
    // workspace the session belongs to. Plain members can read and chat
    // but cannot delete other members' sessions.
    let session = await getOwnedSession(req.params.id, userId);
    if (!session && isValidObjectId(req.params.id)) {
      const candidate = await ChatSession.findById(req.params.id);
      if (candidate && candidate.workspace) {
        const ownsWorkspace = await Workspace.exists({
          _id: candidate.workspace,
          owner: userId,
        });
        if (ownsWorkspace) session = candidate;
      }
    }
    if (!session) {
      return res.status(404).json({ statusCode: 404, message: 'Chat session not found' });
    }

    await ChatMessage.deleteMany({ session: session._id });
    await session.deleteOne();

    return res.status(200).json({
      statusCode: 200,
      data: null,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to delete chat session', error: error.message });
  }
}

/**
 * Send a message and get the RAG-powered reply
 * POST /api/chat/sessions/:id/messages
 * @param {string} content - The user's message
 * @param {number} topK - Optional retrieval depth (default 5)
 */
async function sendMessage(req, res) {
  try {
    const { userId } = req.user;
    const { content, topK = 5 } = req.body;

    const contentError = validateMessageContent(content);
    if (contentError) {
      return res.status(400).json({ statusCode: 400, message: contentError });
    }

    const session = await getAccessibleSession(req.params.id, userId);
    if (!session) {
      return res.status(404).json({ statusCode: 404, message: 'Chat session not found' });
    }

    const userMessage = await ChatMessage.create({
      session: session._id,
      role: 'user',
      content: content.trim(),
    });

    // Recent history for conversational context (excludes the message just saved)
    const history = await ChatMessage.find({ session: session._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT + 1)
      .lean();
    const priorHistory = history
      .filter((m) => m._id.toString() !== userMessage._id.toString())
      .slice(0, HISTORY_LIMIT)
      .reverse();

    const { reply, sources, chunksUsed } = await answerWithRag({
      userId,
      session,
      userText: content.trim(),
      history: priorHistory,
      topK,
    });

    const assistantMessage = await ChatMessage.create({
      session: session._id,
      role: 'assistant',
      content: reply,
      sources,
    });

    // Auto-title an untitled session from its first message
    if (session.title === DEFAULT_TITLE) {
      session.title = content.trim().slice(0, 60);
      await session.save();
    } else {
      // Bump updatedAt so the session sorts by recent activity
      await ChatSession.updateOne({ _id: session._id }, { $set: { updatedAt: new Date() } });
    }

    // Usage accounting (one chat turn = one message, same as search);
    // workspace sessions charge the shared workspace pool
    await chargeMessageUsage(session, userId);

    return res.status(200).json({
      statusCode: 200,
      data: {
        reply,
        sources,
        chunksUsed,
        message: assistantMessage,
        sessionId: session._id,
      },
      message: 'Reply generated successfully',
    });
  } catch (error) {
    console.error('Send message error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      statusCode: status,
      message: status === 500 ? 'Failed to generate reply' : error.message,
      ...(status === 500 ? { error: error.message } : {}),
    });
  }
}

/**
 * Get the full message history of a session
 * GET /api/chat/sessions/:id/messages
 */
async function getMessages(req, res) {
  try {
    const { userId } = req.user;
    const session = await getAccessibleSession(req.params.id, userId);
    if (!session) {
      return res.status(404).json({ statusCode: 404, message: 'Chat session not found' });
    }

    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 100, 500));
    const messages = await ChatMessage.find({ session: session._id })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      statusCode: 200,
      data: { messages, total: messages.length, sessionId: session._id },
      message: 'Messages retrieved successfully',
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ statusCode: 500, message: 'Failed to retrieve messages', error: error.message });
  }
}

/**
 * Stream a RAG-powered reply token-by-token via Server-Sent Events
 * POST /api/chat/sessions/:id/messages/stream
 *
 * Events: data: {"token": "..."} ... data: {"done": true, "sources": [...], "chunksUsed": n}
 * On failure mid-stream: data: {"error": "..."}
 */
async function sendMessageStream(req, res) {
  try {
    const { userId } = req.user;
    const { content, topK = 5 } = req.body;

    const contentError = validateMessageContent(content);
    if (contentError) {
      return res.status(400).json({ statusCode: 400, message: contentError });
    }

    const session = await getAccessibleSession(req.params.id, userId);
    if (!session) {
      return res.status(404).json({ statusCode: 404, message: 'Chat session not found' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const sendEvent = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

    let finished = false;
    req.on('close', () => {
      finished = true;
    });

    try {
      const userMessage = await ChatMessage.create({
        session: session._id,
        role: 'user',
        content: content.trim(),
      });

      const history = await ChatMessage.find({ session: session._id })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT + 1)
        .lean();
      const priorHistory = history
        .filter((m) => m._id.toString() !== userMessage._id.toString())
        .slice(0, HISTORY_LIMIT)
        .reverse();

      const { prompt, sources, chunksUsed } = await prepareRagPrompt({
        userId,
        session,
        userText: content.trim(),
        history: priorHistory,
        topK,
      });

      const reply = await streamChatCompletion(prompt, (token) => {
        if (!finished) sendEvent({ token });
      });

      if (reply) {
        await ChatMessage.create({
          session: session._id,
          role: 'assistant',
          content: reply,
          sources,
        });
      }

      if (session.title === DEFAULT_TITLE) {
        session.title = content.trim().slice(0, 60);
        await session.save();
      } else {
        await ChatSession.updateOne({ _id: session._id }, { $set: { updatedAt: new Date() } });
      }

      await chargeMessageUsage(session, userId);

      if (!finished) sendEvent({ done: true, sources, chunksUsed });
    } catch (streamError) {
      console.error('Stream message error:', streamError);
      if (!finished) sendEvent({ error: streamError.message || 'Failed to generate reply' });
    } finally {
      if (!finished) res.end();
    }
  } catch (error) {
    console.error('Stream setup error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ statusCode: 500, message: 'Failed to start stream', error: error.message });
    }
    res.end();
  }
}

module.exports = {
  createSession,
  listSessions,
  deleteSession,
  sendMessage,
  sendMessageStream,
  getMessages,
};
