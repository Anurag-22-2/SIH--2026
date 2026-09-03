const { AIService } = require('./ai.service');

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getProjectCount(startup = {}) {
  if (Array.isArray(startup.pastGovProjects)) return startup.pastGovProjects.length;
  if (Array.isArray(startup.past_government_projects)) return startup.past_government_projects.length;
  return toNumber(startup.govProjectCount ?? startup.past_projects_count, 0);
}

function getTurnover(startup = {}) {
  return toNumber(
    startup.turnover ??
      startup.annual_turnover ??
      startup.lastYearTurnover ??
      startup.financials?.lastYearTurnover,
    0,
  );
}

class ProposalService {
  static getStartupSnapshot(startup = {}, proposal = {}) {
    return {
      ...startup,
      id: startup.id || proposal.startup_id,
      name: startup.name || startup.organization || startup.organization_name,
      dpiitNumber: startup.dpiitNumber || startup.dpiit_number,
      dpiitRecognized: startup.dpiitRecognized ?? startup.dpiit_verified,
      trlLevel: startup.trlLevel ?? startup.trl_level ?? proposal.trl_level,
      teamSize: startup.teamSize ?? startup.team_size,
      turnover: getTurnover(startup),
      pastGovProjects: startup.pastGovProjects || startup.past_government_projects || [],
    };
  }

  static calculateSuccessProbability(startup = {}, proposal = {}) {
    const snapshot = this.getStartupSnapshot(startup, proposal);
    const trl = toNumber(snapshot.trlLevel);
    const projects = getProjectCount(snapshot);
    const teamSize = toNumber(snapshot.teamSize);
    const turnover = getTurnover(snapshot);

    const trlScore = trl >= 9 ? 40 : trl >= 8 ? 34 : trl >= 6 ? 24 : trl * 4;
    const projectScore = Math.min(projects * 12, 24);
    const teamScore = Math.min(teamSize / 5, 20);
    const turnoverScore = turnover >= 20_000_000 ? 16 : turnover >= 5_000_000 ? 10 : turnover > 0 ? 5 : 0;
    const score = Math.max(0, Math.min(100, trlScore + projectScore + teamScore + turnoverScore));

    return {
      score: Number(score.toFixed(1)),
      probability: `${Number(score.toFixed(1))}%`,
      breakdown: { trl: trlScore, governmentProjects: projectScore, teamCapacity: Number(teamScore.toFixed(1)), turnover: turnoverScore },
    };
  }

  static isEligibleForDirectGfrExemption(startup = {}, proposal = {}) {
    const snapshot = this.getStartupSnapshot(startup, proposal);
    const dpiit = String(snapshot.dpiitNumber || '').trim();
    const recognized = snapshot.dpiitRecognized !== false;
    const validDpiit = recognized && /^(DIPP|DPIIT)[A-Z0-9-]+$/i.test(dpiit);
    const trl = toNumber(snapshot.trlLevel);
    const budget = toNumber(proposal.budget_estimate ?? proposal.budgetEstimate ?? proposal.budget);

    return validDpiit && (trl === 8 || trl === 9) && budget <= 5_000_000;
  }

  static getAutomation(proposal, startup) {
    const success = this.calculateSuccessProbability(startup, proposal);
    const eligible = this.isEligibleForDirectGfrExemption(startup, proposal);
    return {
      success_probability: success.score,
      success_probability_breakdown: success.breakdown,
      eligible_for_direct_gfr_exemption: eligible,
    };
  }

  static async enrichProposal(proposal, users = []) {
    const startup = users.find((user) => user.id === proposal.startup_id) || {};
    return { ...proposal, ...this.getAutomation(proposal, startup) };
  }

  static async enrichProposals(proposals, users = []) {
    return Promise.all(proposals.map((proposal) => this.enrichProposal(proposal, users)));
  }

  static maskForExpert(proposal) {
    const masked = { ...proposal };
    delete masked.startup_name;
    delete masked.startup_org;
    delete masked.founder;
    delete masked.founder_name;
    delete masked.founder_email;
    delete masked.contact_email;
    delete masked.logo;
    delete masked.logo_url;
    delete masked.startup_id;
    masked.masked_company = '[MASKED_COMPANY]';
    masked.masked_founder = '[MASKED_FOUNDER]';
    masked.is_blinded = true;
    return masked;
  }
}

module.exports = { ProposalService };
