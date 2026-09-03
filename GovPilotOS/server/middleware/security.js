const rateLimit = require('express-rate-limit');
const { authenticate, authorize, authorizeRoles, JWT_SECRET } = require('./auth');

const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and retry later.' },
  skipSuccessfulRequests: false,
});

module.exports = {
  rateLimiter,
  authenticate,
  authorize,
  authorizeRoles,
  JWT_SECRET,
};
