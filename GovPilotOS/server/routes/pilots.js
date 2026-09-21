const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();
const db = require('../db/store');

async function getPilotKpis(pilotId) {
  const [kpis, snapshots] = await Promise.all([
    db.getAll('kpis'),
    db.getAll('kpi_snapshots'),
  ]);
  const pilotKpis = kpis.filter((kpi) => kpi.pilot_id === pilotId);
  const enrichedSnapshots = snapshots
    .filter((snapshot) => snapshot.pilot_id === pilotId)
    .map((snapshot) => ({
      ...snapshot,
      kpi_name: kpis.find((kpi) => kpi.id === snapshot.kpi_id)?.name || null,
    }));
  return { kpis: pilotKpis, snapshots: enrichedSnapshots };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, proposal_id } = req.query;
    let results = await db.getAll('pilots');
    
    if (req.user.role === 'startup') {
      results = results.filter(p => p.startup_id === req.user.id);
    }
    
    if (status) results = results.filter(p => p.status === status);
    if (proposal_id) results = results.filter(p => p.proposal_id === proposal_id);
    
    const challenges = await db.getAll('challenges');
    const users = await db.getAll('users');
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

router.get('/:id', authenticate, async (req, res) => {
  try {
    let pilot = (await db.getAll('pilots')).find(p => p.id === req.params.id);
    if (!pilot) return res.status(404).json({ error: 'Pilot not found' });
    
    if (req.user.role === 'startup' && pilot.startup_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const challenges = await db.getAll('challenges');
    const users = await db.getAll('users');
    pilot = {
      ...pilot,
      challenge_title: challenges.find(c => c.id === pilot.challenge_id)?.title || null,
      startup_name: users.find(u => u.id === pilot.startup_id)?.full_name || null,
    };
    
    const { kpis, snapshots } = await getPilotKpis(req.params.id);
    
    res.json({ ...pilot, kpis, snapshots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('government'), async (req, res) => {
  try {
    const id = uuidv4();
    const { proposal_id, challenge_id, startup_id, start_date, end_date, budget_allocated, summary } = req.body;
    
    const pilot = await db.insert('pilots', {
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
    
    await db.update('proposals', proposal_id, { status: 'piloting' });
    
    logActivity(req.user.id, 'create_pilot', 'pilot', id, { proposal_id });
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authenticate, authorize('government', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const pilot = await db.getPilotById(req.params.id);
    if (!pilot) return res.status(404).json({ error: 'Pilot not found' });
    
    await db.update('pilots', req.params.id, { status });
    
    if (status === 'completed') {
      await db.update('proposals', pilot.proposal_id, { status: 'completed' });
    }
    
    logActivity(req.user.id, 'update_pilot_status', 'pilot', req.params.id, { status });
    res.json({ message: 'Pilot status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, authorize('government', 'admin', 'startup'), async (req, res) => {
  try {
    const { progress_percentage, summary, outcomes, lessons_learned, budget_spent } = req.body;
    await db.update('pilots', req.params.id, {
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
