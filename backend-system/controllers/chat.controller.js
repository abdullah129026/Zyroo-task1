const mongoose = require('mongoose');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Document = require('../models/Document');
const User = require('../models/User');
const { answerWithRag, prepareRagPrompt } = require('../services/rag');
const { streamChatCompletion } = require('../services/llm');

const DEFAULT_TITLE = 'New chat';
const HISTORY_LIMIT = 8;

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getOwnedSession(sessionId, userId) {
  if (!isValidObjectId(sessionId)) return null;
  return ChatSession.findOne({ _id: sessionId, owner: userId });
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
    const { title, documentIds } = req.body;

    let scopedIds = [];
    if (documentIds !== undefined) {
      if (!Array.isArray(documentIds)) {
        return res.status(400).json({ statusCode: 400, message: 'documentIds must be an array' });
      }
      const invalid = documentIds.filter((id) => !isValidObjectId(id));
      if (invalid.length > 0) {
        return res.status(400).json({ statusCode: 400, message: 'documentIds contains invalid ids' });
      }
      const owned = await Document.find({ _id: { $in: documentIds }, owner: userId }).select('_id');
      if (owned.length !== documentIds.length) {
        return res.status(404).json({ statusCode: 404, message: 'One or more documents were not found' });
      }
      scopedIds = documentIds;
    }

    const session = await ChatSession.create({
      owner: userId,
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
    const sessions = await ChatSession.find({ owner: userId }).sort({ updatedAt: -1 }).lean();
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
    const session = await getOwnedSession(req.params.id, userId);
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

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ statusCode: 400, message: 'Message content is required' });
    }

    const session = await getOwnedSession(req.params.id, userId);
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

    // Usage accounting (one chat turn = one message, same as search)
    await User.findByIdAndUpdate(userId, { $inc: { 'usage.messagesSent': 1 } });

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
    const session = await getOwnedSession(req.params.id, userId);
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

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ statusCode: 400, message: 'Message content is required' });
    }

    const session = await getOwnedSession(req.params.id, userId);
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

      await User.findByIdAndUpdate(userId, { $inc: { 'usage.messagesSent': 1 } });

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
