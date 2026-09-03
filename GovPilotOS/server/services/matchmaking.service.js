class MatchmakingService {
  static tokenize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)
      .filter((token) => !this.stopWords.has(token));
  }

  static get stopWords() {
    return new Set([
      'the', 'and', 'for', 'with', 'into', 'this', 'that', 'from', 'their', 'there', 'have', 'been',
      'more', 'than', 'will', 'must', 'could', 'should', 'through', 'using', 'about', 'over', 'under',
      'after', 'before', 'across', 'among', 'within', 'without', 'system', 'systems', 'service', 'services',
      'startup', 'government', 'public', 'private', 'technology', 'technologies', 'digital', 'platform', 'solution',
      'solutions', 'department', 'process', 'processes', 'state', 'urban', 'citizen', 'support', 'improve',
      'reduce', 'monitor', 'intelligence', 'based', 'using', 'powered', 'ai'
    ]);
  }

  static normalizeTokens(items = []) {
    const set = new Set();
    for (const item of items) {
      for (const token of this.tokenize(item)) set.add(token);
    }
    return [...set];
  }

  static buildVector(tokens, corpus) {
    const tokenSet = new Set(tokens);
    const vector = {};
    for (const key of corpus) {
      vector[key] = tokenSet.has(key) ? 1 : 0;
    }
    return vector;
  }

  static cosineSimilarity(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let numerator = 0;
    let magA = 0;
    let magB = 0;
    for (const key of keys) {
      const av = a[key] || 0;
      const bv = b[key] || 0;
      numerator += av * bv;
      magA += av * av;
      magB += bv * bv;
    }
    if (magA === 0 || magB === 0) return 0;
    return numerator / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  static computeChallengeTokens(challenge) {
    const challengeText = [
      challenge.title,
      challenge.description,
      challenge.problem_statement,
      challenge.desired_outcomes,
      challenge.success_criteria,
      challenge.category,
      ...(Array.isArray(challenge.keywords) ? challenge.keywords : String(challenge.keywords || '').split(/[,;\s]+/)),
    ].join(' ');
    return this.normalizeTokens([challengeText]);
  }

  static computeStartupTokens(startup) {
    const values = [
      startup.name,
      startup.legalName,
      startup.summary,
      startup.sector,
      startup.description,
      startup.category,
      Array.isArray(startup.techStack) ? startup.techStack.join(' ') : startup.techStack,
      Array.isArray(startup.pastGovProjects) ? startup.pastGovProjects.map((project) => project.projectName || project.department || '').join(' ') : startup.pastGovProjects,
    ];
    return this.normalizeTokens(values);
  }

  static scoreCandidate(challenge, startup) {
    const challengeTokens = this.computeChallengeTokens(challenge);
    const startupTokens = this.computeStartupTokens(startup);
    const corpus = Array.from(new Set([...challengeTokens, ...startupTokens]));
    const challengeVector = this.buildVector(challengeTokens, corpus);
    const startupVector = this.buildVector(startupTokens, corpus);
    const similarity = this.cosineSimilarity(challengeVector, startupVector);

    const completeness = startup.trlLevel ? Math.min(startup.trlLevel / 10, 1) : 0.4;
    const pastProjectBonus = Array.isArray(startup.pastGovProjects) && startup.pastGovProjects.length > 0 ? 0.14 : 0;
    const verifiedBonus = startup.dpiitRecognized || startup.dpiitRecognized === true ? 0.12 : 0;

    return Number((similarity * 60 + completeness * 25 + pastProjectBonus * 100 + verifiedBonus * 100).toFixed(2));
  }

  static getTopMatches(challenge, startups = [], limit = 5) {
    const scored = startups
      .map((startup) => ({
        ...startup,
        matchScore: this.scoreCandidate(challenge, startup),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        name: item.name || item.legalName || 'Startup',
        matchScore: item.matchScore,
        techStack: Array.isArray(item.techStack) ? item.techStack : [],
        sector: item.sector,
        trlLevel: item.trlLevel,
      }));

    return scored;
  }
}

module.exports = { MatchmakingService };
