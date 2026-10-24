const mongoose = require('mongoose');

/**
 * Workspace Schema (Weeks 7-8)
 * A shared space owned by one user on the Team plan. Members share the
 * workspace's documents and chat sessions, and all workspace activity is
 * metered against ONE shared usage pool (Team plan limits), not against
 * each member's personal quota.
 *
 * The usage/period fields deliberately mirror the User model's shape so
 * the quota middleware's period-rollover logic works on both.
 */
const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [80, 'Workspace name must be at most 80 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [memberSchema],
    // Shared usage pool for the current billing period (Team plan limits)
    usage: {
      documentsUploaded: { type: Number, default: 0 },
      messagesSent: { type: Number, default: 0 },
      storageUsed: { type: Number, default: 0 }, // bytes
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Membership check used by middleware and controllers.
 * @param {string} userId
 * @returns {object|null} the member subdocument, or null
 */
workspaceSchema.methods.memberOf = function (userId) {
  return (
    this.members.find((m) => m.user.toString() === userId.toString()) || null
  );
};

workspaceSchema.methods.isOwner = function (userId) {
  return this.owner.toString() === userId.toString();
};

module.exports = mongoose.model('Workspace', workspaceSchema);
