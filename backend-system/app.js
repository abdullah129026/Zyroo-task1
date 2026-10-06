const express = require('express');
const cors = require('cors');

const corsOptions = require('./config/cors');
const requestLogger = require('./middleware/request-logger');
const { notFound, errorHandler } = require('./middleware/error-handler');
const apiRoutes = require('./routes');
const stripeWebhookRoutes = require('./routes/stripeWebhook.routes');

const app = express();

// Disable the x-powered-by header.
app.disable('x-powered-by');

// CORS.
app.use(cors(corsOptions));

// Stripe webhook needs the raw body for signature verification,
// so it is mounted before the JSON body parser.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

//Body parsing.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
//Simple request logger: logs every incoming request.
app.use(requestLogger);

//  Root route: quick orientation point.
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cortex AI API is running. See /api/health for details.',
  });
});

//It Mounts API routes.
app.use('/api', apiRoutes);

//404 fallback for unknown routes.
app.use(notFound);

//Global error-handling middleware.
app.use(errorHandler);


module.exports = app;