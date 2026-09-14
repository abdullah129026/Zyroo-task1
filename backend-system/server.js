require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initializeClient } = require('./services/embeddings');

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';


async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.warn(`[SERVER] MongoDB is unreachable: ${err.message}`);
    console.warn('[SERVER] Starting API in degraded mode (database: disconnected).');
  }

  // Initialize Google Gemini embeddings client
  try {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (geminiKey) {
      initializeClient(geminiKey);
      console.log('[SERVER] Google Gemini embeddings client initialized');
    } else {
      console.warn('[SERVER] GOOGLE_GEMINI_API_KEY not set. Document processing will not work.');
    }
  } catch (err) {
    console.error('[SERVER] Failed to initialize Gemini client:', err.message);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[SERVER] Cortex AI API is running at http://localhost:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown.
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

// Safety net.
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Unhandled promise rejection:', reason);
});

startServer();