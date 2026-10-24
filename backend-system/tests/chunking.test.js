const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { chunkText, estimateTokenCount } = require('../services/chunking');

describe('estimateTokenCount', () => {
  it('estimates roughly 1.3 tokens per word, rounded up', () => {
    assert.equal(estimateTokenCount('one two three four'), 6); // ceil(4 * 1.3)
    assert.equal(estimateTokenCount('hello'), 2); // ceil(1 * 1.3)
  });
});

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const chunks = chunkText('The refund window is 30 days. Keep your receipt.');
    assert.equal(chunks.length, 1);
    assert.match(chunks[0].text, /refund window is 30 days/);
    assert.ok(chunks[0].tokenCount > 0);
  });

  it('splits long text into multiple chunks near the target size', () => {
    const sentence = 'This is a sample sentence for chunking tests. ';
    const text = sentence.repeat(60); // ~480 words, well over a 100-token target
    const chunks = chunkText(text, 100, 10);
    assert.ok(chunks.length > 1, `expected multiple chunks, got ${chunks.length}`);
    for (const chunk of chunks) {
      assert.ok(chunk.text.length > 0);
      // A chunk may overshoot the target by one sentence, never wildly
      assert.ok(chunk.tokenCount <= 160, `chunk too large: ${chunk.tokenCount}`);
    }
  });

  it('overlaps consecutive chunks so context is not lost at boundaries', () => {
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join('. ') + '.';
    const chunks = chunkText(words, 50, 20);
    assert.ok(chunks.length > 1);
    const firstTail = chunks[0].text.split(/\s+/).slice(-3).join(' ');
    assert.ok(
      chunks[1].text.includes(firstTail.split(' ')[0]),
      'second chunk should start inside the first chunk\'s tail (overlap)'
    );
  });

  it('handles text without sentence punctuation as one chunk', () => {
    const chunks = chunkText('just some words without any punctuation at all');
    assert.equal(chunks.length, 1);
    assert.match(chunks[0].text, /without any punctuation/);
  });
});
