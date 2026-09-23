function validateProposal(req, res, next) {
  const {
    challenge_id,
    title,
    description,
    solution_approach,
    timeline_weeks,
    budget_estimate,
  } = req.body || {};
  const errors = {};

  if (typeof challenge_id !== 'string' || !challenge_id.trim()) {
    errors.challenge_id = 'Challenge ID is required.';
  }
  if (typeof title !== 'string' || !title.trim()) {
    errors.title = 'Title is required.';
  } else if (title.trim().length < 5 || title.trim().length > 200) {
    errors.title = 'Title must be between 5 and 200 characters.';
  }
  if (typeof description !== 'string' || description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters.';
  }
  if (typeof solution_approach !== 'string' || !solution_approach.trim()) {
    errors.solution_approach = 'Solution approach is required.';
  }
  if (!Number.isInteger(timeline_weeks) || timeline_weeks < 1 || timeline_weeks > 200) {
    errors.timeline_weeks = 'Timeline must be an integer between 1 and 200 weeks.';
  }
  if (
    typeof budget_estimate !== 'number' ||
    !Number.isFinite(budget_estimate) ||
    budget_estimate <= 0 ||
    budget_estimate > 100000000
  ) {
    errors.budget_estimate = 'Budget must be between 1 and 100,000,000.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  return next();
}

module.exports = { validateProposal };
