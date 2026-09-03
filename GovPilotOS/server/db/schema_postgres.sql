-- GovPilot OS PostgreSQL Schema
-- Digital platform for government-startup innovation pilots

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('government', 'startup', 'expert', 'admin')),
    organization VARCHAR(255),
    bio TEXT,
    expertise TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenges table
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    desired_outcomes TEXT NOT NULL,
    success_criteria TEXT NOT NULL,
    budget_range VARCHAR(100),
    duration_weeks INTEGER,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'piloting', 'closed', 'cancelled')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    department VARCHAR(255),
    contact_person VARCHAR(255),
    tags TEXT,
    ai_match_enabled BOOLEAN DEFAULT TRUE,
    min_expert_evaluations INTEGER DEFAULT 2,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proposals table
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id),
    startup_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    solution_approach TEXT NOT NULL,
    timeline_weeks INTEGER NOT NULL,
    budget_estimate DECIMAL(12,2) NOT NULL,
    team_description TEXT NOT NULL,
    past_projects TEXT,
    innovation_score INTEGER CHECK (innovation_score >= 1 AND innovation_score <= 5),
    feasibility_score INTEGER CHECK (feasibility_score >= 1 AND feasibility_score <= 5),
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 5),
    overall_score DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'rejected', 'piloting', 'completed', 'scaled')),
    submission_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (startup_id) REFERENCES users(id)
);

-- Evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    expert_id UUID NOT NULL REFERENCES users(id),
    innovation_score INTEGER NOT NULL CHECK (innovation_score >= 1 AND innovation_score <= 5),
    feasibility_score INTEGER NOT NULL CHECK (feasibility_score >= 1 AND feasibility_score <= 5),
    impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 5),
    overall_comment TEXT,
    recommendation VARCHAR(50) CHECK (recommendation IN ('strongly_reject', 'reject', 'neutral', 'accept', 'strongly_accept')),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proposal_id, expert_id),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- Pilots table
CREATE TABLE pilots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    challenge_id UUID NOT NULL REFERENCES challenges(id),
    startup_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'terminated', 'scaled')),
    start_date DATE,
    end_date DATE,
    budget_allocated DECIMAL(12,2),
    budget_spent DECIMAL(12,2) DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    summary TEXT,
    outcomes TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPIs table
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id),
    pilot_id UUID REFERENCES pilots(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('quantitative', 'qualitative', 'milestone')),
    unit VARCHAR(50),
    target_value DECIMAL(12,4),
    target_description TEXT,
    weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (pilot_id) REFERENCES pilots(id) ON DELETE CASCADE
);

-- KPI Snapshots table (stores measurements over time)
CREATE TABLE kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    reported_value DECIMAL(12,4),
    reported_text TEXT,
    notes TEXT,
    reported_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scale Decisions table
CREATE TABLE scale_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilot_id UUID NOT NULL REFERENCES pilots(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    challenge_id UUID NOT NULL REFERENCES challenges(id),
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('procure', 'scale_pilot', 'iterate', 'reject')),
    reasoning TEXT,
    next_steps TEXT,
    budget_allocated DECIMAL(12,2),
    timeline_months INTEGER,
    decided_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    related_id UUID,
    related_type VARCHAR(100),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log table
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_priority ON challenges(priority);
CREATE INDEX idx_challenges_created_by ON challenges(created_by);
CREATE INDEX idx_proposals_challenge ON proposals(challenge_id);
CREATE INDEX idx_proposals_startup ON proposals(startup_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_evaluations_proposal ON evaluations(proposal_id);
CREATE INDEX idx_evaluations_expert ON evaluations(expert_id);
CREATE INDEX idx_pilots_proposal ON pilots(proposal_id);
CREATE INDEX idx_pilots_status ON pilots(status);
CREATE INDEX idx_kpis_challenge ON kpis(challenge_id);
CREATE INDEX idx_kpis_pilot ON kpis(pilot_id);
CREATE INDEX idx_kpi_snapshots_pilot ON kpi_snapshots(pilot_id);
CREATE INDEX idx_kpi_snapshots_kpi ON kpi_snapshots(kpi_id);
CREATE INDEX idx_kpi_snapshots_created ON kpi_snapshots(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_scale_decisions_pilot ON scale_decisions(pilot_id);
