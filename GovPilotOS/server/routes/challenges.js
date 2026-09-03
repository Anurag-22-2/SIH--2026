const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/store');
const { authenticate, authorize } = require('../middleware/auth');
const { AIProviderFactory } = require('../services/ai-provider.service');

const router = express.Router();

/* ------------------------------------------------------------------ */
/* AI Problem Analysis Endpoint                                      */
/* ------------------------------------------------------------------ */

router.post('/analyze-problem', async (req, res) => {
  try {
    const input = req.body || {};
    if (!input.description && !input.problem_statement && !input.title) {
      return res.status(400).json({ error: 'Please describe the problem to analyze.' });
    }

    const provider = AIProviderFactory.getProvider();
    const result = await provider.analyzeProblem(input);

    return res.json({
      ok: true,
      provider: provider.constructor.name,
      confidence: result.ai_confidence || 88,
      analysis: result,
    });
  } catch (err) {
    console.error('AI problem analysis error:', err);
    return res.status(500).json({ error: err.message || 'AI problem analysis failed.' });
  }
});

/* ------------------------------------------------------------------ */
/* Search Challenges Endpoint                                         */
/* ------------------------------------------------------------------ */

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await db.searchChallenges(q);
    res.json({ count: results.length, challenges: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Challenges CRUD & Flow Endpoints                                   */
/* ------------------------------------------------------------------ */

router.get('/', async (req, res) => {
  try {
    const challenges = await db.getAll('challenges');
    challenges.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    res.json({ count: challenges.length, challenges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const now = new Date().toISOString();
    const sector = body.sector || 'Urban Waste';
    const sectorCode = sector === 'PWD' ? 'PWD' : sector === 'Urban Waste' ? 'UWM' : 'WQM';
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);

    const challenge = await db.insert('challenges', {
      id: body.id || 'CH-' + uuidv4().slice(0, 8),
      challenge_code: body.challenge_code || `MSINS/${sectorCode}/${year}/${seq}`,
      title: body.title || 'New Innovation Challenge',
      description: body.description || body.problem_statement || '',
      problem_statement: body.problem_statement || body.description || '',
      desired_outcomes: body.desired_outcomes || '',
      success_criteria: body.success_criteria || '',
      sector,
      department: body.department || 'Government Department',
      district: body.district || body.location || 'Maharashtra',
      budget_range: body.budget_range || (body.budget_min ? `₹${(body.budget_min/100000).toFixed(0)}L - ₹${((body.budget_max||5000000)/100000).toFixed(0)}L` : '₹25 Lakhs – ₹50 Lakhs'),
      budget_min: Number(body.budget_min || 2500000),
      budget_max: Number(body.budget_max || 5000000),
      duration_weeks: Number(body.duration_weeks || 24),
      status: body.status || 'draft',
      priority: body.priority || 'medium',
      contact_person: body.contact_person || 'Nodal Innovation Officer',
      tags: body.tags || 'innovation, civic, pilot',
      original_problem: body.original_problem || {
        title: body.title,
        description: body.description,
        department: body.department,
        location: body.district || body.location,
      },
      ai_analysis: body.ai_analysis || null,
      created_by: req.user?.id || body.created_by || 'gov-user',
      created_at: now,
      updated_at: now,
    });

    if (body.ai_analysis) {
      await db.saveAiAnalysis(
        challenge.id,
        body.original_problem || { title: body.title, description: body.description },
        body.ai_analysis,
        'MockAIProvider',
        'default',
        body.ai_analysis.ai_confidence || 88,
        challenge.created_by
      );
    }

    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const challenge = await db.getChallengeById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const aiHistory = await db.getAiHistory(challenge.id);
    const userRole = req.user?.role || 'startup';
    const reviews = await db.getChallengeReviews(challenge.id, userRole);

    res.json({
      ...challenge,
      ai_history: aiHistory,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await db.update('challenges', req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Challenge not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const challenge = await db.getChallengeById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const input = req.body?.input || challenge.original_problem || {
      title: challenge.title,
      description: challenge.description || challenge.problem_statement,
      department: challenge.department,
      location: challenge.district,
    };

    const provider = AIProviderFactory.getProvider();
    const result = await provider.analyzeProblem(input);

    const savedAnalysis = await db.saveAiAnalysis(
      challenge.id,
      input,
      result,
      provider.constructor.name,
      'default',
      result.ai_confidence || 88,
      req.user?.id || 'gov-user'
    );

    const updated = await db.update('challenges', challenge.id, {
      ai_analysis: result,
      problem_statement: result.problem_statement || challenge.problem_statement,
      desired_outcomes: Array.isArray(result.desired_outcomes) ? result.desired_outcomes.join('; ') : challenge.desired_outcomes,
    });

    res.json({
      ok: true,
      analysis: result,
      record: savedAnalysis,
      challenge: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/regenerate-analysis', async (req, res) => {
  try {
    const challenge = await db.getChallengeById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const input = req.body?.input || challenge.original_problem || {
      title: challenge.title,
      description: challenge.description || challenge.problem_statement,
    };

    const provider = AIProviderFactory.getProvider();
    const result = await provider.analyzeProblem(input);

    const savedAnalysis = await db.saveAiAnalysis(
      challenge.id,
      input,
      result,
      provider.constructor.name,
      'default',
      result.ai_confidence || 88,
      req.user?.id || 'gov-user'
    );

    await db.update('challenges', challenge.id, {
      ai_analysis: result,
    });

    const history = await db.getAiHistory(challenge.id);
    res.json({
      ok: true,
      analysis: result,
      record: savedAnalysis,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/analysis-history', async (req, res) => {
  try {
    const history = await db.getAiHistory(req.params.id);
    res.json({ count: history.length, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const publishedBy = req.user?.id || req.body?.published_by || 'gov-user';
    const updated = await db.publishChallenge(req.params.id, publishedBy);
    if (!updated) return res.status(404).json({ error: 'Challenge not found' });
    res.json({
      ok: true,
      message: 'Challenge published successfully and is now live for startup discovery.',
      challenge: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const role = req.user?.role || 'startup';
    const reviews = await db.getChallengeReviews(req.params.id, role);
    res.json({ count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reviews', async (req, res) => {
  try {
    const body = req.body || {};
    const review = await db.addChallengeReview({
      challenge_id: req.params.id,
      reviewer_id: req.user?.id || body.reviewer_id || 'expert-user',
      reviewer_name: req.user?.full_name || body.reviewer_name || 'Expert Reviewer',
      reviewer_role: req.user?.role || body.reviewer_role || 'expert',
      rating: body.rating || 5,
      comment: body.comment || '',
      is_private: body.is_private ?? false,
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
