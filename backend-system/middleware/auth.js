const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches decoded user info to req.user
 *
 * Weeks 7-8: also rejects suspended accounts. The suspension check does
 * one user lookup, and only when the database is connected; if the DB is
 * unreachable the request proceeds on the token alone (the server already
 * runs in a degraded, read-mostly mode then), so a database outage never
 * locks every user out.
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: 'Authorization header is missing'
      });
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: 'Token is missing'
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Attach user info to request
    req.user = decoded;

    // Suspended accounts are blocked even with an otherwise valid token
    if (mongoose.connection.readyState === 1) {
      try {
        const account = await User.findById(decoded.userId).select('status').lean();
        if (account && account.status === 'suspended') {
          return res.status(403).json({
            statusCode: 403,
            data: null,
            message: 'This account has been suspended'
          });
        }
      } catch (lookupErr) {
        console.warn('[Auth Middleware] Suspension check skipped:', lookupErr.message);
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: 'Token has expired'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: 'Invalid token'
      });
    }

    console.error('[Auth Middleware] Error:', err);
    return res.status(401).json({
      statusCode: 401,
      data: null,
      message: 'Authentication failed'
    });
  }
};

module.exports = { authenticate };
