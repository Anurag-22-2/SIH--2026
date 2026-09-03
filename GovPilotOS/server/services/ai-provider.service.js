const { DataAnonymizer } = require('../services/privacy.service');

class AIProvider {
  async analyzeProblem(input = {}) {
    throw new Error('analyzeProblem must be implemented by concrete AI Provider');
  }
}

class MockAIProvider extends AIProvider {
  async analyzeProblem(input = {}) {
    const rawTitle = (input.title || '').trim();
    const rawDesc = (input.description || '').trim();
    const dept = (input.department || 'Urban Development').trim();
    const location = (input.location || 'Nashik').trim();
    const affected = (input.affected_users || 'Citizens, municipal officers, sanitation staff').trim();
    const impact = (input.current_impact || 'Delayed service delivery, unmonitored operations').trim();
    const budgetInput = (input.budget || '₹50 Lakhs').trim();
    const timelineInput = (input.timeline || '6 months').trim();

    const title = rawTitle || 'Municipal Service Optimisation Challenge';
    const missingInfo = [];
    if (!input.budget) missingInfo.push('Specific line-item budget allocation');
    if (!input.timeline) missingInfo.push('Exact milestone deadline date');
    if (!input.existing_system) missingInfo.push('Legacy software API specs');

    const keywords = `${title} ${rawDesc} ${dept} ${location}`.toLowerCase();
    const isWaste = keywords.includes('garbage') || keywords.includes('waste') || keywords.includes('clean') || keywords.includes('swm');
    const isWater = keywords.includes('water') || keywords.includes('quality') || keywords.includes('chlorine') || keywords.includes('tank');
    const isMobility = keywords.includes('road') || keywords.includes('pothole') || keywords.includes('fleet') || keywords.includes('bus') || keywords.includes('traffic');

    let category = 'Urban Waste';
    let subCategory = 'Decentralised Waste & Route Optimisation';
    if (isWater) {
      category = 'Water Quality';
      subCategory = 'Continuous Sensing & Alerting';
    } else if (isMobility) {
      category = 'PWD';
      subCategory = 'Smart Infrastructure & Asset Audit';
    }

    const problemStatement = `${dept} in ${location} faces operational inefficiencies. ${rawDesc || 'Manual processes lead to delayed resolution and lack of real-time visibility.'}`;

    const executiveSummary = `This innovation challenge seeks a technology-driven solution for ${title.toLowerCase()} in ${location}. By deploying AI, IoT, or automated telemetry, the department aims to transition from manual, delayed operations to real-time monitoring and data-backed civic service delivery.`;

    const painPoints = [
      'Lack of real-time operational visibility and telemetry',
      'Delayed service delivery and unmonitored field operations',
      `Impact on stakeholders: ${affected}`,
      `Current operational friction: ${impact}`,
    ];

    const outcomes = [
      `Reduce service delivery delays to under 12 hours`,
      `Achieve >90% operational compliance across ${location}`,
      `Enable real-time dashboard monitoring for ${dept} officers`,
      `Improve citizen satisfaction and reduce helpline grievances by 50%`,
    ];

    const kpis = [
      {
        name: 'Service Turnaround Delay',
        baseline: '2-5 business days',
        target: '< 12 hours',
        unit: 'hours',
        measurement_method: 'Platform telemetry logs and grievance closure timestamps',
      },
      {
        name: 'Operational Compliance & Coverage',
        baseline: '45% manual audit',
        target: '≥ 90% verified coverage',
        measurement_method: 'GPS trace & automated audit report',
      },
      {
        name: 'Citizen Grievances Volume',
        baseline: '100+ complaints/month',
        target: '< 30 complaints/month',
        measurement_method: 'Integration with Municipal Helpline API',
      },
    ];

    const innovationAreas = [
      'IoT Edge Sensors & Telemetry',
      'AI-Powered Route & Resource Optimisation',
      'Geospatial Operations Dashboard',
      'Automated Grievance Retasking Loop',
    ];

    const solutionScope = `The proposed solution must provide edge sensors or software applications that integrate with existing ${dept} operations in ${location}. It must offer real-time telemetry, automated anomaly alerts, and a web dashboard for department officers.`;

    const technicalReqs = [
      'MeitY-empanelled cloud hosting within Indian territory',
      'REST API integration with Municipal ERP & Helpline',
      'Offline store-and-forward telemetry for low-connectivity zones',
    ];

    const functionalReqs = [
      'Automated alert dispatch to ward officers via SMS/WhatsApp',
      'Real-time vehicle and asset map view',
      'Role-based access control for officers and contractors',
    ];

    const nonFunctionalReqs = [
      '99.5% monthly platform uptime SLA',
      'Sub-2-second map rendering latency',
      'Mobile-responsive design for field staff',
    ];

    const dataReqs = [
      'Geospatial boundary and route geometry layers',
      'Daily operational logs retained for 36 months',
    ];

    const securityReqs = [
      'CERT-In cybersecurity compliance guidelines',
      'End-to-end data encryption in transit (TLS 1.3) and at rest (AES-256)',
    ];

    const risks = [
      {
        risk: 'Field staff reluctance to adopt new mobile app',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Conduct hands-on Marathi language workshops and introduce incentive points.',
      },
      {
        risk: 'Intermittent cellular network coverage in remote wards',
        probability: 'Medium',
        impact: 'Medium',
        mitigation: 'Implement local on-device buffering (store-and-forward).',
      },
    ];

    const evaluationCriteria = [
      { criterion: 'Outcome Impact & Problem Fit', weight: 25 },
      { criterion: 'Technical Innovation & Architecture', weight: 20 },
      { criterion: 'Feasibility & Deployment Readiness (TRL 6-9)', weight: 20 },
      { criterion: 'Cost Efficiency & Scalability', weight: 20 },
      { criterion: 'Cybersecurity & Data Residency Compliance', weight: 15 },
    ];

    return {
      problem_statement: problemStatement,
      executive_summary: executiveSummary,
      category,
      sub_category: subCategory,
      challenge_type: 'Outcome-Based Innovation',
      affected_stakeholders: [affected, 'Municipal Officers', 'Sanitation Staff', 'Local Citizens'],
      current_state: impact,
      key_pain_points: painPoints,
      desired_outcomes: outcomes,
      suggested_kpis: kpis,
      innovation_areas: innovationAreas,
      suggested_solution_scope: solutionScope,
      technical_requirements: technicalReqs,
      functional_requirements: functionalReqs,
      non_functional_requirements: nonFunctionalReqs,
      data_requirements: dataReqs,
      security_considerations: securityReqs,
      risks,
      pilot_duration: timelineInput,
      pilot_scope: `Pilot deployment in selected wards across ${location}`,
      success_criteria: [
        '≥ 90% target KPI achievement during the pilot window',
        'Successful integration with municipal department systems',
        'Independent verification report signed by expert panel',
      ],
      suggested_evaluation_criteria: evaluationCriteria,
      estimated_budget_range: budgetInput.includes('–') || budgetInput.includes('-') ? budgetInput : `₹25 Lakhs – ${budgetInput}`,
      ai_confidence: 89,
      missing_information: missingInfo.length ? missingInfo : ['None identified'],
      ai_reasoning_summary: `Analyzed human-language input for ${dept} in ${location}. Formulated outcome-based KPIs, risk mitigation plan, and GFR-compliant pilot scope.`,
    };
  }
}

class OpenAIProvider extends AIProvider {
  constructor(apiKey, endpoint, model) {
    super();
    this.apiKey = apiKey;
    this.endpoint = endpoint || 'https://api.openai.com/v1/chat/completions';
    this.model = model || 'gpt-4o-mini';
  }

  async analyzeProblem(input = {}) {
    const prompt = `Analyze this government problem description and return a JSON object with outcome-based challenge details.
Problem Title: ${input.title || ''}
Problem Description: ${input.description || ''}
Department: ${input.department || ''}
Location: ${input.location || ''}
Affected Stakeholders: ${input.affected_users || ''}
Current Impact: ${input.current_impact || ''}
Budget: ${input.budget || ''}
Timeline: ${input.timeline || ''}
Additional Info: ${input.additional_information || ''}

Return JSON with fields:
problem_statement, executive_summary, category, sub_category, challenge_type, affected_stakeholders (array), current_state, key_pain_points (array), desired_outcomes (array), suggested_kpis (array of {name, baseline, target, unit, measurement_method}), innovation_areas (array), suggested_solution_scope, technical_requirements (array), functional_requirements (array), non_functional_requirements (array), data_requirements (array), security_considerations (array), risks (array of {risk, probability, impact, mitigation}), pilot_duration, pilot_scope, success_criteria (array), suggested_evaluation_criteria (array of {criterion, weight}), estimated_budget_range, ai_confidence (number 1-100), missing_information (array), ai_reasoning_summary.`;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });
      if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
      const payload = await response.json();
      const content = payload.choices?.[0]?.message?.content;
      return JSON.parse(content);
    } catch (err) {
      console.warn('OpenAIProvider failed, falling back to MockAIProvider:', err.message);
      return new MockAIProvider().analyzeProblem(input);
    }
  }
}

class LocalAIProvider extends AIProvider {
  constructor(baseUrl, model) {
    super();
    this.baseUrl = baseUrl || 'http://localhost:11434';
    this.model = model || 'llama3';
  }

  async analyzeProblem(input = {}) {
    const prompt = `Analyze this government problem and format as JSON challenge: ${JSON.stringify(input)}`;
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json',
        }),
      });
      if (!response.ok) throw new Error(`Ollama failed: ${response.status}`);
      const payload = await response.json();
      return JSON.parse(payload.response || payload);
    } catch (err) {
      console.warn('LocalAIProvider failed, falling back to MockAIProvider:', err.message);
      return new MockAIProvider().analyzeProblem(input);
    }
  }
}

class AIProviderFactory {
  static getProvider() {
    if (process.env.OPENAI_API_KEY || process.env.CLOUD_LLM_API_KEY) {
      return new OpenAIProvider(
        process.env.OPENAI_API_KEY || process.env.CLOUD_LLM_API_KEY,
        process.env.CLOUD_LLM_ENDPOINT,
        process.env.CLOUD_LLM_MODEL
      );
    }
    if (process.env.OLLAMA_BASE_URL) {
      return new LocalAIProvider(process.env.OLLAMA_BASE_URL, process.env.OLLAMA_MODEL);
    }
    return new MockAIProvider();
  }
}

module.exports = {
  AIProvider,
  MockAIProvider,
  OpenAIProvider,
  LocalAIProvider,
  AIProviderFactory,
};
