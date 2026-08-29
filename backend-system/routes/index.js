const router = require('express').Router();

const healthRoutes = require('./health.routes');

// All feature routes are registered here under /api.
router.use('/health', healthRoutes);



module.exports = router;