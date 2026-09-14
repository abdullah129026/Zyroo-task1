const { GoogleGenerativeAI } = require('@google/generative-ai');

let client = null;

/**
 * Initialize Google Gemini client
 * @param {string} apiKey - Google Gemini API key
 */
function initializeClient(apiKey) {
  client = new GoogleGenerativeAI(apiKey);
}

/**
 * Generate embedding for text using Google Gemini with retry logic
 * @param {string} text - Text to embed
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in ms before retry (default: 100)
 * @returns {Promise<Array<number>>} - Embedding vector
 */
async function generateEmbedding(text, maxRetries = 3, initialDelay = 100) {
  if (!client) {
    throw new Error('Gemini client not initialized. Call initializeClient first.');
  }

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = client.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = error.message.includes('429') || // Rate limit
        error.message.includes('500') || // Server error
        error.message.includes('timeout') || // Timeout
        error.message.includes('ECONNREFUSED') || // Connection refused
        error.message.includes('ENOTFOUND'); // DNS not found

      if (!isRetryable || attempt === maxRetries) {
        throw new Error(
          `Embedding generation failed after ${attempt + 1} attempt(s): ${error.message}`
        );
      }

      // Exponential backoff: delay = initialDelay * 2^attempt
      const backoffDelay = delay * Math.pow(2, attempt);
      console.warn(
        `[EMBEDDINGS] Retry attempt ${attempt + 1}/${maxRetries} after ${backoffDelay}ms. Error: ${error.message}`
      );

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw new Error(
    `Embedding generation failed after ${maxRetries + 1} attempts: ${lastError.message}`
  );
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to embed
 * @param {number} delay - Delay between requests in ms (default: 100)
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts, delay = 100) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i++) {
    try {
      const embedding = await generateEmbedding(texts[i]);
      embeddings.push(embedding);

      // Add delay between requests to avoid rate limiting
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      // Return null for failed embedding, will be marked for retry
      embeddings.push(null);
    }
  }

  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Cosine similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

module.exports = {
  initializeClient,
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity,
};
