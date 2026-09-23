const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/store');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Simple risk register API
// GET / - list risks (role-based visibility)
// POST / - create risk (admin/government)
// PUT /:id - update risk (admin/government)
// DELETE /:id - delete risk (admin only)

function sanitizeRisk(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    severity: r.severity || 'medium',
    status: r.status || 'open',
    owner: r.owner || null,
    created_by: r.created_by || null,
    created_at: r.created_at || null,
    updated_at: r.updated_at || null,
  };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const all = await db.getAll('risks');
    const user = req.user || null;
    // If user is not admin or government, only show risks where owner==user.id or status!='internal'
    const visible = (all || []).filter((r) => {
      if (!user) return false;
      if (user.role === 'admin' || user.role === 'government') return true;
      if (r.owner && r.owner === user.id) return true;
      return r.status !== 'internal';
    });
    res.json({ count: visible.length, risks: visible.map(sanitizeRisk) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list risks' });
  }
});

router.post('/', authenticate, authorizeRoles(['admin', 'government']), async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title) return res.status(400).json({ error: 'title is required' });
    const now = new Date().toISOString();
    const record = {
      id: 'RK-' + uuidv4().slice(0, 8),
      title: String(body.title).slice(0, 200),
      description: String(body.description || '').slice(0, 2000),
      severity: body.severity || 'medium',
      status: body.status || 'open',
      owner: body.owner || req.user?.id || null,
      created_by: req.user?.id || 'system',
      created_at: now,
      updated_at: now,
    };

    try {
      const inserted = await db.insert('risks', record);
      return res.status(201).json(sanitizeRisk(inserted));
    } catch (dbErr) {
      // fallback to memory insert if table unavailable
      if (dbErr && String(dbErr).includes('no such table')) {
        const mem = (await db.getAll('risks')) || [];
        mem.push(record);
        return res.status(201).json(sanitizeRisk(record));
      }
      throw dbErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create risk' });
  }
});

router.put('/:id', authenticate, authorizeRoles(['admin', 'government']), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const updated = await db.update('risks', id, {
      title: body.title,
      description: body.description,
      severity: body.severity,
      status: body.status,
      owner: body.owner,
      updated_at: new Date().toISOString(),
    });
    if (!updated) return res.status(404).json({ error: 'Risk not found' });
    return res.json(sanitizeRisk(updated));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update risk' });
  }
});

router.delete('/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const id = req.params.id;
    const ok = await db.remove('risks', id);
    if (!ok) return res.status(404).json({ error: 'Risk not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete risk' });
  }
});

module.exports = router;
