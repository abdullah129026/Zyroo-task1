const router = require('express').Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');

// All feature routes are registered here under /api.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

module.exports = router;