const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();
const db = require('../db/store');

router.get('/', authenticate, (req, res) => {
  try {
    const { status, proposal_id } = req.query;
    let results = db.getAll('pilots');
    
    if (req.user.role === 'startup') {
      results = results.filter(p => p.startup_id === req.user.id);
    }
    
    if (status) results = results.filter(p => p.status === status);
    if (proposal_id) results = results.filter(p => p.proposal_id === proposal_id);
    
    const challenges = db.getAll('challenges');
    const users = db.getAll('users');
    results = results.map(p => ({
      ...p,
      challenge_title: challenges.find(c => c.id === p.challenge_id)?.title || null,
      startup_name: users.find(u => u.id === p.startup_id)?.full_name || null,
    }));
    
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    let pilot = db.getAll('pilots').find(p => p.id === req.params.id);
    if (!pilot) return res.status(404).json({ error: 'Pilot not found' });
    
    if (req.user.role === 'startup' && pilot.startup_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const challenges = db.getAll('challenges');
    const users = db.getAll('users');
    pilot = {
      ...pilot,
      challenge_title: challenges.find(c => c.id === pilot.challenge_id)?.title || null,
      startup_name: users.find(u => u.id === pilot.startup_id)?.full_name || null,
    };
    
    const kpis = db.getAll('kpis').filter(k => k.pilot_id === req.params.id);
    const snapshots = db.getAll('kpi_snapshots')
      .filter(ks => ks.pilot_id === req.params.id)
      .map(ks => ({
        ...ks,
        kpi_name: db.getAll('kpis').find(k => k.id === ks.kpi_id)?.name || null,
      }));
    
    res.json({ ...pilot, kpis, snapshots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('government'), (req, res) => {
  try {
    const id = uuidv4();
    const { proposal_id, challenge_id, startup_id, start_date, end_date, budget_allocated, summary } = req.body;
    
    const pilot = db.insert('pilots', {
      id,
      proposal_id,
      challenge_id,
      startup_id,
      start_date: start_date || null,
      end_date: end_date || null,
      budget_allocated: budget_allocated || null,
      budget_spent: 0,
      progress_percentage: 0,
      summary: summary || null,
      outcomes: null,
      lessons_learned: null,
    });
    
    db.update('proposals', proposal_id, { status: 'piloting' });
    
    logActivity(req.user.id, 'create_pilot', 'pilot', id, { proposal_id });
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authenticate, authorize('government', 'admin'), (req, res) => {
  try {
    const { status } = req.body;
    const pilot = db.getPilotById(req.params.id);
    if (!pilot) return res.status(404).json({ error: 'Pilot not found' });
    
    db.update('pilots', req.params.id, { status });
    
    if (status === 'completed') {
      db.update('proposals', pilot.proposal_id, { status: 'completed' });
    }
    
    logActivity(req.user.id, 'update_pilot_status', 'pilot', req.params.id, { status });
    res.json({ message: 'Pilot status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, authorize('government', 'admin', 'startup'), (req, res) => {
  try {
    const { progress_percentage, summary, outcomes, lessons_learned, budget_spent } = req.body;
    db.update('pilots', req.params.id, {
      progress_percentage: progress_percentage || 0,
      summary: summary || null,
      outcomes: outcomes || null,
      lessons_learned: lessons_learned || null,
      budget_spent: budget_spent || 0,
    });
    res.json({ message: 'Pilot updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
