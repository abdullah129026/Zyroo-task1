const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const corsOptions = require('./config/cors');
const requestLogger = require('./middleware/request-logger');
const { globalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error-handler');
const apiRoutes = require('./routes');
const stripeWebhookRoutes = require('./routes/stripeWebhook.routes');

const app = express();

// Disable the x-powered-by header.
app.disable('x-powered-by');

// Secure HTTP headers (Weeks 7-8 hardening). CSP is left off: this is a
// JSON API plus the Swagger UI page, and helmet's default CSP would
// break the docs UI's inline assets. Every other helmet default applies.
app.use(helmet({ contentSecurityPolicy: false }));

// Global rate ceiling on all routes.
app.use(globalLimiter);

// CORS.
app.use(cors(corsOptions));

// Stripe webhook needs the raw body for signature verification,
// so it is mounted before the JSON body parser.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

//Body parsing.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Strip Mongo operator keys ($...) and dotted paths from request input,
// so a crafted body or query cannot smuggle query operators into finds.
app.use(mongoSanitize());
//Simple request logger: logs every incoming request.
app.use(requestLogger);

//  Root route: quick orientation point.
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cortex AI API is running. See /api/health for details.',
  });
});

// API documentation: Swagger UI + the raw OpenAPI spec.
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./config/openapi');
app.get('/api/docs.json', (_req, res) => res.status(200).json(openapiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

//It Mounts API routes.
app.use('/api', apiRoutes);

//404 fallback for unknown routes.
app.use(notFound);

//Global error-handling middleware.
app.use(errorHandler);


module.exports = app;