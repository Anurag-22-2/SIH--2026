# GovPilot OS - Complete File Listing & Summary

## Directory Tree
```
GovPilotOS/
├── package.json                 # Project config, dependencies
├── .gitignore                   # Git ignore rules
│
├── public/                      # Static assets (fallback UI)
│   ├── index.html              # Fallback login/auth page
│   ├── css/
│   │   └── styles.css          # Fallback styling
│   └── js/
│       └── app.js              # Fallback client logic
│
├── server/                      # Backend - Express.js
│   ├── index.js                # Main server entry point
│   ├── .env                    # Environment variables
│   │
│   ├── middleware/
│   │   └── auth.js             # JWT auth, role authorization
│   │
│   ├── db/
│   │   ├── schema.js           # SQLite3 schema & initialization
│   │   ├── schema_postgres.sql # PostgreSQL schema (alternative)
│   │   ├── seed.js             # Demo data seeding
│   │   └── store.js            # PostgreSQL connection & queries
│   │
│   └── routes/                 # API endpoints
│       ├── auth.js             # /api/auth - login, register, me
│       ├── challenges.js       # /api/challenges - CRUD operations
│       ├── proposals.js        # /api/proposals - submit, review
│       ├── evaluations.js      # /api/evaluations - expert scoring
│       ├── pilots.js           # /api/pilots - pilot lifecycle
│       ├── kpis.js             # /api/kpis - key performance indicators
│       ├── admin.js            # /api/admin - administration
│       └── ai.js               # /api/ai - AI matching engine
│
└── web/                        # Frontend - Next.js + React
    ├── package.json            # Frontend dependencies
    ├── tsconfig.json           # TypeScript config
    ├── next.config.mjs         # Next.js config
    ├── tailwind.config.js      # Tailwind CSS config
    ├── postcss.config.js       # PostCSS config
    ├── .env.example            # Example env vars
    │
    ├── app/
    │   ├── layout.tsx          # Root layout & metadata
    │   ├── page.tsx            # Home page (mounts AppShell)
    │   └── globals.css         # Global Tailwind styles
    │
    ├── src/
    │   ├── components/
    │   │   ├── app-shell.tsx           # Main app container & role switcher
    │   │   ├── government-dashboard.tsx # Gov officer dashboard
    │   │   ├── startup-portal.tsx       # Startup proposal interface
    │   │   ├── expert-evaluation.tsx    # Expert scoring panel
    │   │   ├── admin-console.tsx        # Admin panel
    │   │   ├── procurement-scale-up.tsx # Scale-up decisions
    │   │   ├── startup-registration.tsx # DPIIT compliance form
    │   │   ├── shared.tsx              # Shared UI (badges, charts)
    │   │   └── ui.tsx                  # Base UI components
    │   │
    │   └── lib/
    │       ├── types.ts         # TypeScript domain models
    │       ├── api.ts           # API facade with fallback
    │       ├── store.ts         # In-memory mock store
    │       ├── mock-data.ts     # Demo dataset
    │       ├── derive.ts        # Data transformation logic
    │       └── utils.ts         # Utility functions
    │
    └── .next/                  # Build output (Next.js)
```

---

## Backend File Details

### `server/index.js` (109 lines)
**Purpose:** Express.js server entry point
**Key Features:**
- Initializes Express app on port 5000
- CORS enabled for all origins
- Mounts all API routes
- Serves static files from `public/`
- Dashboard endpoint: `/api/dashboard` (statistics)
- Database initialization on startup
- Graceful shutdown (SIGINT/SIGTERM)
- Demo account credentials in console output

**Dependencies:** express, cors, path, db, auth middleware

---

### `server/db/schema.js` (189 lines)
**Purpose:** SQLite3 database schema initialization
**Tables Created:**
1. **users** - email, password_hash, full_name, role, organization, bio, expertise
2. **challenges** - title, description, problem_statement, desired_outcomes, success_criteria, budget_range, duration_weeks, status, priority, department, contact_person, tags, ai_match_enabled, min_expert_evaluations, created_by
3. **proposals** - challenge_id, startup_id, title, description, solution_approach, timeline_weeks, budget_estimate, team_description, past_projects, innovation_score, feasibility_score, impact_score, overall_score, status, submission_notes
4. **evaluations** - proposal_id, expert_id, innovation_score, feasibility_score, impact_score, overall_comment, recommendation, confidence_level
5. **pilots** - proposal_id, challenge_id, startup_id, status, start_date, end_date, budget_allocated, budget_spent, progress_percentage, summary, outcomes, lessons_learned
6. **kpis** - challenge_id, pilot_id, name, description, metric_type, unit, target_value, target_description, weight
7. **kpi_snapshots** - kpi_id, pilot_id, reported_value, reported_text, notes, reported_by
8. **scale_decisions** - pilot_id, proposal_id, challenge_id, decision, reasoning, next_steps, budget_allocated, timeline_months, decided_by
9. **notifications** - user_id, title, message, type, related_id, related_type, read
10. **activity_log** - user_id, action, entity_type, entity_id, details

**Indexes:**
- challenges(status)
- proposals(challenge_id)
- evaluations(proposal_id)
- pilots(proposal_id)
- kpi_snapshots(pilot_id)
- notifications(user_id)

---

### `server/db/store.js` (200+ lines)
**Purpose:** PostgreSQL data access layer
**Key Functions:**
- `initDb()` - Create schema and seed demo data
- `insert(table, data)` - Insert record
- `update(table, id, data)` - Update record
- `remove(table, id)` - Delete record
- `query(sql)` - Execute raw SQL
- `getAll(table)` - Fetch all records
- `getChallengeById(id)` - Get challenge by ID
- `getProposalById(id)` - Get proposal by ID
- `getUserById(id)` - Get user by ID
- `getUserByEmail(email)` - Get user by email
- `logActivity(userId, action, entityType, entityId, details)` - Log action

**Configuration:**
- Environment: `DATABASE_URL`
- Pool: max 20 connections, 30s idle timeout
- SSL: Enabled with `rejectUnauthorized: false`

---

### `server/db/seed.js` (100+ lines)
**Purpose:** Populate demo data
**Demo Users:**
- Sarah Chen (government officer)
- James Wilson (admin)
- Alex Rivera (startup - InnovateAI)
- Priya Patel (startup - GreenTech)
- Dr. Michael Torres (expert)
- Dr. Lisa Nakamura (expert)
- Dr. Kevin O'Brien (startup - HealthBridge)

**Demo Challenges:**
- AI-Powered Citizen Request Triage (open, high priority)
- Carbon Footprint Tracking Dashboard (open, medium priority)
- Blockchain Land Registry Pilot (in_review, critical priority)

---

### `server/middleware/auth.js` (39 lines)
**Purpose:** Authentication and authorization
**JWT Secret:** `govpilot-secret-key-2025`
**Key Functions:**
- `authenticate(req, res, next)` - Verify JWT token
- `authorize(...roles)` - Check role-based access
- `logActivity(userId, action, entityType, entityId, details)` - Log action
- Token format: `Bearer <token>`

---

### `server/routes/auth.js` (86 lines)
**Endpoints:**
- `POST /register` - New user registration
- `POST /login` - User login (returns JWT)
- `GET /me` - Current user profile
- Password hashing: bcryptjs (10 rounds)
- Token expiration: 7 days
- Fallback: Demo user if no auth header

---

### `server/routes/challenges.js` (100+ lines)
**Endpoints:**
- `GET /` - List challenges (can filter by status, proposal_id)
- `GET /:id` - Get single challenge
- `POST /` - Create challenge (gov/admin only)
- `PUT /:id` - Update challenge (gov/admin only)
- `DELETE /:id` - Delete challenge (gov/admin only)

**Data Returned:**
- Challenge object with all fields
- Created_by user ID
- Timestamps (created_at, updated_at)

---

### `server/routes/proposals.js` (100+ lines)
**Endpoints:**
- `GET /challenge/:challengeId` - Get proposals for challenge
- `GET /:id` - Get single proposal
- `POST /` - Submit proposal (startup only)
- `PUT /:id/status` - Update proposal status
- All times in ISO format

**Features:**
- Join with user table to get startup name/org
- Startup can only see own proposals
- Status transitions: submitted → under_review → shortlisted|rejected → piloting|completed|scaled

---

### `server/routes/evaluations.js`
**Endpoints:**
- Expert evaluation submission
- Scoring criteria: innovation, feasibility, impact (1-5)
- Recommendation: strongly_reject, reject, neutral, accept, strongly_accept
- Confidence level (1-5)
- One evaluation per expert per proposal (unique constraint)

---

### `server/routes/pilots.js`
**Endpoints:**
- Pilot creation from proposals
- Status tracking: planned → active → paused|completed|terminated|scaled
- Budget tracking (allocated vs spent)
- Progress percentage
- Outcomes and lessons learned

---

### `server/routes/kpis.js`
**Endpoints:**
- KPI definition for challenges/pilots
- Metric types: quantitative, qualitative, milestone
- Target value with unit
- Weight for aggregation
- KPI snapshots for historical tracking

---

### `server/routes/admin.js`
**Endpoints:**
- Platform administration functions
- Configuration management
- Milestone settings
- Legal templates

---

### `server/routes/ai.js`
**Endpoints:**
- AI-powered challenge-to-proposal matching
- Recommendation engine

---

## Frontend File Details

### `web/app/layout.tsx` (20 lines)
**Purpose:** Root layout component
**Metadata:**
- Title: "GovPilot OS · MSINS Innovation Pilot Platform"
- Description: Outcome-based civic innovation pilot platform
**Structure:**
- HTML lang="en"
- Links globals.css
- Renders {children}

---

### `web/app/page.tsx` (5 lines)
**Purpose:** Home page
**Content:**
- Renders `<AppShell />` component
- Single page application entry

---

### `web/app/globals.css` (Multiple lines)
**Content:**
- Tailwind CSS imports
- Global utility classes
- Base typography
- Color scheme

---

### `web/src/lib/types.ts` (500+ lines)
**Key Interfaces:**

#### Role System
```typescript
type Role = "government" | "startup" | "expert" | "admin";
type Sector = "PWD" | "Urban Waste" | "Water Quality";
```

#### User
- Email, password_hash, full_name, role
- Startup compliance: DPIIT, CIN, GST, Udyam, financial data
- Expert domains: expertise

#### Challenge
- Title, description, problem_statement
- Desired outcomes, success criteria
- Budget range, duration weeks
- Status, priority, department
- Eligibility requirements (DPIIT, TRL, location)
- Outcome targets (baseline, target, measurement)

#### Proposal
- Challenge ID, startup ID
- Title, description, solution approach
- Timeline, budget estimate, team description
- Scores: innovation, feasibility, impact (1-5)
- Status tracking

#### Evaluation
- Scores for three criteria (1-5)
- Recommendation types
- Confidence level
- Overall comment

#### Pilot
- Proposal, challenge, startup IDs
- Status, start/end dates
- Budget (allocated, spent)
- Progress percentage
- Outcomes, lessons learned

#### KPI
- Challenge/pilot ID
- Name, description
- Metric type, unit, target
- Weight for aggregation

#### Milestone
- Payment milestone tracking
- Evidence collection
- Sequence and dates

#### ScaleDecision
- Decision: procure, scale_pilot, iterate, reject
- Budget and timeline allocation
- Reasoning and next steps

---

### `web/src/lib/api.ts` (300+ lines)
**Purpose:** API facade with fallback pattern
**Key Functions:**

**Session:**
- `fetchCurrentUser()` - Get profile
- `switchRole(role)` - Change user role
- `signInAs(userId)` - Switch user (admin)

**Challenges:**
- `fetchChallenges()` - Get all challenges
- `fetchChallenge(id)` - Get single challenge
- `createChallenge(data)` - Create challenge
- `updateChallenge(id, data)` - Update challenge
- `deleteChallenge(id)` - Delete challenge

**Proposals:**
- `fetchProposals(challengeId)` - Get proposals
- `fetchProposal(id)` - Get single proposal
- `createProposal(data)` - Submit proposal
- `setProposalStatus(id, status)` - Update status

**Evaluations:**
- `fetchEvaluations(proposalId)` - Get evaluations
- `submitEvaluation(data)` - Expert scoring

**Pilots:**
- `fetchPilots()` - Get all pilots
- `fetchPilot(id)` - Get single pilot
- `createPilotFromProposal(proposalId)` - Launch pilot
- `updatePilotStatus(id, status)` - Update status

**KPIs:**
- `fetchKpis(pilotId)` - Get KPIs
- `submitKpiSnapshot(data)` - Record measurement

**Dashboard:**
- `fetchDashboard()` - Aggregated view

**Experts:**
- `fetchExperts()` - Get expert list
- `assignExperts(proposalId, expertIds)` - Assign evaluators

**Administration:**
- `resetDemoData()` - Reset to demo state
- `setMilestones()`, `setLegalTemplates()` - Admin config

**Fallback Pattern:**
- Try live fetch to http://localhost:5000/api
- On error/timeout, use in-memory mock store
- Allows demo without backend

---

### `web/src/lib/store.ts` (400+ lines)
**Purpose:** In-memory mock store with full app functionality
**Key Features:**
- Seeded from mock-data.ts
- Mutations directly on memory state
- Activity logging
- User switching

**Functions:**

**State Management:**
- `getCurrentUser()` - Active user
- `setCurrentUserId(id)` - Switch user
- `setCurrentRole(role)` - Switch by role
- `getRawData()` - Access all data

**Data Operations:**
- `listUsers(role)` - Filter users
- `createChallenge(data)` - Create challenge
- `createProposal(data)` - Submit proposal
- `submitEvaluation(data)` - Score proposal
- `createPilot(proposalId)` - Launch pilot
- `setProposalStatus(proposalId, status)` - Update status
- `releaseMilestonePayment(pilotId, milestoneId)` - Mark complete

**Activity Logging:**
- `log(action, entityType, entityId, details)` - Record action
- All actions timestamped and attributed to user

---

### `web/src/lib/mock-data.ts` (500+ lines)
**Purpose:** Seed dataset for full app demo
**Content:**

**Users (7 total):**
- Government: Sarah Chen (officer@govpilot.gov)
- Startups: Alex Rivera, Priya Patel, Dr. Kevin O'Brien
- Experts: Dr. Michael Torres, Dr. Lisa Nakamura
- Admin: James Wilson

**Challenges (5+ total):**
- AI-Powered Citizen Request Triage
- Carbon Footprint Tracking
- Blockchain Land Registry
- Water Distribution Optimization
- Smart Traffic Management

**Proposals (Multiple per challenge):**
- Various statuses: submitted, under_review, shortlisted, piloting
- Different budget estimates
- Team descriptions

**Evaluations:**
- Expert scores for proposals
- Recommendations and confidence levels
- Average aggregation

**Pilots:**
- Active pilots with progress tracking
- Budget allocation
- KPI definitions
- Outcomes documented

**Milestone Structure:**
- Pre-defined sequence
- Evidence tracking
- Payment conditions

---

### `web/src/lib/derive.ts` (150+ lines)
**Purpose:** Transform raw data for dashboard display
**Key Functions:**
- `buildPilotViews()` - Create enriched pilot objects
- `aggregateDashboard()` - Combine entities for dashboard
- `calculateScores()` - Aggregate evaluation scores
- `filterAndSort()` - Query and sort operations

---

### `web/src/lib/utils.ts` (50+ lines)
**Utilities:**
- `cn()` - Tailwind class merging
- `formatInrCompact()` - Currency formatting (₹)
- `humanise()` - Human-readable text
- `initials()` - Extract user initials
- `formatDate()` - Date formatting
- `formatPercent()` - Percentage formatting

---

### `web/src/components/app-shell.tsx` (150+ lines)
**Purpose:** Main application container
**Components:**
- Header with branding and user profile
- Role navigation tabs (Government, Startup, Expert, Admin)
- Main content area
- Footer with platform info
- Startup registration modal

**Features:**
- Role switching (4 roles)
- User display with initials
- Reset demo data button
- Context-aware role capabilities

---

### `web/src/components/government-dashboard.tsx` (400+ lines)
**Purpose:** Government officer interface
**Features:**
- **Challenge Management**
  - Create new challenges
  - Edit existing challenges
  - Search and filter
  - Status tracking

- **Proposal Review**
  - View proposals for challenges
  - Score and shortlist
  - Assign expert evaluators
  - Track evaluation status

- **Pilot Oversight**
  - Create pilots from shortlisted proposals
  - Track budget (allocated vs spent)
  - Monitor progress percentage
  - View KPI performance
  - Release milestone payments

- **Dashboard Statistics**
  - Open challenges count
  - Proposals in review count
  - Active pilots count
  - Total budget spend

**Search & Filter:**
- Query across: title, challenge_code, sector, department, problem_statement, district
- Real-time filtering

---

### `web/src/components/startup-portal.tsx` (350+ lines)
**Purpose:** Startup interface
**Features:**
- **Challenge Discovery**
  - Search open challenges
  - Filter by sector, department, budget
  - View challenge details
  - Check eligibility criteria

- **Proposal Submission**
  - Form with: title, description, solution approach
  - Timeline weeks, budget estimate
  - Team description, past projects

- **Compliance Registration**
  - DPIIT number and verification
  - Company details (CIN, GST)
  - Udyam registration
  - Financial data (P&L)
  - Team size

- **Proposal Tracking**
  - View own proposals
  - Track status progression
  - View evaluation feedback
  - Track pilot participation
  - Payment milestone tracking

---

### `web/src/components/expert-evaluation.tsx` (300+ lines)
**Purpose:** Expert evaluator interface
**Features:**
- **Evaluation Panel**
  - List of proposals to evaluate
  - Filter by status, challenge
  
- **Scoring Interface**
  - Innovation score (1-5)
  - Feasibility score (1-5)
  - Impact score (1-5)
  - Overall comment field
  - Recommendation dropdown
  - Confidence level (1-5)

- **Evaluation Management**
  - View evaluation history
  - Edit in-progress evaluations
  - See average scores
  - Track recommendation impact

---

### `web/src/components/admin-console.tsx` (300+ lines)
**Purpose:** Platform administration
**Features:**
- **Milestone Configuration**
  - Define payment milestones
  - Set evidence requirements
  - Configure release conditions

- **Legal Templates**
  - Manage agreement templates
  - Version control
  - Deployment tracking

- **Scale-up Pathway**
  - GeM integration config
  - Procurement templates
  - Scale decision workflows

- **User Management**
  - View all users
  - Role assignments
  - Compliance tracking

---

### `web/src/components/procurement-scale-up.tsx` (250+ lines)
**Purpose:** Post-pilot scale-up decisions
**Features:**
- **Decision Workflow**
  - Decision types: procure, scale_pilot, iterate, reject
  - Reasoning field
  - Next steps documentation
  - Budget allocation
  - Timeline months

- **GeM Integration**
  - Link to e-marketplace
  - Procurement specifications
  - Supplier selection

- **Audit Trail**
  - Decision history
  - Who decided, when
  - Change tracking

---

### `web/src/components/startup-registration.tsx` (200+ lines)
**Purpose:** DPIIT compliance form
**Modal-based Form:**
- DPIIT registration number
- Verification status
- Company details:
  - CIN (Corporate Identification Number)
  - GST IN
  - Incorporation year
- Udyam/MSME registration
- Team size
- Financial information:
  - Profit/Loss period (e.g., "FY 2025-26")
  - Annual turnover
  - Annual profit/loss
  - Document upload

---

### `web/src/components/shared.tsx` (300+ lines)
**Shared Components:**
- `StatusBadge` - Status visual indicator
- `ScoreChip` - Score display (colored)
- `SectorBadge` - Sector label
- `AchievementBar` - Progress bar
- `MilestoneStrip` - Timeline view
- `CriterionBars` - Comparative scores
- `KpiRow` - KPI display with progress
- `Chips` - Tag rendering

---

### `web/src/components/ui.tsx` (400+ lines)
**Base UI Components:**
- `Button` - Variants: primary, secondary, outline, ghost, danger
- `Card` - Container with shadow
- `Dialog` - Modal dialog
- `Table` - Data table
- `Tabs` - Tab navigation
- `Badge` - Inline badge/label
- `Field` - Form field wrapper
- `Textarea` - Multi-line text input
- `SectionLabel` - Section heading
- `StatCard` - Statistic card
- `EmptyState` - Empty state placeholder
- `Loading` - Loading skeleton
- `Tag` - Individual tag
- `Skeleton` - Loading shimmer

All styled with Tailwind CSS

---

## Environment Files

### `.env` (Backend)
```
DATABASE_URL=postgresql://user:password@localhost:5432/govpilot
PORT=5000
NODE_ENV=development
```

### `.env.example` (Frontend)
Currently no required environment variables (API base hardcoded to localhost:5000)

---

## Configuration Files

### `server/package.json`
**Dependencies:**
- bcryptjs 2.4.3 (password hashing)
- better-sqlite3 13.0.3 (dev database)
- cors 2.8.6 (cross-origin)
- dotenv 17.4.2 (env vars)
- express 4.22.2 (web framework)
- jsonwebtoken 9.0.3 (JWT)
- pg 8.23.0 (PostgreSQL driver)
- uuid 9.0.1 (ID generation)

**Scripts:**
- `npm run start` - Run server
- `npm run dev` - Dev mode
- `npm run init-db` - Initialize database

---

### `web/package.json`
**Dependencies:**
- next 14.2.5
- react 18.3.1
- react-dom 18.3.1

**Dev Dependencies:**
- TypeScript 5.5.3
- Tailwind CSS 3.4.6
- PostCSS 8.4.39
- Autoprefixer 10.4.19

**Scripts:**
- `npm run dev` - Dev server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Run linter

---

### `web/tsconfig.json`
- ES2020 target
- JSX: react-jsx
- Strict mode enabled
- Path alias: @/* → src/*

---

### `web/next.config.mjs`
Standard Next.js configuration

---

### `web/tailwind.config.js`
- Color scheme (slate-based)
- Custom spacing
- Plugin configuration

---

## Static Assets

### `public/index.html` (69 lines)
**Fallback UI:**
- Authentication forms (login/register tabs)
- Dashboard skeleton (sidebar + main content)
- Demo credentials display

### `public/js/app.js`
**Fallback Client:**
- Authentication handling
- Role switching
- Dashboard rendering
- Fallback when Next.js unavailable

### `public/css/styles.css`
**Fallback Styling:**
- Layout styles
- Auth page styling
- Dashboard layout
- Responsive design

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Backend Routes | 8 (auth, challenges, proposals, evaluations, pilots, kpis, admin, ai) |
| Database Tables | 10 |
| Frontend Components | 9 |
| UI Base Components | 15+ |
| Utility Modules | 6 |
| API Functions | 50+ |
| Store Functions | 30+ |
| Demo Users | 7 |
| Demo Challenges | 5+ |
| TypeScript Interfaces | 20+ |
| Lines of Code (Backend) | 1000+ |
| Lines of Code (Frontend) | 3000+ |

---

## Key Workflow Integration

1. **Challenge → Proposal → Evaluation → Pilot → Scale**
   - Challenge created by government officer
   - Startups submit proposals
   - Experts evaluate (min 2 required)
   - Top proposals become pilots
   - Post-pilot: scale, iterate, or reject

2. **Payment Milestone Tracking**
   - Defined at proposal stage
   - Tracked during pilot execution
   - Released on evidence completion
   - Recorded in activity log

3. **KPI Measurement**
   - Defined at challenge creation
   - Tracked via snapshots during pilot
   - Expert assessment
   - Outcome documentation

4. **Compliance Verification**
   - DPIIT registration for startups
   - GST/CIN verification
   - Udyam registration
   - Financial data tracking
   - All in startup-registration component

5. **Audit & Activity Logging**
   - Every action logged
   - User attribution
   - Timestamps
   - Entity references
   - Detailed description for all changes

---

End of File Listing
