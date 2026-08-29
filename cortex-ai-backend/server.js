require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Boot the server. The database connection is attempted first so the success
 * message is printed when it is available. If the database is unreachable we
 * log a clear, controlled error message and still start the API in degraded
 * mode (health endpoint will report `database: "disconnected"`) instead of
 * crashing uncontrolled.
 */
async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.warn(`[SERVER] MongoDB is unreachable: ${err.message}`);
    console.warn('[SERVER] Starting API in degraded mode (database: disconnected).');
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[SERVER] Cortex AI API is running at http://localhost:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown on Ctrl+C / SIGTERM.
  const shutdown = (signal) => {
    console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await disconnectDB();
      } finally {
        process.exit(0);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Safety net: catch unexpected promise rejections instead of crashing silently.
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Unhandled promise rejection:', reason);
});

startServer();