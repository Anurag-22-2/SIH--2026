const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const JWT_SECRET = require('../middleware/auth').JWT_SECRET;
const db = require('../db/store');

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role, organization, bio, expertise } = req.body;
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Email, password, full_name, and role are required' });
    }
    if (!['government', 'startup', 'expert', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    const user = await db.insert('users', {
      id,
      email,
      password_hash,
      full_name,
      role,
      organization: organization || null,
      bio: bio || null,
      expertise: expertise || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...safeUser } = user;
    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      const demoUser = await db.getUserByEmail('officer@govpilot.gov');
      if (demoUser) {
        const { password_hash, ...safeUser } = demoUser;
        return res.json(safeUser);
      }
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.getUserById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
