const jwt = require('jsonwebtoken');
const db = require('../db/store');

const JWT_SECRET = process.env.JWT_SECRET || 'govpilot-secret-key-2025';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.getUserById(decoded.userId || decoded.sub || decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found for token.' });
    }

    req.user = user;
    res.locals.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient privileges for this resource.' });
    }

    return next();
  };
}

function authorize(...roles) {
  return authorizeRoles(roles);
}

function logActivity(userId, action, entityType, entityId, details = null) {
  if (db && typeof db.logActivity === 'function') {
    db.logActivity(userId, action, entityType, entityId, details);
  }
}

module.exports = { JWT_SECRET, authenticate, authorize, authorizeRoles, logActivity };