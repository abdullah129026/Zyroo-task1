const mongoose = require('mongoose');

/** Human-readable MongoDB connection states (mirrors mongoose.ConnectionStates). */
const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

/** Current MongoDB connection state as a readable string. */
const getDBState = () => DB_STATES[mongoose.connection.readyState] || 'unknown';

/**
 * Connect to MongoDB using the MONGODB_URI environment variable.
 * Resolves on success; throws on failure so the caller can log a clean message.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[DB] MongoDB connected successfully (host: ${conn.connection.host})`);
    return conn;
  } catch (err) {
    console.error(`[DB] MongoDB connection failed: ${err.message}`);
    throw err;
  }
};
/** Disconnect from MongoDB (used during graceful shutdown). */
const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  console.log('[DB] MongoDB disconnected');
};

module.exports = { connectDB, disconnectDB, getDBState };