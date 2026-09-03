CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gov', 'startup', 'expert')),
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS startups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  dpiit_number TEXT,
  trl_level INTEGER DEFAULT 0,
  tech_stack TEXT[] DEFAULT '{}',
  turnover NUMERIC(16,2) DEFAULT 0,
  team_size INTEGER DEFAULT 0,
  past_gov_projects JSONB DEFAULT '[]'::jsonb,
  verified_status TEXT DEFAULT 'pending' CHECK (verified_status IN ('pending','approved','rejected','flagged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  created_by_gov_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  keywords TEXT[] DEFAULT '{}',
  budget NUMERIC(16,2) DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_review','approved','rejected','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  startup_id TEXT NOT NULL REFERENCES startups(id),
  original_pdf_url TEXT,
  extracted_text TEXT,
  deliverables JSONB DEFAULT '[]'::jsonb,
  success_score NUMERIC(5,2) DEFAULT 0,
  masked_proposal_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals(id),
  title TEXT NOT NULL,
  deliverable TEXT NOT NULL,
  deadline_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals(id),
  expert_id TEXT NOT NULL REFERENCES users(id),
  score NUMERIC(5,2) DEFAULT 0,
  feedback TEXT,
  is_blind BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_startups_user ON startups(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_proposals_challenge ON proposals(challenge_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_proposal ON evaluations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_proposal ON milestones(proposal_id);
