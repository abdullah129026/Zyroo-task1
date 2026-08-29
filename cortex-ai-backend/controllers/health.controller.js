const { getDBState } = require('../config/db');
const { successResponse } = require('../utils/api-response');

/**
 * GET /api/health
 * Confirms the server is up and reports the current database state.
 */
const getHealth = (_req, res) => {
  successResponse(res, {
    message: 'Server is running properly',
    data: {
      status: 'ok',
      service: 'cortex-ai-backend',
      environment: process.env.NODE_ENV || 'development',
      database: getDBState(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = { getHealth };