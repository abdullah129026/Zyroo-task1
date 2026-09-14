const Chunk = require('../models/Chunk');
const Document = require('../models/Document');
const { generateEmbedding, cosineSimilarity } = require('../services/embeddings');

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

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Query is required and must be a non-empty string',
      });
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Build filter for chunks
    let filter = {
      embeddingStatus: 'completed',
      embedding: { $exists: true },
    };

    if (documentId) {
      // Verify user owns the document
      const doc = await Document.findOne({ _id: documentId, owner: userId });
      if (!doc) {
        return res.status(404).json({
          statusCode: 404,
          message: 'Document not found',
        });
      }
      filter.document = documentId;
    } else {
      // Get all documents owned by user
      const userDocs = await Document.find({ owner: userId }).select('_id');
      const docIds = userDocs.map((d) => d._id);
      filter.document = { $in: docIds };
    }

    // Get all matching chunks
    const chunks = await Chunk.find(filter)
      .populate('document', 'filename fileType')
      .lean();

    if (chunks.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        data: [],
        message: 'No documents found with embeddings',
      });
    }

    // Calculate similarity scores
    const results = chunks
      .map((chunk) => ({
        _id: chunk._id,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        document: chunk.document,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

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
    return res.status(500).json({
      statusCode: 500,
      message: 'Search failed',
      error: error.message,
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
