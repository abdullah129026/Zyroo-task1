const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema(
  {
    chunk: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chunk',
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    // Cosine similarity of the chunk to the user message at retrieval time.
    score: {
      type: Number,
    },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Chunks the assistant's reply drew from. Empty for user messages.
    sources: {
      type: [sourceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ session: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
