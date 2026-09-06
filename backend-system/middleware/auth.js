const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches decoded user info to req.user
 */
const authenticate = (req, res, next) => {
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
