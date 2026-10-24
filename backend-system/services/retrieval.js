const Chunk = require('../models/Chunk');
const Document = require('../models/Document');
const { generateEmbedding, cosineSimilarity } = require('./embeddings');

/**
 * Retrieve the top-k chunks most similar to the query.
 *
 * Shared by semantic search and the RAG chat pipeline so both rank
 * identically. Throws an Error with `statusCode` for client errors
 * (bad query, unowned document); callers map it to the HTTP response.
 *
 * @param {string} userId - Owner of the documents
 * @param {string} query - Natural-language query
 * @param {Array<string>|null} documentIds - Optional scope; every id must belong to the user
 *   (or to the workspace, when workspaceId is given)
 * @param {string|null} workspaceId - Optional workspace scope (Weeks 7-8): with no
 *   documentIds, retrieval covers the workspace's shared documents; with
 *   documentIds, the caller's own documents are also in scope
 * @param {number} topK - How many chunks to return (default 5, capped at 50)
 * @returns {Promise<Array>} Chunks sorted by similarity, each with {_id, chunkIndex, text, tokenCount, document, similarity}
 */
async function retrieveRelevantChunks({ userId, query, documentIds = null, workspaceId = null, topK = 5 }) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    const err = new Error('Query is required and must be a non-empty string');
    err.statusCode = 400;
    throw err;
  }
  const k = Math.max(1, Math.min(parseInt(topK, 10) || 5, 50));

  const queryEmbedding = await generateEmbedding(query);

  const filter = {
    embeddingStatus: 'completed',
    embedding: { $exists: true },
  };

  if (documentIds && documentIds.length > 0) {
    const accessFilter = workspaceId
      ? { $or: [{ owner: userId }, { workspace: workspaceId }] }
      : { owner: userId };
    const accessible = await Document.find({ _id: { $in: documentIds }, ...accessFilter }).select('_id');
    if (accessible.length !== documentIds.length) {
      const err = new Error('One or more documents were not found');
      err.statusCode = 404;
      throw err;
    }
    filter.document = { $in: documentIds };
  } else if (workspaceId) {
    const workspaceDocs = await Document.find({ workspace: workspaceId }).select('_id');
    filter.document = { $in: workspaceDocs.map((d) => d._id) };
  } else {
    const userDocs = await Document.find({ owner: userId }).select('_id');
    filter.document = { $in: userDocs.map((d) => d._id) };
  }

  const chunks = await Chunk.find(filter).populate('document', 'filename fileType').lean();

  return chunks
    .map((chunk) => ({
      _id: chunk._id,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      tokenCount: chunk.tokenCount,
      document: chunk.document,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

module.exports = { retrieveRelevantChunks };
