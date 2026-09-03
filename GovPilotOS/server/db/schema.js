const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = path.join(__dirname, 'govpilot.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('government', 'startup', 'expert', 'admin')),
    organization TEXT,
    bio TEXT,
    expertise TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (startup_id) REFERENCES users(id)
  );

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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (expert_id) REFERENCES users(id),
    UNIQUE(proposal_id, expert_id)
  );

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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (startup_id) REFERENCES users(id)
  );

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
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (pilot_id) REFERENCES pilots(id)
  );

  CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id TEXT PRIMARY KEY,
    kpi_id TEXT NOT NULL,
    pilot_id TEXT NOT NULL,
    reported_value REAL,
    reported_text TEXT,
    notes TEXT,
    reported_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (kpi_id) REFERENCES kpis(id),
    FOREIGN KEY (pilot_id) REFERENCES pilots(id),
    FOREIGN KEY (reported_by) REFERENCES users(id)
  );

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
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (pilot_id) REFERENCES pilots(id),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (decided_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    related_id TEXT,
    related_type TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
  CREATE INDEX IF NOT EXISTS idx_proposals_challenge ON proposals(challenge_id);
  CREATE INDEX IF NOT EXISTS idx_evaluations_proposal ON evaluations(proposal_id);
  CREATE INDEX IF NOT EXISTS idx_pilots_proposal ON pilots(proposal_id);
  CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_pilot ON kpi_snapshots(pilot_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`);

console.log('Database schema initialized successfully');
