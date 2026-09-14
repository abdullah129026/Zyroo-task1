/**
 * Estimate token count based on word count
 * Rough estimate: 1 word ≈ 1.3 tokens
 * @param {string} text - Text to count tokens for
 * @returns {number} - Estimated token count
 */
function estimateTokenCount(text) {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3);
}

/**
 * Split text into overlapping chunks
 * @param {string} text - Full text to chunk
 * @param {number} targetTokens - Target tokens per chunk (default: 500)
 * @param {number} overlapTokens - Overlap tokens between chunks (default: 50)
 * @returns {Array<Object>} - Array of { text, tokenCount }
 */
function chunkText(text, targetTokens = 500, overlapTokens = 50) {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';
  let currentTokens = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const sentenceTokens = estimateTokenCount(sentence);

    // If adding this sentence would exceed target, save current chunk
    if (currentTokens + sentenceTokens > targetTokens && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        tokenCount: estimateTokenCount(currentChunk),
      });

      // Start new chunk with overlap
      // Keep last ~50 tokens from previous chunk
      const words = currentChunk.split(/\s+/);
      const overlapWordCount = Math.ceil((overlapTokens * words.length) / currentTokens);
      const overlapWords = words.slice(-overlapWordCount);

      currentChunk = overlapWords.join(' ') + ' ' + sentence;
      currentTokens = estimateTokenCount(currentChunk);
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }

  // Add last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      tokenCount: estimateTokenCount(currentChunk),
    });
  }

  return chunks;
}

module.exports = {
  estimateTokenCount,
  chunkText,
};
