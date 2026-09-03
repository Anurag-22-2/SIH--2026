const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { authenticate, authorizeRoles } = require('../middleware/security');
const { DataAnonymizer } = require('../services/privacy.service');
const { AIService } = require('../services/ai.service');
const { ScreeningService } = require('../services/screening.service');
const { MatchmakingService } = require('../services/matchmaking.service');
const db = require('../db/store');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'govpilot-security-layer',
    localOllama: true,
    privacyMode: 'strict-anonymization',
    rateLimit: 'enabled',
  });
});

router.post('/anonymize', authenticate, authorizeRoles(['admin', 'gov', 'startup', 'expert']), (req, res) => {
  try {
    const { payload } = req.body || {};
    const sanitized = DataAnonymizer.sanitize(payload ?? req.body ?? '');
    res.json({ ok: true, anonymized: sanitized });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Sanitization failed.' });
  }
});

router.post('/local-ai/verify', authenticate, authorizeRoles(['admin', 'gov']), async (req, res) => {
  try {
    const { payload } = req.body || {};
    const result = await AIService.verifyLocalOnly(payload || {
      company: 'Staqu Technologies',
      officer: 'Sarah Chen',
      email: 'officer@govpilot.gov',
      phone: '+91 98765 43210',
      amount: '₹50 lakh',
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Local AI validation failed.' });
  }
});

router.post('/screen-startup', authenticate, authorizeRoles(['admin', 'gov']), (req, res) => {
  try {
    const startup = req.body || {};
    const result = ScreeningService.autoScreenStartup(startup);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Startup screening failed.' });
  }
});

router.post('/gfr-exemption', authenticate, authorizeRoles(['admin', 'gov']), (req, res) => {
  try {
    const { startup, challenge } = req.body || {};
    const result = ScreeningService.generateGfrExemptionDraft(startup || {}, challenge || {});
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to generate GFR exemption draft.' });
  }
});

router.post('/matchmaking', authenticate, authorizeRoles(['admin', 'gov']), async (req, res) => {
  try {
    const { challenge, startups } = req.body || {};
    const existingStartups = startups && startups.length ? startups : await db.getAll('users').then((rows) => rows.filter((u) => u.role === 'startup'));
    const results = MatchmakingService.getTopMatches(challenge || {}, existingStartups || [], 5);
    res.json({ ok: true, matches: results });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Matchmaking failed.' });
  }
});

router.post('/milestones/extract', authenticate, authorizeRoles(['admin', 'gov', 'startup']), async (req, res) => {
  try {
    const { proposalText, startupName, challengeTitle, proposalId } = req.body || {};
    const aiResult = await AIService.extractMilestonesFromProposal({ proposalText, startupName, challengeTitle });

    if (proposalId) {
      const milestoneRows = Array.isArray(aiResult.deliverables) ? aiResult.deliverables : [];
      for (const item of milestoneRows) {
        try {
          await db.insert('milestones', {
            id: uuidv4(),
            proposal_id: proposalId,
            title: item.title,
            deliverable: item.description,
            deadline_days: Number(item.timelineDays || 30),
            status: item.status || 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch (insertError) {
          console.warn('Milestone insert skipped because table is not available yet.', insertError.message);
        }
      }
    }

    res.json({ ok: true, ...aiResult });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Milestone extraction failed.' });
  }
});

module.exports = router;
