const { DataAnonymizer } = require('./privacy.service');

class ScreeningService {
  static validateDpiitNumber(value) {
    const raw = String(value || '').trim();
    if (!raw) return false;
    const cleaned = raw.replace(/\s+/g, '').toUpperCase();
    return /^DIPP\d{5,}$/.test(cleaned) || /^[A-Z]{2,3}\d{5,10}$/.test(cleaned);
  }

  static evaluateTrlLevel(value) {
    const trl = Number(value || 0);
    if (!Number.isFinite(trl)) return 0;
    return trl;
  }

  static autoScreenStartup(startup = {}) {
    const trl = this.evaluateTrlLevel(startup.trlLevel ?? startup.trl_level ?? startup.trl);
    const dpiitValid = this.validateDpiitNumber(startup.dpiitNumber ?? startup.dpiit_number);
    const hasTechStack = Array.isArray(startup.techStack || startup.tech_stack) ? (startup.techStack || startup.tech_stack).length > 0 : Boolean(startup.techStack || startup.tech_stack);
    const teamSize = Number(startup.teamSize || startup.team_size || 0);
    const turnover = Number(startup.turnover || startup.annualTurnover || 0);
    const pastGovProjects = Array.isArray(startup.pastGovProjects || startup.past_gov_projects)
      ? (startup.pastGovProjects || startup.past_gov_projects).length
      : 0;

    let status = 'approved';
    const reasons = [];

    if (!dpiitValid) {
      status = 'flagged';
      reasons.push('DPIIT number is missing or malformed.');
    }

    if (trl < 4) {
      status = status === 'approved' ? 'rejected' : 'flagged';
      reasons.push('TRL must be at least 4 to qualify for public procurement screening.');
    }

    if (!hasTechStack) {
      status = status === 'approved' ? 'flagged' : 'flagged';
      reasons.push('Tech stack is absent or too thin for evaluation.');
    }

    if (teamSize <= 0) {
      reasons.push('Team size should be validated for execution capability.');
    }

    if (turnover > 0 && turnover > 200000000) {
      reasons.push('Turnover exceeds the reviewed eligibility threshold for early-stage pilot screening.');
    }

    const gfr = this.getGfrEligibility(startup);

    return {
      status,
      confidence: status === 'approved' ? 0.94 : status === 'flagged' ? 0.72 : 0.58,
      reasons: reasons.length ? reasons : ['No blocking issues identified.'],
      gfr,
      checks: {
        dpiit_valid: dpiitValid,
        trl_level: trl,
        team_size: teamSize,
        turnover,
        past_gov_projects: pastGovProjects,
        tech_stack_present: hasTechStack,
      },
      anonymizedSnapshot: DataAnonymizer.sanitize(startup),
    };
  }

  static getGfrEligibility(startup = {}) {
    const trl = this.evaluateTrlLevel(startup.trlLevel ?? startup.trl_level ?? startup.trl);
    const verified = Boolean(startup.verifiedStatus ?? startup.verified_status ?? startup.dpiitRecognized ?? startup.dpiit_recognized);
    const budget = Number(startup.challengeBudget ?? startup.budget ?? startup.budget_estimate ?? 0);

    const eligible = verified && trl >= 8 && trl <= 9 && budget <= 50_000_00;

    return {
      eligible,
      maxPilotBudgetInr: eligible ? Math.min(budget || 50_000_00, 50_000_00) : 0,
      clause: eligible
        ? 'GFR exemption approved for direct pilot sanction without a full tender cycle up to ₹50 lakh.'
        : 'GFR exemption is not triggered because DPIIT recognition, TRL 8–9, and a capped budget threshold are required.',
      rationale: eligible
        ? 'Startup is DPIIT-recognized, mature enough in TRL, and meets the capped budget threshold for direct procurement.'
        : 'Startup does not satisfy the dual conditions of DPIIT recognition and TRL 8–9 with a capped pilot budget.',
    };
  }

  static generateGfrExemptionDraft(startup = {}, challenge = {}) {
    const result = this.getGfrEligibility({ ...startup, challengeBudget: challenge.budget || challenge.budget_range || challenge.budget_min || 0 });

    if (!result.eligible) {
      return {
        eligible: false,
        draft: `The proposed procurement does not qualify for GFR exemption. Reason: the startup does not satisfy the required benchmark of DPIIT recognition, TRL 8-9 maturity, and pilot funding within ₹50 lakh.`,
        ...result,
      };
    }

    const timeline = challenge.duration_weeks ? `${challenge.duration_weeks} weeks` : '12 weeks';
    return {
      eligible: true,
      draft: `Pursuant to the GFR provision for direct procurement of innovative and DPIIT-recognized startups, this pilot qualifies for exemption from the standard tender process. The startup demonstrates a TRL level consistent with 8-9 maturity, has verified DPIIT recognition, and the proposed pilot budget is within the capped threshold of ₹50 lakh. The procurement is therefore justified for a time-bound pilot of ${timeline} to validate deployment readiness without a full tender cycle.`,
      ...result,
    };
  }
}

module.exports = { ScreeningService };
