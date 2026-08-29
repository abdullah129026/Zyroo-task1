const express = require('express');
const cors = require('cors');

const corsOptions = require('./config/cors');
const requestLogger = require('./middleware/request-logger');
const { notFound, errorHandler } = require('./middleware/error-handler');
const apiRoutes = require('./routes');

const app = express();

// Disable the x-powered-by header (minor hardening).
app.disable('x-powered-by');

// CORS: allow configured frontend origins to talk to this API.
app.use(cors(corsOptions));

// Body parsing.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger: logs every incoming request.
app.use(requestLogger);

// Root route: quick orientation point.
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cortex AI API is running. See /api/health for details.',
  });
});

// Mount API routes.
app.use('/api', apiRoutes);

// 404 fallback for unknown routes.
app.use(notFound);

// Global error-handling middleware (always last).
app.use(errorHandler);

module.exports = app;