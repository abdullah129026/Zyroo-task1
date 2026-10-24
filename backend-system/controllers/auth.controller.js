const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {String} userId - User's MongoDB ID
 * @returns {String} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d', // Token expires in 7 days
  });
};

/**
 * Admin bootstrap (Weeks 7-8): emails listed in the ADMIN_EMAILS env var
 * (comma-separated) are promoted to the admin role. Applied on register
 * and login, so the platform owner gets admin access by configuring the
 * environment, never by a seeded or hardcoded account.
 */
const applyAdminBootstrap = async (user) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.includes(user.email.toLowerCase()) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
  return user;
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    // Validation
    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: 'All fields are required'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        statusCode: 409,
        data: null,
        message: 'Email is already registered'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    await applyAdminBootstrap(user);

    // Return user without password
    return res.status(201).json({
      statusCode: 201,
      data: {
        user: user.toJSON(),
      },
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({
      statusCode: 500,
      data: null,
      message: err.message || 'Internal server error'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        statusCode: 400,
        data: null,
        message: 'Email and password are required'
      });
    }

    // Find user by email (need password field for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: 'Invalid credentials'
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: 'Invalid credentials'
      });
    }

    // Suspended accounts cannot log in (Weeks 7-8 admin oversight)
    if (user.status === 'suspended') {
      return res.status(403).json({
        statusCode: 403,
        data: null,
        message: 'This account has been suspended'
      });
    }

    await applyAdminBootstrap(user);

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(200).json({
      statusCode: 200,
      data: {
        user: user.toJSON(),
        token,
      },
      message: 'Login successful'
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({
      statusCode: 500,
      data: null,
      message: err.message || 'Internal server error'
    });
  }
};

/**
 * Get current user info (protected route)
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        data: null,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      statusCode: 200,
      data: { user: user.toJSON() },
      message: 'User retrieved successfully'
    });
  } catch (err) {
    console.error('[Auth] Get current user error:', err);
    return res.status(500).json({
      statusCode: 500,
      data: null,
      message: err.message || 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  generateToken,
};
