const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional workspace scope (Weeks 7-8): when set, workspace members
    // can access the session and its messages are metered against the
    // workspace's shared quota pool.
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    title: {
      type: String,
      default: 'New chat',
      maxlength: 120,
    },
    // Optional scope: when set, retrieval only uses these documents.
    // Every id must belong to the owner (enforced in the controller).
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);
