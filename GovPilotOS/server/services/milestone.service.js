const { DataAnonymizer } = require('../anonymizer');
const { AIService } = require('./ai.service');

class MilestoneService {
  static buildFallbackMilestones({ startupName, challengeTitle }) {
    const owner = startupName || 'startup';
    return [
      {
        title: 'Requirements validation',
        description: `Validate the scope and technical requirements for ${challengeTitle || 'the identified challenge'}.`,
        timelineDays: 14,
        owner,
        acceptanceCriteria: 'Requirement checklist approved by the government officer and technical reviewer.',
        status: 'pending',
      },
      {
        title: 'Prototype and pilot build',
        description: `Build the first working prototype and pilot design for ${challengeTitle || 'the challenge'}.`,
        timelineDays: 35,
        owner,
        acceptanceCriteria: 'Prototype demonstrated against challenge criteria and accepted by the review team.',
        status: 'pending',
      },
      {
        title: 'Deployment readiness and testing',
        description: `Test deployment readiness, operational safeguards, and data handling for ${challengeTitle || 'the challenge'}.`,
        timelineDays: 21,
        owner,
        acceptanceCriteria: 'Testing, audit, and access-control checklist completed successfully.',
        status: 'pending',
      },
    ];
  }

  static async generateMilestones({ proposalText = '', challengeTitle = '', startupName = '', challenge = {}, startup = {} }) {
    const inputText = proposalText || JSON.stringify({ challengeTitle, startupName, challenge, startup }, null, 2);
    const safeText = DataAnonymizer.sanitize(inputText);

    const result = await AIService.generateStructuredText({
      input: safeText,
      schema: {
        deliverables: [
          {
            title: 'string',
            description: 'string',
            timelineDays: 'number',
            owner: 'string',
            acceptanceCriteria: 'string',
            status: 'pending',
          },
        ],
      },
      allowCloudFallback: true,
      sanitize: true,
    });

    const rawDeliverables = result?.data?.deliverables || result?.data?.milestones || [];
    if (Array.isArray(rawDeliverables) && rawDeliverables.length > 0) {
      const normalized = rawDeliverables.map((item, index) => ({
        title: String(item.title || item.name || `Milestone ${index + 1}`),
        description: String(item.description || item.summary || 'Define and complete the milestone scope.'),
        timelineDays: Number(item.timelineDays || item.days || item.estimatedDays || 14),
        owner: String(item.owner || startupName || 'startup'),
        acceptanceCriteria: String(item.acceptanceCriteria || item.acceptance_criteria || 'Review board acceptance and evidence submission.'),
        status: String(item.status || 'pending'),
      }));

      return {
        provider: result?.provider || 'local',
        localOnly: result?.localOnly ?? true,
        milestones: normalized,
      };
    }

    return {
      provider: result?.provider || 'local',
      localOnly: result?.localOnly ?? true,
      milestones: this.buildFallbackMilestones({ startupName, challengeTitle }),
    };
  }
}

module.exports = { MilestoneService };
