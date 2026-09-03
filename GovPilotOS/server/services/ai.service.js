const fs = require('fs');
const path = require('path');
const { DataAnonymizer } = require('../anonymizer');

const DATASET_PATH = path.join(__dirname, '..', 'data', 'govpilot-dataset.json');

function parseCurrency(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.]/g, '');
    const parsed = Number(normalized || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

class AIService {
  static async generateStructuredText({ input, prompt = '', schema = {}, allowCloudFallback = true }) {
    const safeInput = DataAnonymizer.sanitize(input ?? prompt);
    const requestPrompt = [
      'Return only valid JSON matching this schema:',
      JSON.stringify(schema),
      'Input:',
      typeof safeInput === 'string' ? safeInput : JSON.stringify(safeInput),
    ].join('\n');

    try {
      const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'llama3',
          prompt: requestPrompt,
          stream: false,
          format: 'json',
        }),
      });
      if (!response.ok) throw new Error(`Ollama request failed with status ${response.status}`);
      const payload = await response.json();
      const raw = payload.response || payload;
      return { provider: 'ollama', localOnly: true, data: this.parseJsonPayload(raw) };
    } catch (error) {
      if (!allowCloudFallback || !process.env.CLOUD_LLM_ENDPOINT || !process.env.CLOUD_LLM_API_KEY) {
        throw error;
      }
      const response = await fetch(process.env.CLOUD_LLM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CLOUD_LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.CLOUD_LLM_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: requestPrompt }],
        }),
      });
      if (!response.ok) throw new Error(`Cloud LLM request failed with status ${response.status}`);
      const payload = await response.json();
      const raw = payload.choices?.[0]?.message?.content || payload;
      return {
        provider: 'cloud',
        localOnly: false,
        fallbackReason: error.message,
        data: this.parseJsonPayload(raw),
      };
    }
  }

  static parseJsonPayload(raw) {
    if (!raw) return null;
    const text = String(raw).trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
    try {
      return JSON.parse(text);
    } catch (error) {
      return { raw: text };
    }
  }

  static async extractMilestonesFromProposal({ proposalText, startupName, challengeTitle }) {
    const result = await this.generateStructuredText({
      input: proposalText || `${startupName || 'startup'} proposal for ${challengeTitle || 'challenge'}`,
      schema: { deliverables: [{ title: 'string', description: 'string', timelineDays: 'number', status: 'pending' }] },
    });
    const deliverables = result.data?.deliverables;
    return {
      provider: result.provider,
      localOnly: result.localOnly,
      deliverables: Array.isArray(deliverables) && deliverables.length ? deliverables : [{
        title: 'Requirements validation',
        description: 'Validate requirements and technical feasibility.',
        timelineDays: 14,
        owner: startupName || 'startup',
        acceptanceCriteria: 'Requirement checklist approved by government officer.',
        status: 'pending',
      }],
    };
  }

  static async verifyLocalOnly(dataPacket) {
    const anonymizedPacket = DataAnonymizer.sanitize(dataPacket);
    try {
      const result = await this.generateStructuredText({
        input: anonymizedPacket,
        schema: { status: 'ok', localOnly: true, masked: true },
        allowCloudFallback: false,
      });
      return { localOnly: true, rawPacketLeakDetected: false, anonymizedPacket, validation: result.data };
    } catch (error) {
      return {
        localOnly: false,
        rawPacketLeakDetected: true,
        anonymizedPacket,
        validation: { status: 'error', message: error.message },
      };
    }
  }

  static readDataset() {
    try {
      const raw = fs.readFileSync(DATASET_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        startups: Array.isArray(parsed.startups) ? parsed.startups : [],
        proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
        challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
      };
    } catch (error) {
      return { startups: [], proposals: [], challenges: [] };
    }
  }

  static calculatePredictiveSuccessScore(startup = {}) {
    const trl = Number(startup.trlLevel ?? startup.trl ?? startup.technologyReadinessLevel ?? 0);
    const teamSize = Number(startup.teamSize ?? startup.team_size ?? startup.teamCapacity ?? 0);
    const projectHistory = Array.isArray(startup.pastGovProjects)
      ? startup.pastGovProjects.length
      : Number(startup.pastGovProjects ?? startup.govProjectCount ?? 0);
    const hasGoodTrackRecord = Boolean(startup.dpiitRecognized || startup.dpiitNumber);

    const trlScore = trl >= 8 ? 42 + (trl - 8) * 6 : trl >= 6 ? 25 + (trl - 6) * 8 : Math.max(10, trl * 4);
    const projectScore = Math.min(projectHistory * 18, 28);
    const teamScore = clamp((teamSize / 80) * 20, 0, 20);
    const verificationScore = hasGoodTrackRecord ? 10 : 0;

    const successScore = clamp(trlScore + projectScore + teamScore + verificationScore, 0, 100);

    return {
      startupId: startup.id || startup.name || 'unknown',
      startupName: startup.name || startup.legalName || 'Unknown Startup',
      score: Number(successScore.toFixed(1)),
      probability: `${Number(successScore.toFixed(1))}%`,
      breakdown: {
        trl: Number(trlScore.toFixed(1)),
        governmentHistory: Number(projectScore.toFixed(1)),
        teamCapacity: Number(teamScore.toFixed(1)),
        verification: Number(verificationScore.toFixed(1)),
      },
      eligibleForDirectGfrExemption: this.isEligibleForDirectGfrExemption(startup),
    };
  }

  static isEligibleForDirectGfrExemption(startup = {}) {
    const dpiitValue = startup.dpiitNumber || startup.dpiitRecognized || startup.dpiitRecognitionNumber || '';
    const budget = parseCurrency(startup.budget ?? startup.budgetEstimate ?? startup.budget_estimate ?? startup.projectBudget ?? 0);
    const isValidDpiit = typeof dpiitValue === 'string'
      ? /^DIPP[0-9A-Z-]+$/i.test(dpiitValue.trim()) || /^\d{6,}$/.test(dpiitValue.trim())
      : Boolean(dpiitValue);

    return Boolean(isValidDpiit && budget <= 5000000);
  }

  static getMatches({ challenge, startups = [] }) {
    const normalizedChallenge = challenge || {};
    const challengeKeywords = [
      ...(Array.isArray(normalizedChallenge.keywords) ? normalizedChallenge.keywords : []),
      normalizedChallenge.title,
      normalizedChallenge.description,
      normalizedChallenge.department,
    ].flatMap((value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/)).filter(Boolean);

    const challengeSet = new Set(challengeKeywords);

    return startups
      .map((startup) => {
        const tokens = [
          startup.name,
          startup.legalName,
          startup.sector,
          ...(Array.isArray(startup.techStack) ? startup.techStack : []),
          ...(Array.isArray(startup.pastGovProjects) ? startup.pastGovProjects.map((project) => project.title || project.department || '') : []),
        ]
          .flatMap((value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/))
          .filter(Boolean);

        const startupSet = new Set(tokens);
        const overlap = [...challengeSet].filter((token) => startupSet.has(token));
        const overlapScore = overlap.length;
        const trlBonus = Number(startup.trlLevel || 0) >= 8 ? 15 : Number(startup.trlLevel || 0) >= 6 ? 7 : 0;
        const govBonus = Array.isArray(startup.pastGovProjects) && startup.pastGovProjects.length > 0 ? 10 : 0;
        const matchScore = clamp(overlapScore * 18 + trlBonus + govBonus, 0, 100);

        return {
          startupId: startup.id,
          startupName: startup.name || startup.legalName,
          sector: startup.sector,
          trlLevel: startup.trlLevel,
          matchScore: Number(matchScore.toFixed(1)),
          overlapKeywords: overlap.slice(0, 8),
          eligibleForDirectGfrExemption: this.isEligibleForDirectGfrExemption(startup),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  static getBlindProposals() {
    const { proposals } = this.readDataset();
    return proposals.map((proposal) => DataAnonymizer.sanitize(proposal));
  }

  static getChallengeMatches(challengeId) {
    const { startups, challenges } = this.readDataset();
    const challenge = challenges.find((item) => item.id === challengeId) || challenges[0] || null;
    if (!challenge) {
      return { challenge: null, matches: [] };
    }

    return {
      challenge,
      matches: this.getMatches({ challenge, startups }),
    };
  }
}

module.exports = { AIService };
