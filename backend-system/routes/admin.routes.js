const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/workspace');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Every admin endpoint requires an authenticated admin
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/users — all users with plan, status and usage
 */
router.get('/users', adminController.listUsers);

/**
 * GET /api/admin/workspaces — all workspaces with owner and member counts
 */
router.get('/workspaces', adminController.listWorkspaces);

/**
 * PATCH /api/admin/users/:id/suspend — suspend or reactivate an account
 */
router.patch('/users/:id/suspend', adminController.suspendUser);

/**
 * GET /api/admin/analytics — last-30-days platform analytics
 */
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
