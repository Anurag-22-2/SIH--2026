const express = require('express');
const { AIService } = require('../services/ai.service');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/matches', authenticate, authorize('government', 'admin'), async (req, res) => {
  try {
    const { challengeId } = req.query;
    const dataset = AIService.readDataset();
    const challenges = dataset.challenges || [];
    const startups = dataset.startups || [];

    const challenge = challenges.find((item) => item.id === challengeId) || challenges[0] || null;
    if (!challenge) {
      return res.status(404).json({ error: 'No challenge found for matchmaking.' });
    }

    const matches = AIService.getMatches({ challenge, startups });
    return res.json({ challenge, matches, count: matches.length });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Matchmaking failed.' });
  }
});

router.post('/predict-score', authenticate, authorize('government', 'admin', 'startup'), async (req, res) => {
  try {
    const startup = req.body?.startup || req.body || {};
    if (!startup || Object.keys(startup).length === 0) {
      return res.status(400).json({ error: 'Startup payload is required.' });
    }

    const result = AIService.calculatePredictiveSuccessScore(startup);
    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Predictive scoring failed.' });
  }
});

router.get('/blind-proposals', authenticate, authorize('expert'), async (req, res) => {
  try {
    const proposals = AIService.getBlindProposals();
    return res.json({
      ok: true,
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Blind proposal generation failed.' });
  }
});

module.exports = router;
