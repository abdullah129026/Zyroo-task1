const User = require('../models/User');
const { retrieveRelevantChunks } = require('../services/retrieval');

/**
 * Semantic search across documents
 * POST /api/search
 * @param {string} query - Search query
 * @param {string} documentId - Optional: search within specific document
 * @param {number} topK - Number of results to return (default: 5)
 */
async function semanticSearch(req, res) {
  try {
    const { userId } = req.user;
    const { query, documentId, topK = 5 } = req.body;

    const results = await retrieveRelevantChunks({
      userId,
      query,
      documentIds: documentId ? [documentId] : null,
      topK,
    });

    if (results.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        data: [],
        message: 'No documents found with embeddings',
      });
    }

    // Usage accounting for the plan quota (one search = one message)
    await User.findByIdAndUpdate(userId, {
      $inc: { 'usage.messagesSent': 1 },
    });

    return res.status(200).json({
      statusCode: 200,
      data: {
        query,
        results,
        totalResults: results.length,
        documentId: documentId || null,
      },
      message: 'Search completed successfully',
    });
  } catch (error) {
    console.error('Search error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      statusCode: status,
      message: status === 500 ? 'Search failed' : error.message,
      ...(status === 500 ? { error: error.message } : {}),
    });
  }
}

/**
 * Retry failed embeddings for a chunk
 * POST /api/search/retry/:chunkId
 */
async function retryChunkEmbedding(req, res) {
  try {
    const { chunkId } = req.params;
    const { userId } = req.user;

    const chunk = await Chunk.findById(chunkId).populate('document');

    if (!chunk) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Chunk not found',
      });
    }

    // Verify user owns the document
    if (chunk.document.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Unauthorized',
      });
    }

    if (chunk.retryCount >= chunk.maxRetries) {
      return res.status(400).json({
        statusCode: 400,
        message: `Max retries exceeded for this chunk (${chunk.maxRetries})`,
      });
    }

    try {
      const embedding = await generateEmbedding(chunk.text);

      await Chunk.findByIdAndUpdate(chunkId, {
        embedding,
        embeddingStatus: 'completed',
        embeddingError: null,
        retryCount: chunk.retryCount + 1,
      });

      return res.status(200).json({
        statusCode: 200,
        message: 'Chunk embedding retried successfully',
      });
    } catch (error) {
      await Chunk.findByIdAndUpdate(chunkId, {
        embeddingStatus: 'failed',
        embeddingError: error.message,
        retryCount: chunk.retryCount + 1,
      });

      return res.status(500).json({
        statusCode: 500,
        message: 'Retry failed',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Retry error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Failed to retry embedding',
      error: error.message,
    });
  }
}

module.exports = {
  semanticSearch,
  retryChunkEmbedding,
};
