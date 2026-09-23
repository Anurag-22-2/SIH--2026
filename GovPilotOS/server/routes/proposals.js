const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize, logActivity } = require('../middleware/auth');
const { validateProposal } = require('../middleware/validators');
const { ProposalService } = require('../services/proposal.service');

const router = express.Router();
const db = require('../db/store');

router.get('/challenge/:challengeId', authenticate, async (req, res) => {
  try {
    const proposals = await db.getAll('proposals');
    let results = proposals.filter(p => p.challenge_id === req.params.challengeId);

    const users = await db.getAll('users');
    const evaluations = req.user.role === 'expert' ? await db.getAll('evaluations') : [];
    results = results.map(p => ({
      ...p,
      startup_name: users.find(u => u.id === p.startup_id)?.full_name || null,
      startup_org: users.find(u => u.id === p.startup_id)?.organization || null,
    }));

    if (req.user.role === 'startup') {
      results = results.filter(p => p.startup_id === req.user.id);
    }
    if (req.user.role === 'expert') {
      results = results
        .filter((proposal) => evaluations.some((evaluation) => evaluation.proposal_id === proposal.id && evaluation.expert_id === req.user.id))
        .map((proposal) => {
          const submitted = evaluations.some(
            (evaluation) =>
              evaluation.proposal_id === proposal.id &&
              evaluation.expert_id === req.user.id &&
              evaluation.status === 'submitted',
          );
          return submitted ? proposal : ProposalService.maskForExpert(proposal);
        });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/expert', authenticate, authorize('expert'), async (req, res) => {
  try {
    const proposals = await db.getAll('proposals');
    const users = await db.getAll('users');
    const evaluations = await db.getAll('evaluations');
    const assignedIds = new Set(
      evaluations.filter((evaluation) => evaluation.expert_id === req.user.id).map((evaluation) => evaluation.proposal_id),
    );
    const enriched = await ProposalService.enrichProposals(
      proposals.filter((proposal) => assignedIds.has(proposal.id)),
      users,
    );
    return res.json(enriched.map((proposal) => {
      const submitted = evaluations.some(
        (evaluation) => evaluation.proposal_id === proposal.id &&
          evaluation.expert_id === req.user.id && evaluation.status === 'submitted',
      );
      return submitted ? proposal : ProposalService.maskForExpert(proposal);
    }));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let proposals = await db.getAll('proposals');
    const users = await db.getAll('users');
    if (req.user.role === 'startup') {
      proposals = proposals.filter((proposal) => proposal.startup_id === req.user.id);
    }
    proposals = await ProposalService.enrichProposals(proposals, users);
    if (req.user.role === 'expert') {
      const evaluations = await db.getAll('evaluations');
      const assignedIds = new Set(
        evaluations
          .filter((evaluation) => evaluation.expert_id === req.user.id)
          .map((evaluation) => evaluation.proposal_id),
      );
      proposals = proposals.map((proposal) => {
        if (!assignedIds.has(proposal.id)) return null;
        const submitted = evaluations.some(
          (evaluation) =>
            evaluation.proposal_id === proposal.id &&
            evaluation.expert_id === req.user.id &&
            evaluation.status === 'submitted',
        );
        return submitted ? proposal : ProposalService.maskForExpert(proposal);
      }).filter(Boolean);

    }
    return res.json(proposals);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    let proposal = await db.getProposalById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const users = await db.getAll('users');
    proposal = {
      ...proposal,
      startup_name: users.find(u => u.id === proposal.startup_id)?.full_name || null,
      startup_org: users.find(u => u.id === proposal.startup_id)?.organization || null,
    };

    proposal = await ProposalService.enrichProposal(proposal, users);

    if (req.user.role === 'startup' && proposal.startup_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'expert') {
      const evaluations = await db.getAll('evaluations');
      const assigned = evaluations.some(
        (evaluation) =>
          evaluation.proposal_id === proposal.id &&
          evaluation.expert_id === req.user.id,
      );
      if (!assigned) return res.status(403).json({ error: 'Forbidden' });
      const submitted = evaluations.some(
        (evaluation) =>
          evaluation.proposal_id === proposal.id &&
          evaluation.expert_id === req.user.id &&
          evaluation.status === 'submitted',
      );
      if (!submitted) proposal = ProposalService.maskForExpert(proposal);
    }

    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('startup'), validateProposal, async (req, res) => {
  try {
    const id = uuidv4();
    const { challenge_id, title, description, solution_approach, timeline_weeks, budget_estimate, team_description, past_projects, trl_level } = req.body;
    const automation = ProposalService.getAutomation(
      { budget_estimate, trl_level },
      req.user,
    );

    const proposal = await db.insert('proposals', {
      id,
      challenge_id,
      startup_id: req.user.id,
      title,
      description,
      solution_approach,
      timeline_weeks,
      budget_estimate,
      team_description,
      past_projects: past_projects || null,
      trl_level: trl_level || null,
      success_probability: automation.success_probability,
      eligible_for_direct_gfr_exemption: automation.eligible_for_direct_gfr_exemption,
      status: 'submitted',
    });

    logActivity(req.user.id, 'submit_proposal', 'proposal', id, { title });
    res.status(201).json({ id, title, ...automation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authenticate, authorize('government', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const proposal = await db.getProposalById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    await db.update('proposals', req.params.id, { status });
    logActivity(req.user.id, 'update_proposal_status', 'proposal', req.params.id, { status });
    res.json({ message: 'Proposal status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;