const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set before starting the server.');
}
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

class AuthService {
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  static signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  static sanitizeUser(user) {
    if (!user) return null;
    const { password_hash, passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = { AuthService, JWT_SECRET };
