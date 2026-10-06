const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * User Schema
 * Stores user account information with hashed passwords
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default in queries
    },
    // Subscription & billing (Week 6)
    plan: {
      type: String,
      enum: ['free', 'pro', 'team'],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'past_due', 'incomplete', 'trialing', 'canceled'],
      default: 'none',
    },
    // Usage within the current billing period
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
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * Hash password before saving (pre-save hook)
 * Only hash if password is new or modified
 */
userSchema.pre('save', async function (next) {
  // Skip if password hasn't changed
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Instance method to compare passwords
 * @param {String} enteredPassword - The password to compare
 * @returns {Promise<Boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method to get user data without password
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
