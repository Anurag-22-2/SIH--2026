const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4, v5: uuidv5 } = require('uuid');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const memoryTables = {
  users: [],
  challenges: [],
  proposals: [],
  evaluations: [],
  pilots: [],
  kpis: [],
  kpi_snapshots: [],
  scale_decisions: [],
  notifications: [],
  activity_log: [],
  risks: [],
  milestones: [],
  contracts: [],
  meetings: [],
  ai_challenge_analyses: [],
  challenge_reviews: [],
};
let databaseMode = 'memory';

let pool = null;
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: { rejectUnauthorized: false },
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

async function seedFallbackMemoryData() {
  const passwordHash = bcrypt.hashSync('password123', 10);
  const now = new Date().toISOString();

  memoryTables.users = [
    { id: 'gov-user', email: 'officer@govpilot.gov', password_hash: passwordHash, full_name: 'Sarah Chen', role: 'government', organization: 'Ministry of Digital Affairs', bio: 'Senior policy officer focused on innovation and digital transformation', expertise: 'Public policy', created_at: now, updated_at: now },
    { id: 'admin-user', email: 'admin@govpilot.gov', password_hash: passwordHash, full_name: 'James Wilson', role: 'admin', organization: 'GovPilot Platform', bio: 'Platform administrator', expertise: 'Platform operations', created_at: now, updated_at: now },
    { id: 'startup-user', email: 'startup@staqu.com', password_hash: passwordHash, full_name: 'Vikas Madaan', role: 'startup', organization: 'Staqu', bio: 'AI video intelligence startup', expertise: 'Computer vision', created_at: now, updated_at: now },
    { id: 'startup-niramai', email: 'team@niramai.com', password_hash: passwordHash, full_name: 'Nandini Ahuja', role: 'startup', organization: 'Niramai', bio: 'AI healthcare startup', expertise: 'HealthTech', created_at: now, updated_at: now },
    { id: 'startup-aerem', email: 'hello@aerem.in', password_hash: passwordHash, full_name: 'Rohit Kapoor', role: 'startup', organization: 'AEREM', bio: 'Energy and sustainability automation', expertise: 'Civic infrastructure', created_at: now, updated_at: now },
    { id: 'startup-kvalito', email: 'support@kvalito.ai', password_hash: passwordHash, full_name: 'Ananya Rao', role: 'startup', organization: 'Kvalito', bio: 'AI operations startup for civic systems', expertise: 'ML analytics', created_at: now, updated_at: now },
    { id: 'startup-nawa', email: 'contact@nawadigital.in', password_hash: passwordHash, full_name: 'Pratik Jain', role: 'startup', organization: 'Nawa Digital', bio: 'Urban infrastructure monitoring platform', expertise: 'Digital governance', created_at: now, updated_at: now },
    { id: 'expert-user', email: 'expert@university.edu', password_hash: passwordHash, full_name: 'Dr. Michael Torres', role: 'expert', organization: 'State University', bio: 'Professor of innovation policy', expertise: 'Evaluation', created_at: now, updated_at: now },
  ];

  memoryTables.challenges = [
    { id: 'CH-001', title: 'AI-Powered Citizen Request Triage', description: 'Deploy AI to classify and route civic service requests to the right department with traceable escalations.', problem_statement: 'Citizen service requests are manually triaged and often misrouted, causing delays in response and poor citizen experience.', desired_outcomes: 'Reduce routing time to under 1 hour and improve first-contact resolution.', success_criteria: '90% routing accuracy and less than 1 hour median response time.', budget_range: '₹50L - ₹1.5Cr', duration_weeks: 12, status: 'open', priority: 'high', department: 'Citizen Services', contact_person: 'Sarah Chen', tags: 'AI, NLP, civic service', ai_match_enabled: 1, min_expert_evaluations: 2, created_by: 'gov-user', created_at: now, updated_at: now },
    { id: 'CH-002', title: 'Waste-to-Energy Monitoring Dashboard', description: 'Build a dashboard to monitor waste segregation, conversion performance, and treatment bottlenecks across city facilities.', problem_statement: 'Municipal waste operations are fragmented and lack real-time monitoring, which reduces diversion and efficiency.', desired_outcomes: 'Improve diversion rate and automate operations reporting.', success_criteria: 'Track 100% of facilities and generate automated monthly reports.', budget_range: '₹30L - ₹80L', duration_weeks: 16, status: 'in_review', priority: 'medium', department: 'Urban Waste Management', contact_person: 'Aditi Rao', tags: 'waste, sustainability, dashboard', ai_match_enabled: 1, min_expert_evaluations: 2, created_by: 'gov-user', created_at: now, updated_at: now },
    { id: 'CH-003', title: 'Water Quality Alerting Network', description: 'Create a sensor-driven and AI-assisted water quality alerting network for rapid intervention at municipal facilities.', problem_statement: 'Water utilities lack a timely alerting mechanism for contamination anomalies and asset failures.', desired_outcomes: 'Reduce public health risk and improve compliance reporting.', success_criteria: '95% sensor uptime and 48-hour intervention turnaround.', budget_range: '₹75L - ₹2Cr', duration_weeks: 20, status: 'open', priority: 'critical', department: 'Water Resources', contact_person: 'Sarah Chen', tags: 'water, sensors, AI, public-health', ai_match_enabled: 1, min_expert_evaluations: 2, created_by: 'gov-user', created_at: now, updated_at: now },
  ];

  memoryTables.proposals = [
    { id: 'PR-001', challenge_id: 'CH-001', startup_id: 'startup-user', title: 'CityTriage AI', description: 'AI-assisted citizen complaint routing engine for municipal workflows.', solution_approach: 'Hybrid NLP and rule engine with audit logs.', timeline_weeks: 10, budget_estimate: 8500000, team_description: 'AI engineers and backend team', past_projects: 'Public safety monitoring analytics', innovation_score: 5, feasibility_score: 4, impact_score: 5, overall_score: 4.67, status: 'under_review', submission_notes: 'Good fit', created_at: now, updated_at: now },
    { id: 'PR-002', challenge_id: 'CH-002', startup_id: 'startup-aerem', title: 'WasteSense Dashboard', description: 'Municipal waste collection and treatment monitoring dashboard.', solution_approach: 'Geospatial analytics and unified operations dashboard.', timeline_weeks: 14, budget_estimate: 6000000, team_description: 'Data and full-stack team', past_projects: 'Waste analytics for civic infrastructure', innovation_score: 4, feasibility_score: 4, impact_score: 5, overall_score: 4.33, status: 'shortlisted', submission_notes: 'Strong dashboard fit', created_at: now, updated_at: now },
    { id: 'PR-003', challenge_id: 'CH-003', startup_id: 'startup-kvalito', title: 'AquaPulse Intelligence', description: 'Predictive water quality analytics for municipalities.', solution_approach: 'Sensor network plus predictive models.', timeline_weeks: 18, budget_estimate: 12000000, team_description: 'ML engineers and utility specialists', past_projects: 'Predictive civic operations', innovation_score: 5, feasibility_score: 4, impact_score: 5, overall_score: 4.67, status: 'submitted', submission_notes: 'Strong analytics potential', created_at: now, updated_at: now },
  ];

  memoryTables.pilots = [
    { id: 'PI-001', proposal_id: 'PR-001', challenge_id: 'CH-001', startup_id: 'startup-user', status: 'active', start_date: now, end_date: null, budget_allocated: 5000000, budget_spent: 1200000, progress_percentage: 35, summary: 'Pilot deployment in selected service centers.', outcomes: '', lessons_learned: '', created_at: now, updated_at: now },
  ];

  memoryTables.notifications = [
    { id: 'N-001', user_id: 'gov-user', title: 'Demo startup match', message: 'Three startups matched to the AI triage challenge.', type: 'info', related_id: 'CH-001', related_type: 'challenge', read: 0, created_at: now },
  ];

  memoryTables.milestones = [
    {
      id: 'MS-001', pilot_id: 'PI-001', seq: 1,
      title: 'M1 · Solution Architecture & Integration Plan',
      description: 'Deliver architecture document and integration plan for pilot deployment sites.',
      deliverables: ['Architecture document', 'Integration plan', 'API specifications'],
      due_date: '2026-10-01T00:00:00Z', amount: 1000000, payment_percentage: 20,
      status: 'approved',
      evidence: [{ name: 'Architecture_Doc_v2.pdf', kind: 'report', uploaded_at: now }],
      submitted_at: '2026-09-25T10:00:00Z', reviewed_at: '2026-09-28T14:00:00Z',
      reviewed_by: 'gov-user', reviewer_notes: 'Architecture looks solid. Approved.',
      paid_at: '2026-09-30T12:00:00Z', payment_utr: 'UTR2026093012345', payment_mode: 'PFMS',
      kpi_links: [], created_at: now, updated_at: now,
    },
    {
      id: 'MS-002', pilot_id: 'PI-001', seq: 2,
      title: 'M2 · Deployment & Baseline Measurement',
      description: 'Deploy solution at pilot sites and capture baseline KPI readings.',
      deliverables: ['Deployment report', 'Baseline KPI readings', 'Training completion certificate'],
      due_date: '2026-11-15T00:00:00Z', amount: 1500000, payment_percentage: 30,
      status: 'submitted',
      evidence: [
        { name: 'Deployment_Report.pdf', kind: 'report', uploaded_at: now },
        { name: 'Baseline_Readings.xlsx', kind: 'dataset', uploaded_at: now },
      ],
      submitted_at: now, reviewed_at: null,
      reviewed_by: null, reviewer_notes: null,
      paid_at: null, payment_utr: null, payment_mode: null,
      kpi_links: [], created_at: now, updated_at: now,
    },
    {
      id: 'MS-003', pilot_id: 'PI-001', seq: 3,
      title: 'M3 · Outcome Delivery & Verification',
      description: 'Achieve target KPIs and submit independent verification report.',
      deliverables: ['KPI achievement report', 'Independent validation certificate', 'Final invoice'],
      due_date: '2027-01-15T00:00:00Z', amount: 2500000, payment_percentage: 50,
      status: 'pending',
      evidence: [],
      submitted_at: null, reviewed_at: null,
      reviewed_by: null, reviewer_notes: null,
      paid_at: null, payment_utr: null, payment_mode: null,
      kpi_links: [], created_at: now, updated_at: now,
    },
  ];

  memoryTables.contracts = [
    {
      id: 'CT-001', pilot_id: 'PI-001',
      template_ids: ['TPL-AGREE', 'TPL-DATA', 'TPL-IP'],
      reference_no: 'MSINS/AGR/2026/001',
      status: 'executed',
      ip_ownership: 'startup_owned_govt_licence',
      data_classification: 'restricted',
      data_retention_months: 36,
      data_residency_in_india: true,
      cybersecurity_compliance: 'CERT-In guidelines followed; data encrypted at rest and in transit.',
      risk_controls: 'Monthly progress review, automatic termination clause on KPI deviation > 30%, escrow for final tranche.',
      generated_at: now,
      sent_at: now,
      startup_signed_at: now,
      executed_at: now,
      executed_by: 'gov-user',
      notes: 'Standard MSINS pilot agreement with IP licence-back clause.',
    },
  ];

  memoryTables.meetings = [
    {
      id: 'MT-001', pilot_id: 'PI-001',
      title: 'Pilot Kick-off Meeting',
      date: '2026-09-15T10:00:00Z',
      attendees: ['gov-user', 'startup-user', 'expert-user'],
      agenda: 'Align on deployment timeline, review KPI baseline, discuss integration requirements.',
      notes: 'All parties agreed on 3-milestone plan. Integration testing starts week 2.',
      action_items: ['Startup to share API specs by Sept 20', 'Govt to provide test data access', 'Expert to review architecture doc'],
      status: 'completed',
      created_at: now,
    },
    {
      id: 'MT-002', pilot_id: 'PI-001',
      title: 'Mid-Pilot Review',
      date: '2026-11-01T14:00:00Z',
      attendees: ['gov-user', 'startup-user'],
      agenda: 'Review M2 deployment progress, discuss any blockers, preview baseline KPI data.',
      notes: '',
      action_items: [],
      status: 'scheduled',
      created_at: now,
    },
  ],
  memoryTables.challenge_reviews = [
    {
      id: 'REV-001',
      challenge_id: 'CH-001',
      reviewer_id: 'expert-user',
      reviewer_name: 'Dr. Michael Torres',
      reviewer_role: 'expert',
      rating: 4.5,
      comment: 'Strong potential for reducing citizen complaint triage latency. Outcome KPIs are realistic and well-scoped.',
      is_private: false,
      created_at: now,
    },
    {
      id: 'REV-002',
      challenge_id: 'CH-002',
      reviewer_id: 'gov-user',
      reviewer_name: 'Sarah Chen',
      reviewer_role: 'government',
      rating: 4.0,
      comment: 'Internal Review: Facility coverage targets aligned with Municipal SWM Rules 2016.',
      is_private: true,
      created_at: now,
    },
  ];
}

async function initFallbackStore() {
  databaseMode = 'memory';
  await seedFallbackMemoryData();
}

async function initDb() {
  if (!DATABASE_URL) {
    console.warn('DATABASE_URL not configured. Falling back to in-memory demo data.');
    await initFallbackStore();
    return;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('government', 'startup', 'expert', 'admin')),
        organization TEXT,
        bio TEXT,
        expertise TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        problem_statement TEXT NOT NULL,
        desired_outcomes TEXT NOT NULL,
        success_criteria TEXT NOT NULL,
        budget_range TEXT,
        duration_weeks INTEGER,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_review', 'piloting', 'closed', 'cancelled')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        department TEXT,
        contact_person TEXT,
        tags TEXT,
        ai_match_enabled INTEGER DEFAULT 1,
        min_expert_evaluations INTEGER DEFAULT 2,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        startup_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        solution_approach TEXT NOT NULL,
        timeline_weeks INTEGER NOT NULL,
        budget_estimate REAL NOT NULL,
        team_description TEXT NOT NULL,
        past_projects TEXT,
        innovation_score INTEGER,
        feasibility_score INTEGER,
        impact_score INTEGER,
        overall_score REAL,
        status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'shortlisted', 'rejected', 'piloting', 'completed', 'scaled')),
        submission_notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id),
        FOREIGN KEY (startup_id) REFERENCES users(id)
      );
    `);
    await client.query(`
      ALTER TABLE proposals
        ADD COLUMN IF NOT EXISTS trl_level INTEGER,
        ADD COLUMN IF NOT EXISTS success_probability REAL,
        ADD COLUMN IF NOT EXISTS eligible_for_direct_gfr_exemption BOOLEAN;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        proposal_id TEXT NOT NULL,
        expert_id TEXT NOT NULL,
        innovation_score INTEGER NOT NULL CHECK(innovation_score >= 1 AND innovation_score <= 5),
        feasibility_score INTEGER NOT NULL CHECK(feasibility_score >= 1 AND feasibility_score <= 5),
        impact_score INTEGER NOT NULL CHECK(impact_score >= 1 AND impact_score <= 5),
        overall_comment TEXT,
        recommendation TEXT CHECK(recommendation IN ('strongly_reject', 'reject', 'neutral', 'accept', 'strongly_accept')),
        confidence_level INTEGER CHECK(confidence_level >= 1 AND confidence_level <= 5),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id),
        FOREIGN KEY (expert_id) REFERENCES users(id),
        UNIQUE(proposal_id, expert_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pilots (
        id TEXT PRIMARY KEY,
        proposal_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        startup_id TEXT NOT NULL,
        status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'active', 'paused', 'completed', 'terminated', 'scaled')),
        start_date TEXT,
        end_date TEXT,
        budget_allocated REAL,
        budget_spent REAL DEFAULT 0,
        progress_percentage INTEGER DEFAULT 0,
        summary TEXT,
        outcomes TEXT,
        lessons_learned TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id),
        FOREIGN KEY (challenge_id) REFERENCES challenges(id),
        FOREIGN KEY (startup_id) REFERENCES users(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS kpis (
        id TEXT PRIMARY KEY,
        challenge_id TEXT,
        pilot_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        metric_type TEXT NOT NULL CHECK(metric_type IN ('quantitative', 'qualitative', 'milestone')),
        unit TEXT,
        target_value REAL,
        target_description TEXT,
        weight REAL DEFAULT 1.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id),
        FOREIGN KEY (pilot_id) REFERENCES pilots(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS kpi_snapshots (
        id TEXT PRIMARY KEY,
        kpi_id TEXT NOT NULL,
        pilot_id TEXT NOT NULL,
        reported_value REAL,
        reported_text TEXT,
        notes TEXT,
        reported_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kpi_id) REFERENCES kpis(id),
        FOREIGN KEY (pilot_id) REFERENCES pilots(id),
        FOREIGN KEY (reported_by) REFERENCES users(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scale_decisions (
        id TEXT PRIMARY KEY,
        pilot_id TEXT NOT NULL,
        proposal_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        decision TEXT NOT NULL CHECK(decision IN ('procure', 'scale_pilot', 'iterate', 'reject')),
        reasoning TEXT,
        next_steps TEXT,
        budget_allocated REAL,
        timeline_months INTEGER,
        decided_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pilot_id) REFERENCES pilots(id),
        FOREIGN KEY (proposal_id) REFERENCES proposals(id),
        FOREIGN KEY (challenge_id) REFERENCES challenges(id),
        FOREIGN KEY (decided_by) REFERENCES users(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        related_id TEXT,
        related_type TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS risks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        severity TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'open',
        owner TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
      CREATE INDEX IF NOT EXISTS idx_proposals_challenge ON proposals(challenge_id);
      CREATE INDEX IF NOT EXISTS idx_evaluations_proposal ON evaluations(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_pilots_proposal ON pilots(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_pilot ON kpi_snapshots(pilot_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    `);

    await seedIfEmpty(client);
    await client.query('COMMIT');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.warn('Rollback not required in fallback mode.', rollbackErr.message);
    }
    console.warn('Database connection failed; reverting to in-memory demo data.', err.message);
    await initFallbackStore();
    return;
  } finally {
    client.release();
  }
} catch (outerErr) {
  console.warn('Database connection failed; reverting to in-memory demo data.', outerErr.message);
  await initFallbackStore();
}
}

async function seedIfEmpty(client) {
  const requiredStartupOrganizations = ['Staqu', 'Niramai', 'AEREM', 'Kvalito', 'Nawa Digital'];
  const requiredChallengeTitles = [
    'AI-Powered Citizen Request Triage',
    'Waste-to-Energy Monitoring Dashboard',
    'Water Quality Alerting Network',
  ];
  const requiredProposalTitles = [
    'CityTriage AI',
    'HealthFlow Intake',
    'WasteSense Dashboard',
    'AquaPulse Intelligence',
    'UrbanWaste Flow',
  ];

  const [startupRows, challengeRows, proposalRows, pilotRows] = await Promise.all([
    client.query("SELECT organization FROM users WHERE role = 'startup'"),
    client.query("SELECT title FROM challenges WHERE title = ANY($1)", [requiredChallengeTitles]),
    client.query("SELECT title FROM proposals WHERE title = ANY($1)", [requiredProposalTitles]),
    client.query('SELECT COUNT(*) AS count FROM pilots'),
  ]);

  const startupOrgs = new Set(startupRows.rows.map((row) => row.organization).filter(Boolean));
  const seenChallenges = new Set(challengeRows.rows.map((row) => row.title));
  const seenProposals = new Set(proposalRows.rows.map((row) => row.title));
  const pilotCount = parseInt(pilotRows.rows[0].count, 10);

  const needsBaseline = requiredStartupOrganizations.some((org) => !startupOrgs.has(org))
    || requiredChallengeTitles.some((title) => !seenChallenges.has(title))
    || requiredProposalTitles.some((title) => !seenProposals.has(title))
    || pilotCount === 0;

  if (!needsBaseline) {
    return;
  }

  const seedNamespace = 'd6a7e5a4-6ca2-4d7d-9ccd-c3d36abc2c79';
  const stableId = (key) => uuidv5(key, seedNamespace);
  const passwordHash = bcrypt.hashSync('password123', 10);

  const startupIds = {
    staqu: stableId('startup:staqu'),
    niramai: stableId('startup:niramai'),
    aerem: stableId('startup:aerem'),
    kvalito: stableId('startup:kvalito'),
    nawa: stableId('startup:nawa'),
  };

  const challengeIds = {
    triage: stableId('challenge:ai-triage'),
    waste: stableId('challenge:waste-monitoring'),
    water: stableId('challenge:water-alerts'),
  };

  const proposalIds = {
    staquTriage: stableId('proposal:staqu-triage'),
    niramaiHealth: stableId('proposal:niramai-health'),
    aeremWaste: stableId('proposal:aerem-waste'),
    kvalitoWater: stableId('proposal:kvalito-water'),
    nawaWaste: stableId('proposal:nawa-waste'),
  };

  const govId = stableId('user:gov-officer');
  const adminId = stableId('user:admin');
  const expertIds = [stableId('user:expert-michael'), stableId('user:expert-lisa')];

  const users = [
    { id: govId, email: 'officer@govpilot.gov', password_hash: passwordHash, full_name: 'Sarah Chen', role: 'government', organization: 'Ministry of Digital Affairs', bio: 'Senior policy officer focused on innovation and digital transformation', created_at: '2025-01-15T10:00:00Z' },
    { id: adminId, email: 'admin@govpilot.gov', password_hash: passwordHash, full_name: 'James Wilson', role: 'admin', organization: 'GovPilot Platform', bio: 'Platform administrator', created_at: '2025-01-10T08:00:00Z' },
    { id: startupIds.staqu, email: 'startup@staqu.com', password_hash: passwordHash, full_name: 'Vikas Madaan', role: 'startup', organization: 'Staqu', bio: 'AI-driven video intelligence and public safety technology company.', created_at: '2025-02-01T14:00:00Z' },
    { id: startupIds.niramai, email: 'team@niramai.com', password_hash: passwordHash, full_name: 'Nandini Ahuja', role: 'startup', organization: 'Niramai', bio: 'AI-based screening and health diagnostics startup.', created_at: '2025-02-05T11:00:00Z' },
    { id: startupIds.aerem, email: 'hello@aerem.in', password_hash: passwordHash, full_name: 'Rohit Kapoor', role: 'startup', organization: 'AEREM', bio: 'Energy and sustainability monitoring for municipal infrastructure.', created_at: '2025-02-10T10:00:00Z' },
    { id: startupIds.kvalito, email: 'support@kvalito.ai', password_hash: passwordHash, full_name: 'Ananya Rao', role: 'startup', organization: 'Kvalito', bio: 'AI operations and predictive analytics startup for civic systems.', created_at: '2025-03-02T09:00:00Z' },
    { id: startupIds.nawa, email: 'contact@nawadigital.in', password_hash: passwordHash, full_name: 'Pratik Jain', role: 'startup', organization: 'Nawa Digital', bio: 'Urban infrastructure monitoring and digital governance platform.', created_at: '2025-03-08T15:00:00Z' },
    { id: expertIds[0], email: 'expert@university.edu', password_hash: passwordHash, full_name: 'Dr. Michael Torres', role: 'expert', organization: 'State University', bio: 'Professor of Public Administration and Innovation', created_at: '2025-01-20T09:00:00Z' },
    { id: expertIds[1], email: 'expert2@consulting.com', password_hash: passwordHash, full_name: 'Dr. Lisa Nakamura', role: 'expert', organization: 'Policy Insights Consulting', bio: 'Independent evaluation specialist', created_at: '2025-01-25T13:00:00Z' },
  ];

  for (const user of users) {
    await client.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, organization, bio, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         organization = EXCLUDED.organization,
         bio = EXCLUDED.bio,
         updated_at = CURRENT_TIMESTAMP`,
      [user.id, user.email, user.password_hash, user.full_name, user.role, user.organization, user.bio, user.created_at]
    );
  }

  const actualUserIds = {};
  const userEmailRows = await client.query(
    `SELECT id, email FROM users WHERE email = ANY($1)`,
    [[
      'officer@govpilot.gov',
      'admin@govpilot.gov',
      'startup@staqu.com',
      'team@niramai.com',
      'hello@aerem.in',
      'support@kvalito.ai',
      'contact@nawadigital.in',
      'expert@university.edu',
      'expert2@consulting.com',
    ]]
  );

  for (const row of userEmailRows.rows) {
    actualUserIds[row.email] = row.id;
  }

  const actualGovId = actualUserIds['officer@govpilot.gov'] || govId;
  const actualAdminId = actualUserIds['admin@govpilot.gov'] || adminId;
  const actualStartupIds = {
    staqu: actualUserIds['startup@staqu.com'] || startupIds.staqu,
    niramai: actualUserIds['team@niramai.com'] || startupIds.niramai,
    aerem: actualUserIds['hello@aerem.in'] || startupIds.aerem,
    kvalito: actualUserIds['support@kvalito.ai'] || startupIds.kvalito,
    nawa: actualUserIds['contact@nawadigital.in'] || startupIds.nawa,
  };
  const actualExpertIds = [
    actualUserIds['expert@university.edu'] || expertIds[0],
    actualUserIds['expert2@consulting.com'] || expertIds[1],
  ];

  const challenges = [
    { id: challengeIds.triage, title: 'AI-Powered Citizen Request Triage', description: 'Implement an intelligent system to categorize and route citizen service requests to the appropriate government departments.', problem_statement: 'Citizens currently wait an average of 5 business days for their requests to be correctly routed. Manual triage is error-prone and creates bottlenecks.', desired_outcomes: 'Reduce routing time to under 1 hour, improve first-contact resolution by 40%, reduce misrouted requests by 60%.', success_criteria: '95% accuracy in request categorization, <1 hour average routing time, 40% reduction in processing time.', budget_range: '₹50L - ₹1.5Cr', duration_weeks: 12, status: 'open', priority: 'high', department: 'Citizen Services', contact_person: 'Sarah Chen', tags: 'AI, NLP, citizen-services, automation', ai_match_enabled: 1, min_expert_evaluations: 2, created_by: actualGovId, created_at: '2025-03-01T09:00:00Z' },
    { id: challengeIds.waste, title: 'Waste-to-Energy Monitoring Dashboard', description: 'Build a live digital monitoring dashboard for municipal waste segregation and treatment efficiency across facilities.', problem_statement: 'Cities need unified visibility into waste processing, treatment performance, and operational bottlenecks to reduce landfill dependency.', desired_outcomes: 'Improve diversion rate, reduce operational downtime, and automate reporting for every treatment plant.', success_criteria: '90% facility coverage, automated monthly reporting, at least 20% increase in processing efficiency.', budget_range: '₹30L - ₹80L', duration_weeks: 16, status: 'open', priority: 'medium', department: 'Urban Waste Management', contact_person: 'Sarah Chen', tags: 'waste, sustainability, dashboard, analytics', ai_match_enabled: 1, min_expert_evaluations: 2, created_by: actualGovId, created_at: '2025-03-04T11:00:00Z' },
    { id: challengeIds.water, title: 'Water Quality Alerting Network', description: 'Pilot a sensor and AI-powered water quality monitoring network for faster intervention and public reporting.', problem_statement: 'Municipal water systems lack a unified, timely view of contaminants, leakages, and treatment anomalies.', desired_outcomes: 'Reduce response time to quality events, improve treatment compliance, and support citizen transparency.', success_criteria: '95% sensor uptime, 48-hour incident response, automated public reporting for key contaminants.', budget_range: '₹75L - ₹2Cr', duration_weeks: 20, status: 'in_review', priority: 'critical', department: 'Water Resources', contact_person: 'Sarah Chen', tags: 'water, sensors, AI, public-health', ai_match_enabled: 1, min_expert_evaluations: 2, created_by: actualGovId, created_at: '2025-02-20T15:00:00Z' }
  ];

  for (const challenge of challenges) {
    await client.query(
      `INSERT INTO challenges (id, title, description, problem_statement, desired_outcomes, success_criteria, budget_range, duration_weeks, status, priority, department, contact_person, tags, ai_match_enabled, min_expert_evaluations, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         problem_statement = EXCLUDED.problem_statement,
         desired_outcomes = EXCLUDED.desired_outcomes,
         success_criteria = EXCLUDED.success_criteria,
         budget_range = EXCLUDED.budget_range,
         duration_weeks = EXCLUDED.duration_weeks,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         department = EXCLUDED.department,
         contact_person = EXCLUDED.contact_person,
         tags = EXCLUDED.tags,
         ai_match_enabled = EXCLUDED.ai_match_enabled,
         min_expert_evaluations = EXCLUDED.min_expert_evaluations,
         updated_at = CURRENT_TIMESTAMP`,
      [challenge.id, challenge.title, challenge.description, challenge.problem_statement, challenge.desired_outcomes, challenge.success_criteria, challenge.budget_range, challenge.duration_weeks, challenge.status, challenge.priority, challenge.department, challenge.contact_person, challenge.tags, challenge.ai_match_enabled, challenge.min_expert_evaluations, challenge.created_by, challenge.created_at]
    );
  }

  const proposals = [
    { id: proposalIds.staquTriage, challenge_id: challengeIds.triage, startup_id: actualStartupIds.staqu, title: 'CityTriage AI', description: 'AI-assisted citizen complaint routing engine for municipal workflows.', solution_approach: 'Hybrid NLP + rule engine with human review for edge cases and strict audit logs.', timeline_weeks: 10, budget_estimate: 8500000, team_description: '3 AI engineers, 2 backend engineers, 1 UX designer and 1 domain expert.', past_projects: 'Designed public safety monitoring and analytics suite for urban deployments.', innovation_score: 5, feasibility_score: 4, impact_score: 5, overall_score: 4.67, status: 'under_review', created_at: '2025-03-10T16:00:00Z' },
    { id: proposalIds.niramaiHealth, challenge_id: challengeIds.triage, startup_id: actualStartupIds.niramai, title: 'HealthFlow Intake', description: 'AI-enabled screening and triage platform for service requests and referral optimization.', solution_approach: 'Model-driven routing with healthcare-informed decision support and escalation automation.', timeline_weeks: 12, budget_estimate: 7200000, team_description: 'AI team of four, healthcare operations lead, and backend support.', past_projects: 'Built population health screening workflows and AI diagnostics pilots.', innovation_score: 4, feasibility_score: 5, impact_score: 4, overall_score: 4.33, status: 'submitted', created_at: '2025-03-12T09:00:00Z' },
    { id: proposalIds.aeremWaste, challenge_id: challengeIds.waste, startup_id: actualStartupIds.aerem, title: 'WasteSense Dashboard', description: 'Municipal waste collection and treatment monitoring dashboard with real-time anomaly detection.', solution_approach: 'Sensor integration, geospatial analytics, and a unified operations dashboard for plant managers.', timeline_weeks: 14, budget_estimate: 6000000, team_description: '2 data engineers, 2 full-stack developers, 1 domain expert on waste management.', past_projects: 'Built waste analytics monitoring solutions for industrial and civic infrastructure.', innovation_score: 4, feasibility_score: 4, impact_score: 5, overall_score: 4.33, status: 'shortlisted', created_at: '2025-03-16T10:00:00Z' },
    { id: proposalIds.kvalitoWater, challenge_id: challengeIds.water, startup_id: actualStartupIds.kvalito, title: 'AquaPulse Intelligence', description: 'Predictive water quality analytics for municipalities and public utility operators.', solution_approach: 'Realtime sensor network + predictive models to detect contamination and support faster interventions.', timeline_weeks: 18, budget_estimate: 12000000, team_description: 'ML engineers, utility systems specialists, and stakeholder engagement team.', past_projects: 'Built predictive operational monitoring systems across energy and civic networks.', innovation_score: 5, feasibility_score: 4, impact_score: 5, overall_score: 4.67, status: 'submitted', created_at: '2025-03-08T14:00:00Z' },
    { id: proposalIds.nawaWaste, challenge_id: challengeIds.waste, startup_id: actualStartupIds.nawa, title: 'UrbanWaste Flow', description: 'Operational intelligence and KPI tracking for city waste segregation and treatment plants.', solution_approach: 'Create a civic operations layer for route optimization, treatment performance, and compliance reporting.', timeline_weeks: 11, budget_estimate: 4200000, team_description: '3 engineers and one civic-tech operations specialist.', past_projects: 'Urban mobility and digital governance projects for municipal agencies.', innovation_score: 3, feasibility_score: 5, impact_score: 3, overall_score: 3.67, status: 'submitted', created_at: '2025-03-09T11:00:00Z' }
  ];

  for (const proposal of proposals) {
    await client.query(
      `INSERT INTO proposals (id, challenge_id, startup_id, title, description, solution_approach, timeline_weeks, budget_estimate, team_description, past_projects, innovation_score, feasibility_score, impact_score, overall_score, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET
         challenge_id = EXCLUDED.challenge_id,
         startup_id = EXCLUDED.startup_id,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         solution_approach = EXCLUDED.solution_approach,
         timeline_weeks = EXCLUDED.timeline_weeks,
         budget_estimate = EXCLUDED.budget_estimate,
         team_description = EXCLUDED.team_description,
         past_projects = EXCLUDED.past_projects,
         innovation_score = EXCLUDED.innovation_score,
         feasibility_score = EXCLUDED.feasibility_score,
         impact_score = EXCLUDED.impact_score,
         overall_score = EXCLUDED.overall_score,
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP`,
      [proposal.id, proposal.challenge_id, proposal.startup_id, proposal.title, proposal.description, proposal.solution_approach, proposal.timeline_weeks, proposal.budget_estimate, proposal.team_description, proposal.past_projects, proposal.innovation_score, proposal.feasibility_score, proposal.impact_score, proposal.overall_score, proposal.status, proposal.created_at]
    );
  }

  const pilotId = stableId('pilot:aerem-waste');
  await client.query(
    `INSERT INTO pilots (id, proposal_id, challenge_id, startup_id, status, start_date, end_date, budget_allocated, budget_spent, progress_percentage, summary, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO UPDATE SET
       proposal_id = EXCLUDED.proposal_id,
       challenge_id = EXCLUDED.challenge_id,
       startup_id = EXCLUDED.startup_id,
       status = EXCLUDED.status,
       start_date = EXCLUDED.start_date,
       end_date = EXCLUDED.end_date,
       budget_allocated = EXCLUDED.budget_allocated,
       budget_spent = EXCLUDED.budget_spent,
       progress_percentage = EXCLUDED.progress_percentage,
       summary = EXCLUDED.summary,
       updated_at = CURRENT_TIMESTAMP`,
    [pilotId, proposalIds.aeremWaste, challengeIds.waste, actualStartupIds.aerem, 'active', '2025-04-01T00:00:00Z', '2025-07-21T00:00:00Z', 6000000, 4100000, 62, 'Sensor deployment across 12 facilities complete.', '2025-04-01T00:00:00Z', '2025-06-15T00:00:00Z']
  );

  const kpiId = stableId('kpi:facility-sensor-coverage');
  await client.query(
    `INSERT INTO kpis (id, challenge_id, pilot_id, name, description, metric_type, unit, target_value, weight, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       challenge_id = EXCLUDED.challenge_id,
       pilot_id = EXCLUDED.pilot_id,
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       metric_type = EXCLUDED.metric_type,
       unit = EXCLUDED.unit,
       target_value = EXCLUDED.target_value,
       weight = EXCLUDED.weight`,
    [kpiId, null, pilotId, 'Facility Sensor Coverage', 'Percentage of facilities with live sensors.', 'quantitative', '%', 100, 1, '2025-04-01T00:00:00Z']
  );

  const snapshotId = stableId('snapshot:facility-sensor-coverage');
  await client.query(
    `INSERT INTO kpi_snapshots (id, kpi_id, pilot_id, reported_value, notes, reported_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       kpi_id = EXCLUDED.kpi_id,
       pilot_id = EXCLUDED.pilot_id,
       reported_value = EXCLUDED.reported_value,
       notes = EXCLUDED.notes,
       reported_by = EXCLUDED.reported_by`,
    [snapshotId, kpiId, pilotId, 83, '9 of 12 facilities online.', actualGovId, '2025-06-15T00:00:00Z']
  );
}

async function query(text, params) {
  if (!pool || databaseMode === 'memory') {
    return { rows: [], rowCount: 0 };
  }

  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

function getMemoryTable(table) {
  const normalized = table === 'activity_log' ? 'activity_log' : table;
  return memoryTables[normalized] || [];
}

async function getUserById(id) {
  if (!pool || databaseMode === 'memory') {
    return getMemoryTable('users').find((row) => row.id === id) || null;
  }
  const res = await query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function getUserByEmail(email) {
  if (!pool || databaseMode === 'memory') {
    return getMemoryTable('users').find((row) => row.email === email) || null;
  }
  const res = await query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0] || null;
}

async function getChallengeById(id) {
  if (!pool || databaseMode === 'memory') {
    return getMemoryTable('challenges').find((row) => row.id === id) || null;
  }
  const res = await query('SELECT * FROM challenges WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function getProposalById(id) {
  if (!pool || databaseMode === 'memory') {
    return getMemoryTable('proposals').find((row) => row.id === id) || null;
  }
  const res = await query('SELECT * FROM proposals WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function getPilotById(id) {
  if (!pool || databaseMode === 'memory') {
    return getMemoryTable('pilots').find((row) => row.id === id) || null;
  }
  const res = await query('SELECT * FROM pilots WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function insert(table, record) {
  if (!pool || databaseMode === 'memory') {
    const rows = getMemoryTable(table);
    const clone = { ...record, created_at: record.created_at || new Date().toISOString(), updated_at: record.updated_at || new Date().toISOString() };
    const idx = rows.findIndex((row) => row.id === clone.id);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...clone };
      return rows[idx];
    }
    rows.push(clone);
    return clone;
  }

  const keys = Object.keys(record);
  const values = Object.values(record);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const res = await query(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return res.rows[0];
}

async function update(table, id, changes) {
  if (!pool || databaseMode === 'memory') {
    const rows = getMemoryTable(table);
    const idx = rows.findIndex((row) => row.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...changes, updated_at: new Date().toISOString() };
    return rows[idx];
  }

  const keys = Object.keys(changes);
  if (keys.length === 0) return null;

  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(changes)];

  const res = await query(
    `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    values
  );
  return res.rows[0] || null;
}

async function remove(table, id) {
  if (!pool || databaseMode === 'memory') {
    const rows = getMemoryTable(table);
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return false;
    rows.splice(index, 1);
    return true;
  }

  const res = await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return (res.rowCount || 0) > 0;
}

async function getAll(table) {
  if (!pool || databaseMode === 'memory') {
    return [...getMemoryTable(table)];
  }

  const res = await query(`SELECT * FROM ${table}`);
  return res.rows;
}

async function count(table) {
  if (!pool || databaseMode === 'memory') {
    return getMemoryTable(table).length;
  }

  const res = await query(`SELECT COUNT(*) as count FROM ${table}`);
  return parseInt(res.rows[0].count, 10);
}

async function queryTable(table, predicate) {
  const rows = await getAll(table);
  return rows.filter(predicate);
}

async function logActivity(userId, action, entityType, entityId, details = null) {
  await insert('activity_log', {
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details ? JSON.stringify(details) : null,
  });
}

let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (pool && typeof pool.end === 'function') {
    await pool.end();
  }
}

const users = [];
const challenges = [];
const proposals = [];
const evaluations = [];
const pilots = [];
const kpis = [];
const kpiSnapshots = [];
const scaleDecisions = [];
const notifications = [];
const activityLog = [];

async function searchChallenges(queryStr = '') {
  const q = String(queryStr || '').trim().toLowerCase();
  const all = await getAll('challenges');
  if (!q) return all;

  return all.filter((c) => {
    const fields = [
      c.title,
      c.challenge_code,
      c.description,
      c.problem_statement,
      c.category,
      c.department,
      c.district,
      c.status,
    ];
    return fields.some((f) => String(f || '').toLowerCase().includes(q));
  });
}

async function saveAiAnalysis(challengeId, inputSnapshot, outputJson, provider = 'MockAIProvider', model = 'default', confidence = 85, createdBy = 'gov-user') {
  const record = {
    id: 'ANA-' + uuidv4().slice(0, 8),
    challenge_id: challengeId,
    input_snapshot: typeof inputSnapshot === 'object' ? JSON.stringify(inputSnapshot) : inputSnapshot,
    output_json: typeof outputJson === 'object' ? JSON.stringify(outputJson) : outputJson,
    provider,
    model,
    confidence,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
  await insert('ai_challenge_analyses', record);
  await logActivity(createdBy, 'ai_analysis_generated', 'challenge', challengeId, { confidence, provider });
  return record;
}

async function getAiHistory(challengeId) {
  const all = await getAll('ai_challenge_analyses');
  return all
    .filter((a) => a.challenge_id === challengeId)
    .map((a) => ({
      ...a,
      input_snapshot: typeof a.input_snapshot === 'string' ? JSON.parse(a.input_snapshot) : a.input_snapshot,
      output_json: typeof a.output_json === 'string' ? JSON.parse(a.output_json) : a.output_json,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

async function publishChallenge(id, publishedBy = 'gov-user') {
  const now = new Date().toISOString();
  const updated = await update('challenges', id, {
    status: 'published',
    published_at: now,
    published_by: publishedBy,
  });
  if (updated) {
    await logActivity(publishedBy, 'published_challenge', 'challenge', id, { published_at: now });
  }
  return updated;
}

async function addChallengeReview(reviewData) {
  const record = {
    id: 'REV-' + uuidv4().slice(0, 8),
    challenge_id: reviewData.challenge_id,
    reviewer_id: reviewData.reviewer_id || 'expert-user',
    reviewer_name: reviewData.reviewer_name || 'Expert Reviewer',
    reviewer_role: reviewData.reviewer_role || 'expert',
    rating: Number(reviewData.rating || 5),
    comment: reviewData.comment || '',
    is_private: reviewData.is_private ?? false,
    created_at: new Date().toISOString(),
  };
  await insert('challenge_reviews', record);
  await logActivity(record.reviewer_id, 'added_challenge_review', 'challenge', record.challenge_id, { rating: record.rating });
  return record;
}

async function getChallengeReviews(challengeId, role = 'startup') {
  const all = await getAll('challenge_reviews');
  const forChallenge = all.filter((r) => r.challenge_id === challengeId);
  if (['government', 'expert', 'admin'].includes(role)) {
    return forChallenge;
  }
  // Startups see public reviews only
  return forChallenge.filter((r) => !r.is_private);
}

module.exports = {
  users,
  challenges,
  proposals,
  evaluations,
  pilots,
  kpis,
  kpiSnapshots,
  scaleDecisions,
  notifications,
  activityLog,
  getUserById,
  getUserByEmail,
  getChallengeById,
  getProposalById,
  getPilotById,
  insert,
  update,
  remove,
  getAll,
  count,
  query: queryTable,
  logActivity,
  searchChallenges,
  saveAiAnalysis,
  getAiHistory,
  publishChallenge,
  addChallengeReview,
  getChallengeReviews,
  passwordHash: bcrypt.hashSync('password123', 10),
  pool,
  shutdown,
  initDb
};
