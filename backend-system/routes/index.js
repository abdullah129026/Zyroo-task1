const router = require('express').Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const documentRoutes = require('./document.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);

module.exports = router;