const express = require('express');
const { authenticate, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();
const db = require('../db/store');

router.get('/stats', authenticate, authorize('admin'), (req, res) => {
  try {
    const stats = {
      total_users: db.count('users'),
      total_challenges: db.count('challenges'),
      total_proposals: db.count('proposals'),
      total_pilots: db.count('pilots'),
      active_pilots: db.getAll('pilots').filter(p => p.status === 'active').length,
      challenges_by_status: db.getAll('challenges').reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
      users_by_role: db.getAll('users').reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {}),
      recent_activity: db.getAll('activity_log').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10),
      avg_evaluation_score: db.getAll('proposals').filter(p => p.overall_score).reduce((a, p) => a + parseFloat(p.overall_score), 0) / db.getAll('proposals').filter(p => p.overall_score).length || 0,
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const users = db.getAll('users').map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      organization: u.organization,
      bio: u.bio,
      created_at: u.created_at,
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { role, organization, bio } = req.body;
    db.update('users', req.params.id, { role, organization, bio });
    logActivity(req.user.id, 'update_user', 'user', req.params.id);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    db.remove('users', req.params.id);
    logActivity(req.user.id, 'delete_user', 'user', req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/activity', authenticate, authorize('admin'), (req, res) => {
  try {
    const users = db.getAll('users');
    const logs = db.getAll('activity_log')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
      .map(l => ({
        ...l,
        full_name: users.find(u => u.id === l.user_id)?.full_name || null,
      }));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
