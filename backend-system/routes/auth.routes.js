const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

/**
 * Public Routes
 */

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { name, email, password, passwordConfirm }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login user and receive JWT token
 * Body: { email, password }
 */
router.post('/login', authController.login);

/**
 * Protected Routes
 */

/**
 * GET /api/auth/me
 * Get current authenticated user info
 * Headers: { Authorization: "Bearer <token>" }
 */
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
