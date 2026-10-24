const { getClient } = require('./embeddings');

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash';
const MAX_OUTPUT_TOKENS = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 10) || 1024;

/**
 * Call the Gemini chat completion API with retry logic.
 * Retries on rate limits, server errors and transient network failures,
 * mirroring the retry policy in services/embeddings.js.
 *
 * @param {string} prompt - Full prompt (system + context + history + question)
 * @param {object} [options]
 * @param {string} [options.model] - Override the chat model
 * @param {number} [options.maxOutputTokens] - Cap on generated tokens
 * @returns {Promise<string>} The model's text reply
 */
async function generateChatCompletion(prompt, options = {}) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: options.model || CHAT_MODEL,
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens || MAX_OUTPUT_TOKENS,
      temperature: 0.2,
    },
  });

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) {
        throw new Error('LLM returned an empty response');
      }
      // Token usage logging: LLM calls are billed per token, so every
      // call leaves a cost trail in the server logs (Weeks 7-8).
      const usage = result.response.usageMetadata;
      if (usage) {
        console.log(
          `[LLM] chat model=${options.model || CHAT_MODEL} promptTokens=${usage.promptTokenCount || 0} ` +
            `completionTokens=${usage.candidatesTokenCount || 0} totalTokens=${usage.totalTokenCount || 0}`
        );
      }
      return text;
    } catch (error) {
      lastError = error;
      const msg = error.message || '';
      const isRetryable =
        msg.includes('429') ||
        msg.includes('500') ||
        msg.includes('503') ||
        msg.includes('timeout') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ENOTFOUND');

      if (!isRetryable || attempt === maxRetries) {
        throw new Error(`Chat completion failed after ${attempt + 1} attempt(s): ${msg}`);
      }
      const backoff = 200 * Math.pow(2, attempt);
      console.warn(`[LLM] Retry attempt ${attempt + 1}/${maxRetries} after ${backoff}ms. Error: ${msg}`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw new Error(`Chat completion failed after ${maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Stream a chat completion token-by-token.
 * The stream setup is retried like generateChatCompletion; once tokens start
 * flowing, errors are surfaced to the caller instead of retried.
 *
 * @param {string} prompt - Full prompt
 * @param {function(string): Promise<void>|void} onToken - Called with each text delta
 * @param {object} [options]
 * @returns {Promise<string>} The complete reply text
 */
async function streamChatCompletion(prompt, onToken, options = {}) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: options.model || CHAT_MODEL,
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens || MAX_OUTPUT_TOKENS,
      temperature: 0.2,
    },
  });

  const maxRetries = 3;
  let lastError;
  let streamResult = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      streamResult = await model.generateContentStream(prompt);
      break;
    } catch (error) {
      lastError = error;
      const msg = error.message || '';
      const isRetryable =
        msg.includes('429') || msg.includes('500') || msg.includes('503') || msg.includes('timeout');
      if (!isRetryable || attempt === maxRetries) {
        throw new Error(`Chat stream failed to start after ${attempt + 1} attempt(s): ${msg}`);
      }
      const backoff = 200 * Math.pow(2, attempt);
      console.warn(`[LLM] Stream retry attempt ${attempt + 1}/${maxRetries} after ${backoff}ms. Error: ${msg}`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  let fullText = '';
  for await (const chunk of streamResult.stream) {
    const token = chunk.text();
    if (token) {
      fullText += token;
      await onToken(token);
    }
  }
  const finalResponse = await streamResult.response;
  const usage = finalResponse.usageMetadata;
  if (usage) {
    console.log(
      `[LLM] chat-stream model=${options.model || CHAT_MODEL} promptTokens=${usage.promptTokenCount || 0} ` +
        `completionTokens=${usage.candidatesTokenCount || 0} totalTokens=${usage.totalTokenCount || 0}`
    );
  }
  return finalResponse.text() || fullText;
}

module.exports = { generateChatCompletion, streamChatCompletion, CHAT_MODEL };
