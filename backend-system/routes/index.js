const router = require('express').Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const documentRoutes = require('./document.routes');
const searchRoutes = require('./search.routes');
const billingRoutes = require('./billing.routes');
const chatRoutes = require('./chat.routes');
const workspaceRoutes = require('./workspace.routes');
const adminRoutes = require('./admin.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/search', searchRoutes);
router.use('/billing', billingRoutes);
router.use('/chat/sessions', chatRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/admin', adminRoutes);

module.exports = router;