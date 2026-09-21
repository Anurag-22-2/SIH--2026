const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize, logActivity } = require('../middleware/auth');

const router = express.Router();
const db = require('../db/store');

router.get('/proposal/:proposalId', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'startup') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    let results = (await db.getAll('evaluations')).filter(e => e.proposal_id === req.params.proposalId);
    
    const users = await db.getAll('users');
    results = results.map(e => ({
      ...e,
      expert_name: users.find(u => u.id === e.expert_id)?.full_name || null,
    }));
    
    if (req.user.role === 'expert') {
      results = results.filter(e => e.expert_id === req.user.id);
    }
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('expert'), async (req, res) => {
  try {
    const id = uuidv4();
    const { proposal_id, innovation_score, feasibility_score, impact_score, overall_comment, recommendation, confidence_level } = req.body;
    
    const existing = (await db.getAll('evaluations')).find(e => e.proposal_id === proposal_id && e.expert_id === req.user.id);
    const evalData = {
      id: existing ? existing.id : id,
      proposal_id,
      expert_id: req.user.id,
      innovation_score,
      feasibility_score,
      impact_score,
      overall_comment,
      recommendation,
      confidence_level,
      status: 'submitted',
    };
    
    if (existing) {
      await db.update('evaluations', existing.id, evalData);
    } else {
      await db.insert('evaluations', evalData);
    }
    
    const evals = (await db.getAll('evaluations')).filter(e => e.proposal_id === proposal_id);
    const avgInnovation = evals.reduce((a, e) => a + e.innovation_score, 0) / evals.length;
    const avgFeasibility = evals.reduce((a, e) => a + e.feasibility_score, 0) / evals.length;
    const avgImpact = evals.reduce((a, e) => a + e.impact_score, 0) / evals.length;
    await db.update('proposals', proposal_id, {
      innovation_score: avgInnovation,
      feasibility_score: avgFeasibility,
      impact_score: avgImpact,
      overall_score: ((avgInnovation + avgFeasibility + avgImpact) / 3).toFixed(2),
    });
    
    logActivity(req.user.id, 'submit_evaluation', 'evaluation', evalData.id, { proposal_id });
    res.status(201).json({ id: evalData.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
