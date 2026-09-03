const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = path.join(__dirname, 'govpilot.db');
const db = new Database(DB_PATH);

const passwordHash = bcrypt.hashSync('password123', 10);

const users = [
  { id: uuidv4(), email: 'officer@govpilot.gov', password_hash: passwordHash, full_name: 'Sarah Chen', role: 'government', organization: 'Ministry of Digital Affairs', bio: 'Senior policy officer focused on innovation and digital transformation', created_at: '2025-01-15T10:00:00Z' },
  { id: uuidv4(), email: 'admin@govpilot.gov', password_hash: passwordHash, full_name: 'James Wilson', role: 'admin', organization: 'GovPilot Platform', bio: 'Platform administrator', created_at: '2025-01-10T08:00:00Z' },
  { id: uuidv4(), email: 'startup@innovate.ai', password_hash: passwordHash, full_name: 'Alex Rivera', role: 'startup', organization: 'InnovateAI Solutions', bio: 'AI-driven startup focused on public sector automation', created_at: '2025-02-01T14:00:00Z' },
  { id: uuidv4(), email: 'startup2@green.tech', password_hash: passwordHash, full_name: 'Priya Patel', role: 'startup', organization: 'GreenTech Labs', bio: 'Sustainability and climate tech startup', created_at: '2025-02-05T11:00:00Z' },
  { id: uuidv4(), email: 'expert@university.edu', password_hash: passwordHash, full_name: 'Dr. Michael Torres', role: 'expert', organization: 'State University', bio: 'Professor of Public Administration and Innovation', expertise: 'public administration, policy evaluation, innovation management', created_at: '2025-01-20T09:00:00Z' },
  { id: uuidv4(), email: 'expert2@consulting.com', password_hash: passwordHash, full_name: 'Dr. Lisa Nakamura', role: 'expert', organization: 'Policy Insights Consulting', bio: 'Independent evaluation specialist', expertise: 'program evaluation, impact assessment, data analytics', created_at: '2025-01-25T13:00:00Z' },
  { id: uuidv4(), email: 'startup3@health.tech', password_hash: passwordHash, full_name: 'Dr. Kevin O\'Brien', role: 'startup', organization: 'HealthBridge Technologies', bio: 'Health tech startup focused on digital health solutions', created_at: '2025-03-01T10:00:00Z' },
];

const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, full_name, role, organization, bio, expertise, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertMany = db.transaction((users) => {
  for (const user of users) insertUser.run(user.id, user.email, user.password_hash, user.full_name, user.role, user.organization, user.bio, user.expertise || null, user.created_at);
});
insertMany(users);

const govId = users[0].id;
const expertIds = [users[4].id, users[5].id];
const startupIds = [users[2].id, users[3].id, users[6].id];

const challenges = [
  {
    id: uuidv4(), title: 'AI-Powered Citizen Request Triage',
    description: 'Implement an intelligent system to categorize and route citizen service requests to the appropriate government departments.',
    problem_statement: 'Citizens currently wait an average of 5 business days for their requests to be correctly routed. Manual triage is error-prone and creates bottlenecks.',
    desired_outcomes: 'Reduce routing time to under 1 hour, improve first-contact resolution by 40%, reduce misrouted requests by 60%.',
    success_criteria: '95% accuracy in request categorization, <1 hour average routing time, 40% reduction in processing time.',
    budget_range: '$50,000 - $150,000',
    duration_weeks: 12,
    status: 'open',
    priority: 'high',
    department: 'Citizen Services',
    contact_person: 'Sarah Chen',
    tags: 'AI, NLP, citizen-services, automation',
    created_by: govId,
    created_at: '2025-03-01T09:00:00Z'
  },
  {
    id: uuidv4(), title: 'Carbon Footprint Tracking Dashboard',
    description: 'Build a real-time dashboard for municipal carbon emissions monitoring across all city facilities and operations.',
    problem_statement: 'The city lacks a unified view of carbon emissions, making it difficult to track progress toward climate goals and identify reduction opportunities.',
    desired_outcomes: 'Real-time emissions tracking, automated report generation, actionable insights for reduction strategies.',
    success_criteria: '100% facility coverage, automated monthly reports, identification of 5+ actionable reduction opportunities within 6 months.',
    budget_range: '$30,000 - $80,000',
    duration_weeks: 16,
    status: 'open',
    priority: 'medium',
    department: 'Environmental Services',
    contact_person: 'Sarah Chen',
    tags: 'climate, sustainability, dashboards, IoT',
    created_by: govId,
    created_at: '2025-03-05T11:00:00Z'
  },
  {
    id: uuidv4(), title: 'Blockchain Land Registry Pilot',
    description: 'Pilot a blockchain-based land registry system to improve transparency and reduce fraud in property transactions.',
    problem_statement: 'Current land registry processes are paper-based and prone to fraud, with title disputes taking years to resolve.',
    desired_outcomes: 'Reduce title processing time by 70%, eliminate forged documents, provide citizens with real-time property records.',
    success_criteria: '50% reduction in processing time, zero fraud incidents, 90% citizen satisfaction with new system.',
    budget_range: '$100,000 - $250,000',
    duration_weeks: 24,
    status: 'in_review',
    priority: 'critical',
    department: 'Land Administration',
    contact_person: 'Sarah Chen',
    tags: 'blockchain, land-registry, transparency, fraud-prevention',
    created_by: govId,
    created_at: '2025-02-15T14:00:00Z'
  }
];

const insertChallenge = db.prepare('INSERT INTO challenges (id, title, description, problem_statement, desired_outcomes, success_criteria, budget_range, duration_weeks, status, priority, department, contact_person, tags, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
for (const c of challenges) {
  insertChallenge.run(c.id, c.title, c.description, c.problem_statement, c.desired_outcomes, c.success_criteria, c.budget_range, c.duration_weeks, c.status, c.priority, c.department, c.contact_person, c.tags, c.created_by, c.created_at);
}

const proposals = [
  {
    id: uuidv4(), challenge_id: challenges[0].id, startup_id: startupIds[0],
    title: 'NLP-Powered Request Router', description: 'Deploy a fine-tuned NLP model that classifies citizen requests and routes them automatically.',
    solution_approach: 'We will use a transformer-based model trained on historical request data, with a human-in-the-loop fallback for edge cases.',
    timeline_weeks: 10, budget_estimate: 85000,
    team_description: '3 ML engineers, 1 backend developer, 1 UX designer with government service experience.',
    past_projects: 'Deployed similar system for City of Portland, achieving 94% classification accuracy.',
    status: 'submitted', created_at: '2025-03-10T16:00:00Z'
  },
  {
    id: uuidv4(), challenge_id: challenges[0].id, startup_id: startupIds[1],
    title: 'Smart Triage Assistant', description: 'A rule-based hybrid system combining keyword classification with lightweight ML for faster deployment.',
    solution_approach: 'Rapid deployment using keyword matching enhanced with a small BERT model for semantic understanding.',
    timeline_weeks: 6, budget_estimate: 45000,
    team_description: '2 full-stack developers, 1 NLP specialist.',
    past_projects: 'Built triage systems for 3 state agencies, reducing processing time by 55%.',
    status: 'submitted', created_at: '2025-03-12T09:00:00Z'
  },
  {
    id: uuidv4(), challenge_id: challenges[1].id, startup_id: startupIds[0],
    title: 'EcoMetrics Platform', description: 'IoT-connected emissions monitoring platform with real-time analytics and reporting.',
    solution_approach: 'Deploy IoT sensors across facilities, build a cloud analytics platform with automated reporting.',
    timeline_weeks: 14, budget_estimate: 72000,
    team_description: 'IoT team (2 engineers), cloud platform team (3 engineers), data visualization specialist.',
    past_projects: 'Built similar platform for University campus, tracking 200+ buildings.',
    status: 'submitted', created_at: '2025-03-15T10:00:00Z'
  },
  {
    id: uuidv4(), challenge_id: challenges[2].id, startup_id: startupIds[1],
    title: 'ChainTitle - Blockchain Land Registry', description: 'A permissioned blockchain solution for land title management with government-controlled validators.',
    solution_approach: 'Implement a private blockchain network with government-run validator nodes, smart contracts for title transfers.',
    timeline_weeks: 22, budget_estimate: 180000,
    team_description: 'Blockchain architect, 2 Solidity developers, 2 backend engineers, 1 compliance specialist.',
    past_projects: 'Piloted blockchain voting system for local election in Estonia.',
    status: 'submitted', created_at: '2025-03-08T14:00:00Z'
  },
  {
    id: uuidv4(), challenge_id: challenges[2].id, startup_id: startupIds[2],
    title: 'HealthChain Registry', description: 'Adapted blockchain technology for land registry with strong identity verification.',
    solution_approach: 'Use zero-knowledge proofs for privacy-preserving title verification, with government KYC integration.',
    timeline_weeks: 20, budget_estimate: 150000,
    team_description: 'Cryptography expert, 3 blockchain developers, 1 government liaison.',
    past_projects: 'Implemented blockchain-based health records system in Rwanda.',
    status: 'submitted', created_at: '2025-03-09T11:00:00Z'
  }
];

const insertProposal = db.prepare('INSERT INTO proposals (id, challenge_id, startup_id, title, description, solution_approach, timeline_weeks, budget_estimate, team_description, past_projects, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
for (const p of proposals) {
  insertProposal.run(p.id, p.challenge_id, p.startup_id, p.title, p.description, p.solution_approach, p.timeline_weeks, p.budget_estimate, p.team_description, p.past_projects, p.status, p.created_at);
}

const evaluations = [
  { id: uuidv4(), proposal_id: proposals[0].id, expert_id: expertIds[0], innovation_score: 5, feasibility_score: 4, impact_score: 5, overall_comment: 'Strong use of modern NLP techniques with solid feasibility.', recommendation: 'strongly_accept', confidence_level: 5 },
  { id: uuidv4(), proposal_id: proposals[0].id, expert_id: expertIds[1], innovation_score: 4, feasibility_score: 4, impact_score: 4, overall_comment: 'Good approach, but budget might be tight for 10-week timeline.', recommendation: 'accept', confidence_level: 4 },
  { id: uuidv4(), proposal_id: proposals[1].id, expert_id: expertIds[0], innovation_score: 3, feasibility_score: 5, impact_score: 3, overall_comment: 'Pragmatic approach but lacks innovation in solution design.', recommendation: 'neutral', confidence_level: 4 },
  { id: uuidv4(), proposal_id: proposals[2].id, expert_id: expertIds[1], innovation_score: 4, feasibility_score: 4, impact_score: 5, overall_comment: 'Excellent combination of IoT and analytics. Strong team background.', recommendation: 'strongly_accept', confidence_level: 4 },
  { id: uuidv4(), proposal_id: proposals[3].id, expert_id: expertIds[0], innovation_score: 5, feasibility_score: 3, impact_score: 5, overall_comment: 'Very innovative but blockchain adoption in government requires significant change management.', recommendation: 'accept', confidence_level: 4 },
  { id: uuidv4(), proposal_id: proposals[4].id, expert_id: expertIds[1], innovation_score: 5, feasibility_score: 4, impact_score: 4, overall_comment: 'Novel approach with ZK proofs, good privacy considerations.', recommendation: 'accept', confidence_level: 3 },
];

const insertEval = db.prepare('INSERT INTO evaluations (id, proposal_id, expert_id, innovation_score, feasibility_score, impact_score, overall_comment, recommendation, confidence_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
for (const e of evaluations) {
  insertEval.run(e.id, e.proposal_id, e.expert_id, e.innovation_score, e.feasibility_score, e.impact_score, e.overall_comment, e.recommendation, e.confidence_level);
}

const updateProposalScore = db.prepare('UPDATE proposals SET innovation_score = ?, feasibility_score = ?, impact_score = ?, overall_score = ? WHERE id = ?');
const proposalScores = {
  [proposals[0].id]: [5, 4, 5, 4.67],
  [proposals[1].id]: [3, 5, 3, 3.67],
  [proposals[2].id]: [4, 4, 5, 4.33],
  [proposals[3].id]: [5, 3, 5, 4.33],
  [proposals[4].id]: [5, 4, 4, 4.33],
};

for (const [id, scores] of Object.entries(proposalScores)) {
  updateProposalScore.run(scores[0], scores[1], scores[2], scores[3], id);
}

db.close();
console.log('Seed data inserted successfully');
