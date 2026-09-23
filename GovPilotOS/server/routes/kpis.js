const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();
const db = require('../db/store');

async function getKpisVisibleToUser(user) {
  const kpis = await db.getAll('kpis');
  if (user.role !== 'startup') return kpis;

  const pilots = await db.getAll('pilots');
  const pilotIds = new Set(
    pilots
      .filter((pilot) => pilot.startup_id === user.id)
      .map((pilot) => pilot.id),
  );
  return kpis.filter((kpi) => pilotIds.has(kpi.pilot_id));
}

router.get('/pilot/all', authenticate, async (req, res) => {
  try {
    res.json(await getKpisVisibleToUser(req.user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', authenticate, async (req, res) => {
  try {
    res.json(await getKpisVisibleToUser(req.user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pilot/:pilotId', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'startup') {
      const pilot = await db.getPilotById(req.params.pilotId);
      if (!pilot || pilot.startup_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const kpis = (await db.getAll('kpis')).filter(k => k.pilot_id === req.params.pilotId);
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('government'), async (req, res) => {
  try {
    const id = uuidv4();
    const { pilot_id, challenge_id, name, description, metric_type, unit, target_value, target_description, weight } = req.body;
    
    await db.insert('kpis', {
      id,
      pilot_id: pilot_id || null,
      challenge_id: challenge_id || null,
      name,
      description: description || null,
      metric_type,
      unit: unit || null,
      target_value,
      target_description: target_description || null,
      weight: weight || 1.0,
    });
    
    logActivity(req.user.id, 'create_kpi', 'kpi', id);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/snapshot', authenticate, authorize('government', 'startup'), async (req, res) => {
  try {
    const id = uuidv4();
    const { kpi_id, pilot_id, reported_value, reported_text, notes } = req.body;
    
    await db.insert('kpi_snapshots', {
      id,
      kpi_id,
      pilot_id,
      reported_value: reported_value || null,
      reported_text: reported_text || null,
      notes: notes || null,
      reported_by: req.user.id,
    });
    
    logActivity(req.user.id, 'create_kpi_snapshot', 'kpi_snapshot', id);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/snapshots/pilot/:pilotId', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'startup') {
      const pilot = await db.getPilotById(req.params.pilotId);
      if (!pilot || pilot.startup_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const kpis = await db.getAll('kpis');
    const snapshots = (await db.getAll('kpi_snapshots'))
      .filter(ks => ks.pilot_id === req.params.pilotId)
      .map(ks => ({
        ...ks,
        kpi_name: kpis.find(k => k.id === ks.kpi_id)?.name || null,
      }));
    
    snapshots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
